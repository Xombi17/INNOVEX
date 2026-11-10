// Generated from packages/engine/parsers.ts by scripts/build.mjs — do not edit manually.
                                                                                                                            
import { catalog, sortedUnique } from "./catalog.js";

                                   
                        
                           
                                    
                                        
                                
 

function checkedPayload(raw        )         {
  if (typeof raw !== "string" || !raw.trim() || raw.length > 1_000_000) {
    throw new Error("Expected a non-empty payload of at most 1,000,000 characters.");
  }
  return raw.trim();
}

function parseJson(raw        )         {
  let value         ;
  try { value = JSON.parse(checkedPayload(raw)); }
  catch { throw new Error("Invalid JSON payload."); } // Native parse errors may contain secrets.
  if (!value || typeof value !== "object") throw new Error("Expected a JSON object or array.");
  return value;
}

function* records(root        )                                     {
  const pending                                     = [{ value: root, depth: 0 }];
  let count = 0;
  while (pending.length) {
    const { value, depth } = pending.pop() ;
    if (++count > 10_000 || depth > 64) throw new Error("JSON nesting or record limit exceeded.");
    if (!Array.isArray(value)) yield value                           ;
    for (const key of Object.keys(value).sort().reverse()) {
      const child          = (value                           )[key];
      if (child && typeof child === "object") pending.push({ value: child, depth: depth + 1 });
    }
  }
}

function splitScopes(values          , provider            )           {
  const scopes = sortedUnique(values.flatMap(value => value.trim().split(provider === "github" || provider === "slack" ? /[\s,]+/ : /\s+/)).filter(Boolean));
  if (scopes.length > 256) throw new Error("Scope limit exceeded (256 per grant).");
  return scopes;
}

export function parseOAuthUrl(raw        )                    {
  let url     ;
  try { url = new URL(checkedPayload(raw)); }
  catch { throw new Error("Expected an absolute OAuth authorization URL."); }
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.hash) {
    throw new Error("OAuth URL must use HTTP(S), without userinfo or a fragment.");
  }
  const host = url.hostname;
  let provider             = "generic";
  if (host === "accounts.google.com" && /^\/o\/oauth2\/(v2\/)?auth$/.test(url.pathname)) provider = "google";
  else if (host === "github.com" && url.pathname === "/login/oauth/authorize") provider = "github";
  else if (["login.microsoftonline.com", "login.windows.net"].includes(host) && /\/oauth2\/(v2\.0\/)?authorize$/.test(url.pathname)) provider = "microsoft";
  else if (host === "slack.com" && /^\/oauth\/(v2\/)?authorize$/.test(url.pathname)) provider = "slack";
  else if (["login.salesforce.com", "test.salesforce.com"].includes(host) && url.pathname === "/services/oauth2/authorize") provider = "salesforce";
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1", "[::1]"].includes(host)) {
    throw new Error("Remote authorization endpoints must use HTTPS.");
  }
  const params = url.searchParams;
  for (const key of ["client_id", "redirect_uri", "response_type", "access_type", "code_challenge", "code_challenge_method", "state"]) {
    if (params.getAll(key).length > 1) throw new Error("Ambiguous duplicate OAuth parameter.");
  }
  if (!params.has("client_id") && !params.has("scope")) throw new Error("URL contains no OAuth client or scopes.");
  return {
    provider,
    client_id: params.get("client_id") || null,
    redirect_uri: params.get("redirect_uri") || null,
    requested_scopes: splitScopes([...params.getAll("scope"), ...(provider === "slack" ? params.getAll("user_scope") : [])], provider),
    response_type: params.get("response_type") || null,
    access_type: params.get("access_type") || null,
    // Presence is deliberately conservative; a malformed challenge must not enable rewriting.
    has_pkce: params.has("code_challenge") || params.has("code_challenge_method"),
    code_challenge_method: params.get("code_challenge_method") || null,
    state_present: Boolean(params.get("state")),
  };
}

function secretFinding(key        , raw        , source        )                             {
  const value = raw.trim().replace(/^Bearer\s+/i, "");
  if (!value || /^(\$\{[^}]+\}|\$[A-Za-z_][A-Za-z0-9_]*|<[^>]+>|\*+|redacted|changeme|your[_-].*|process\.env\..*)$/i.test(value)) return null;
  const name = key.toUpperCase();
  if (!/(TOKEN|SECRET|API[_-]?KEY|PRIVATE[_-]?KEY|AUTHORIZATION|PASSWORD|ADMIN[_-]?KEY)/.test(name)) return null;
  let provider             = "generic";
  let issuer = "Credential issuer";
  let targets = ["downstream_api_access"];
  if (/GITHUB|GH_TOKEN|GH_PAT/.test(name) || /^(gh[pousr]_|github_pat_)/.test(value)) {
    provider = "github"; issuer = "GitHub"; targets = ["private_source_code", "committed_secrets"];
  } else if (/VERCEL/.test(name) || /^vcp_/.test(value)) {
    provider = "vercel"; issuer = "Vercel"; targets = ["prod_env_vars", "deployments"];
  } else if (/ANTHROPIC/.test(name) || /^sk-ant-/.test(value)) {
    provider = "anthropic"; issuer = "Anthropic"; targets = ["model_api_usage", "api_billing"];
  } else if (/OPENAI/.test(name) || /^sk-proj-/.test(value)) {
    provider = "openai"; issuer = "OpenAI"; targets = ["model_api_usage", "api_billing"];
  } else if (/SLACK/.test(name) || /^xox[baprs]-/.test(value)) {
    provider = "slack"; issuer = "Slack"; targets = ["slack_shared_secrets", "incident_channels"];
  } else if (/SALESFORCE|SF_REFRESH/.test(name)) {
    provider = "salesforce"; issuer = "Salesforce"; targets = ["crm_records", "exported_customer_secrets"];
  } else if (/GOOGLE|GCP|SERVICE_ACCOUNT/.test(name) || /^(ya29\.|1\/\/)/.test(value)) {
    provider = "google"; issuer = "Google"; targets = ["gcp_secret_manager", "prod_buckets"];
  } else if (/MICROSOFT|AZURE|ENTRA/.test(name)) {
    provider = "microsoft"; issuer = "Microsoft Entra ID"; targets = ["enterprise_resources"];
  }
  let grant_type                                    = "api_key";
  if (/WEBHOOK/.test(name)) grant_type = "webhook_secret";
  else if (/PRIVATE[_-]?KEY|SERVICE_ACCOUNT/.test(name) || value.includes("BEGIN PRIVATE KEY")) grant_type = "service_account";
  else if (/^(ghp_|github_pat_)/.test(value) || /PAT/.test(name) || (provider === "github" && !/^gh[ousr]_/.test(value))) grant_type = "static_pat";
  else if (/REFRESH|ACCESS_TOKEN|OAUTH/.test(name) || /^(gh[ousr]_|ya29\.|1\/\/|xox[baprs]-)/.test(value) || provider === "salesforce") grant_type = "oauth_token";
  return {
    source_file: source, provider, key_name: key,
    // No raw prefix/suffix: even a short credential must never be reproduced.
    masked_preview: "[REDACTED]", grant_type, rotation_issuer: issuer,
    severity: ["github", "vercel", "google", "microsoft", "salesforce"].includes(provider) ? "critical" : "high",
    blast_targets: targets,
  };
}

export function parseMcpConfig(raw        )                        {
  const payload = checkedPayload(raw);
  const findings                        = [];
  if (payload.startsWith("{") || payload.startsWith("[")) {
    for (const record of records(parseJson(payload))) {
      for (const key of Object.keys(record).sort()) {
        const value = record[key];
        if (typeof value === "string") {
          const finding = secretFinding(key, value, ".mcp.json");
          if (finding && record.type === "service_account" && key === "private_key") {
            finding.provider = "google"; finding.rotation_issuer = "Google";
            finding.severity = "critical"; finding.blast_targets = ["gcp_secret_manager", "prod_buckets"];
          }
          if (finding) findings.push(finding);
        }
      }
    }
  } else {
    const assignments = /^[\t ]*(?:export[\t ]+)?([A-Za-z_][A-Za-z0-9_]*)[\t ]*=[\t ]*(?:"([^"\\]*(?:\\.[^"\\]*)*)"|'([^']*)'|(?![\t ]*["'])([^\r\n]*))[\t ]*(?:#.*)?$/gm;
    let match                        ;
    while ((match = assignments.exec(payload))) {
      const value = match[2] ?? match[3] ?? match[4].replace(/\s+#.*$/, "").trim();
      const finding = secretFinding(match[1], value, ".env");
      if (finding) findings.push(finding);
    }
    // Reject malformed lines instead of silently claiming they contain no credentials.
    const remainder = payload.replace(assignments, "").split(/\r?\n/).filter(line => line.trim() && !/^\s*#/.test(line));
    if (remainder.length) throw new Error("Expected valid .env assignments or MCP JSON.");
  }
  if (findings.length > 256) throw new Error("Credential limit exceeded (256 per configuration).");
  return findings;
}

export function parseTakeout(raw        )                      {
  const grants                      = [];
  for (const record of records(parseJson(raw))) {
    const scopes = record.scopes ?? record.scope ?? record.requested_scopes;
    if (scopes === undefined) continue;
    if (!(typeof scopes === "string" || (Array.isArray(scopes) && scopes.every(scope => typeof scope === "string")))) {
      throw new Error("Takeout scopes must be a string or array of strings.");
    }
    const rawProvider = record.provider ?? "google";
    const providers               = ["google", "github", "microsoft", "slack", "salesforce", "vercel", "anthropic", "openai", "generic"];
    if (!providers.includes(rawProvider              )) throw new Error("Unsupported Takeout provider.");
    const provider = rawProvider              ;
    const text = (key        )                => typeof record[key] === "string" ? record[key]           : null;
    grants.push({
      provider,
      client_id: text("client_id") ?? text("clientId"), redirect_uri: text("redirect_uri"),
      requested_scopes: splitScopes(typeof scopes === "string" ? [scopes] : scopes            , provider),
      response_type: text("response_type"), access_type: text("access_type"),
      has_pkce: Object.hasOwn(record, "code_challenge") || Object.hasOwn(record, "code_challenge_method"),
      code_challenge_method: text("code_challenge_method"), state_present: Boolean(text("state")),
    });
    if (grants.length > 128) throw new Error("Grant limit exceeded (128 per Takeout payload).");
  }
  if (!grants.length) throw new Error("No supported OAuth grant records found in Takeout JSON.");
  return grants;
}

export function parseAuditInput(input            )                   {
  if (!input || !["naive_single_revoke", "full_multi_issuer"].includes(input.simulation_mode)) throw new Error("Invalid simulation mode.");
  if (typeof input.raw_payload !== "string") throw new Error("Audit raw_payload must be a string.");
  const parsed                   = {
    input_mode: input.mode, preset_id: null, oauth_grants: [], shadow_secrets: [],
    incident_framing_note: "Deterministic potential exposure model; paths are conditional, not evidence of exploitation or observed containment.",
  };
  switch (input.mode) {
    case "oauth_url": parsed.oauth_grants = [parseOAuthUrl(input.raw_payload)]; break;
    case "mcp_config": parsed.shadow_secrets = parseMcpConfig(input.raw_payload); break;
    case "takeout_grant": parsed.oauth_grants = parseTakeout(input.raw_payload); break;
    case "incident_preset": {
      const presetId = input.preset_id || checkedPayload(input.raw_payload);
      const preset = catalog.incident_presets.find(entry => entry.preset_id === presetId);
      if (!preset) throw new Error("Unknown incident preset.");
      parsed.preset_id = preset.preset_id;
      parsed.incident_framing_note = `${preset.classification}. ${preset.summary} Illustrative model, not a forensic reconstruction.`;
      parsed.oauth_grants = [parseOAuthUrl(preset.sample_oauth_url)];
      if (preset.sample_mcp_config) parsed.shadow_secrets = parseMcpConfig(preset.sample_mcp_config);
      break;
    }
    default: throw new Error("Unsupported audit input mode.");
  }
  return parsed;
}
