import test from "node:test";
import assert from "node:assert/strict";
import { parseAuditInput, parseMcpConfig, parseOAuthUrl, parseTakeout } from "../../packages/engine/index.ts";

test("OAuth parsing decodes once, merges repeated scopes, and keeps PKCE/state presence", () => {
  const parsed = parseOAuthUrl("https://accounts.google.com/o/oauth2/v2/auth?client_id=app&redirect_uri=https%3A%2F%2Fapp.example%2Fcb%3Fx%3D1&scope=openid+email&scope=email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&response_type=code&access_type=offline&code_challenge=a%2Bb&code_challenge_method=S256&state=s");
  assert.deepEqual(parsed, {
    provider: "google", client_id: "app", redirect_uri: "https://app.example/cb?x=1",
    requested_scopes: ["email", "https://www.googleapis.com/auth/drive", "openid"], response_type: "code", access_type: "offline",
    has_pkce: true, code_challenge_method: "S256", state_present: true,
  });
  assert.equal(parseOAuthUrl("https://github.com/login/oauth/authorize?scope=repo,workflow+repo").requested_scopes.join(" "), "repo workflow");
  assert.equal(parseOAuthUrl("https://login.microsoftonline.com/tenant/oauth2/v2.0/authorize?scope=Mail.ReadWrite").provider, "microsoft");
  assert.deepEqual(parseOAuthUrl("https://slack.com/oauth/v2/authorize?scope=channels:read&user_scope=admin").requested_scopes, ["admin", "channels:read"]);
});

test("OAuth parsing rejects unsafe or ambiguous URLs without reflecting the payload", () => {
  for (const raw of ["not a URL", "javascript:alert(1)", "http://github.com/login/oauth/authorize?scope=repo",
    "https://user:password@github.com/login/oauth/authorize?scope=repo", "https://github.com/login/oauth/authorize?scope=repo#access_token=secret",
    "https://github.com/login/oauth/authorize?client_id=one&client_id=two", "https://github.com/"]) {
    assert.throws(() => parseOAuthUrl(raw), error => error instanceof Error && !error.message.includes(raw));
  }
  assert.equal(parseOAuthUrl("https://github.com.attacker.example/login/oauth/authorize?scope=repo").provider, "generic");
  assert.equal(parseOAuthUrl("https://accounts.google.com/not-auth?scope=openid").provider, "generic");
  assert.equal(parseOAuthUrl("https://github.com/login/oauth/authorize?scope=repo&code_challenge=").has_pkce, true);
  assert.equal(parseOAuthUrl("https://github.com/login/oauth/authorize?scope=repo&code_challenge_method=S256").has_pkce, true);
});

test("MCP scanning masks every credential, handles nested headers/env, and skips placeholders", () => {
  const config = { mcpServers: { helper: { env: {
    GITHUB_TOKEN: "ghp_unitSecret0001", VERCEL_TOKEN: "vcp_unitSecret0002", OPENAI_API_KEY: "sk-proj-unitSecret0003",
    ANTHROPIC_API_KEY: "sk-ant-unitSecret0004", SLACK_BOT_TOKEN: "xoxb-unitSecret0005", SALESFORCE_REFRESH_TOKEN: "sf-unitSecret0006",
    OPTIONAL_TOKEN: "${EXTERNAL_TOKEN}", EMPTY_API_KEY: "", SHORT_SECRET: "ab", PORT: "3000",
  }, headers: { Authorization: "Bearer gho_unitSecret0007" } } } };
  const findings = parseMcpConfig(JSON.stringify(config));
  assert.equal(findings.length, 8);
  assert.deepEqual(findings.map(finding => finding.provider).sort(), ["anthropic", "generic", "github", "github", "openai", "salesforce", "slack", "vercel"]);
  assert.equal(findings.find(finding => finding.key_name === "Authorization")!.grant_type, "oauth_token");
  assert.equal(findings.find(finding => finding.key_name === "GITHUB_TOKEN")!.grant_type, "static_pat");
  assert.ok(findings.every(finding => finding.masked_preview === "[REDACTED]"));
  assert.ok(!JSON.stringify(findings).includes("unitSecret"));
  assert.ok(!JSON.stringify(findings).includes('"ab"'));
});

test(".env supports export, quoted hashes, comments, CRLF, and multiline private keys", () => {
  const env = '# comment\r\n  export GITHUB_TOKEN="gho_oauthUnitSecret" # comment\r\nOPENAI_API_KEY=sk-proj-unitSecret # comment\r\nWEBHOOK_SECRET=\'hash#inside\'\r\nGOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nunitSecret\n-----END PRIVATE KEY-----"\r\nPLACEHOLDER_API_KEY=${FROM_ENV}\r\nPORT=8080';
  const findings = parseMcpConfig(env);
  assert.equal(findings.length, 4);
  assert.ok(findings.every(finding => finding.source_file === ".env"));
  assert.equal(findings.find(finding => finding.key_name === "GITHUB_TOKEN")!.grant_type, "oauth_token");
  assert.equal(findings.find(finding => finding.key_name === "GOOGLE_PRIVATE_KEY")!.grant_type, "service_account");
  assert.equal(findings.find(finding => finding.key_name === "WEBHOOK_SECRET")!.grant_type, "webhook_secret");
});

test("service-account JSON is identified without returning its private key", () => {
  const findings = parseMcpConfig(JSON.stringify({ type: "service_account", private_key: "-----BEGIN PRIVATE KEY----- secret -----END PRIVATE KEY-----" }));
  assert.equal(findings.length, 1);
  assert.equal(findings[0].provider, "google");
  assert.equal(findings[0].grant_type, "service_account");
});

test("malformed/oversized/deep configurations fail without disclosing secrets", () => {
  for (const raw of ['{"TOKEN":"privateCredential",}', "TOKEN='privateCredential", "TOKEN=value\nmalformed", "null", "", "x".repeat(1_000_001)]) {
    assert.throws(() => parseMcpConfig(raw), error => error instanceof Error && !error.message.includes("privateCredential"));
  }
  let deep = {};
  for (let i = 0; i < 70; i++) deep = { child: deep };
  assert.throws(() => parseMcpConfig(JSON.stringify(deep)), /nesting/);
  assert.deepEqual(parseMcpConfig('{"mcpServers":{}}'), []);
  assert.deepEqual(parseMcpConfig("# only comments\n# API_KEY is provided at runtime"), []);
});

test("Takeout supports nested multiple grants and ignores credential values", () => {
  const grants = parseTakeout(JSON.stringify({ grants: [
    { clientId: "one", scopes: ["openid", "email", "email"], refresh_token: "privateCredential" },
    { client_id: "two", provider: "github", scope: "repo,workflow" },
  ] }));
  assert.equal(grants.length, 2);
  assert.deepEqual(grants[0].requested_scopes, ["email", "openid"]);
  assert.equal(grants[1].provider, "github");
  assert.ok(!JSON.stringify(grants).includes("privateCredential"));
  for (const raw of ['{"grants":[]}', '{"scope":42}', '{"scope":["repo",3]}', '{"provider":"unlisted","scope":"x"}']) {
    assert.throws(() => parseTakeout(raw));
  }
});

test("audit dispatch validates modes and resolves only frozen presets", () => {
  const input = { mode: "incident_preset", raw_payload: "", preset_id: "rohan_mcp_oauth_trap", simulation_mode: "naive_single_revoke" } as const;
  const parsed = parseAuditInput(input);
  assert.equal(parsed.oauth_grants[0].has_pkce, true);
  assert.equal(parsed.shadow_secrets.length, 3);
  assert.throws(() => parseAuditInput({ ...input, preset_id: "unknown" }), /Unknown incident/);
  assert.throws(() => parseAuditInput({ ...input, simulation_mode: "bad" as never }), /simulation mode/);
  assert.throws(() => parseAuditInput({ ...input, mode: "bad" as never }), /input mode/);
  assert.equal(parseAuditInput({ ...input, preset_id: null, raw_payload: "rohan_mcp_oauth_trap" }).preset_id, input.preset_id);
  assert.throws(() => parseAuditInput({ ...input, raw_payload: 3 as never }), /must be a string/);
});

test("scope, grant and credential count limits bound graph expansion", () => {
  const scopes = Array.from({ length: 257 }, (_, index) => `scope${index}`);
  assert.throws(() => parseOAuthUrl(`https://github.com/login/oauth/authorize?scope=${scopes.join("+")}`), /Scope limit/);
  assert.throws(() => parseTakeout(JSON.stringify({ scopes })), /Scope limit/);
  assert.throws(() => parseTakeout(JSON.stringify({ grants: Array.from({ length: 129 }, () => ({ scope: "openid" })) })), /Grant limit/);
  assert.throws(() => parseMcpConfig(JSON.stringify(Object.fromEntries(scopes.map((_, index) => [`SECRET_${index}`, "sensitive"])))), /Credential limit/);
});
