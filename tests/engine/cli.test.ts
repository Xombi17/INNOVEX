import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { scanDirectory } from "../../packages/engine/cli.ts";
import { analyzeAudit, parseAuditInput, parseMcpConfig } from "../../packages/engine/index.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const cli = join(root, "packages/engine/cli.ts");

function fixture(t: { after: (cleanup: () => void) => void }): string {
  const directory = mkdtempSync(join(tmpdir(), "scopebomb-cli-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

function write(directory: string, path: string, contents: string): void {
  const target = join(directory, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
}

test("scans MCP/env files through depth three, skips excluded trees and symlinks, and merges findings", t => {
  const directory = fixture(t);
  const files = {
    ".mcp.json": JSON.stringify({ mcpServers: { local: { env: { GITHUB_TOKEN: "ghp_privateRoot" } } } }),
    "project/mcp.json": '{"headers":{"Authorization":"Bearer gho_privateNested"}}',
    ".cursor/mcp.json": '{"env":{"VERCEL_TOKEN":"vcp_privateCursor"}}',
    ".env": "OPENAI_API_KEY=sk-proj-privateEnv\nPORT=3000",
    "one/two/three/.env.local": "ANTHROPIC_API_KEY=sk-ant-privateDepthThree",
  };
  for (const [path, contents] of Object.entries(files)) write(directory, path, contents);
  for (const path of ["node_modules/.env", ".git/mcp.json", ".next/.mcp.json", "project/node_modules/.env", "one/two/three/four/.env", "ignored.json"]) {
    write(directory, path, "MALFORMED=\"mustNotRead");
  }
  write(directory, ".env.empty", " \n");
  write(directory, ".env.references", "GITHUB_TOKEN=${GITHUB_TOKEN}\nOPENAI_API_KEY=changeme");
  const external = fixture(t);
  write(external, ".env", "TOKEN=\"mustNotRead");
  symlinkSync(external, join(directory, "linked-directory"), "dir");
  symlinkSync(join(external, ".env"), join(directory, ".env.link"));

  const report = scanDirectory(directory);
  assert.equal(report.shadow_secrets.length, 5);
  assert.deepEqual(report.shadow_secrets.map(finding => finding.source_file).sort(), Object.keys(files).sort());
  assert.deepEqual(report.shadow_secrets.map(finding => finding.provider).sort(), ["anthropic", "github", "github", "openai", "vercel"]);
  assert.equal(report.shadow_secrets.find(finding => finding.key_name === "Authorization")!.grant_type, "oauth_token");
  assert.ok(report.shadow_secrets.every(finding => finding.masked_preview === "[REDACTED]"));
  assert.ok(!JSON.stringify(report).includes("privateRoot"));
  assert.ok(!JSON.stringify(report).includes("privateNested"));
  assert.ok(!JSON.stringify(report).includes("privateCursor"));
  assert.ok(!JSON.stringify(report).includes("privateEnv"));
  assert.ok(!JSON.stringify(report).includes("privateDepthThree"));
  assert.deepEqual(scanDirectory(directory), report);
  assert.equal(report.graph.nodes.filter(node => node.id.startsWith("secret:") && node.kind === "secret_credential").length, 5);
  for (const finding of report.shadow_secrets) {
    assert.ok(report.full_containment.ordered_steps.some(step => step.issuer === finding.rotation_issuer));
  }
});

test("normalized redacted parser output is analyzed without exposing values or sharing mutable arrays", () => {
  const parsed = parseAuditInput({ mode: "mcp_config", raw_payload: "{}", simulation_mode: "full_multi_issuer" });
  parsed.shadow_secrets = parseMcpConfig("GITHUB_TOKEN=ghp_neverPublish");
  const report = analyzeAudit(parsed);
  assert.deepEqual(report.shadow_secrets, parsed.shadow_secrets);
  assert.ok(!JSON.stringify(report).includes("neverPublish"));
  report.shadow_secrets[0].blast_targets.push("changed");
  assert.ok(!parsed.shadow_secrets[0].blast_targets.includes("changed"));
});

test("--json emits one frozen AuditReport accepted by the contract verifier; default output is concise", t => {
  const directory = fixture(t);
  write(directory, ".env.production", "GITHUB_TOKEN=ghp_secretForPiping\nVERCEL_TOKEN=vcp_secretForPiping");
  const result = spawnSync(process.execPath, [cli, "--json", directory], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  assert.ok(!result.stdout.includes("secretForPiping"));
  assert.deepEqual(JSON.parse(result.stdout), scanDirectory(directory));
  const verification = spawnSync("python3", ["-B", "-c", [
    "import importlib.util,json,sys",
    "spec=importlib.util.spec_from_file_location('contracts','contracts/verify_contracts.py')",
    "module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)",
    "module.validate(json.load(sys.stdin),module.SCHEMA,'CLI AuditReport')",
    "sys.exit(module.main())",
  ].join("\n")], { cwd: root, input: result.stdout, encoding: "utf8" });
  assert.equal(verification.status, 0, verification.stderr || verification.error?.message);
  assert.match(verification.stdout, /OK: schema/);

  const summary = spawnSync(process.execPath, [cli, directory], { encoding: "utf8" });
  assert.equal(summary.status, 0, summary.stderr);
  assert.match(summary.stdout, /2 credential finding\(s\) across 1 file\(s\); max risk 95\/100/);
  assert.match(summary.stdout, /no live actions performed/);
  assert.ok(summary.stdout.trim().split("\n").length <= 5);
  assert.ok(!summary.stdout.includes("secretForPiping"));
  const defaultTarget = spawnSync(process.execPath, [cli, "--json"], { cwd: directory, encoding: "utf8" });
  assert.equal(defaultTarget.status, 0, defaultTarget.stderr);
  assert.deepEqual(JSON.parse(defaultTarget.stdout), JSON.parse(result.stdout));
});

test("empty scans produce an empty report; invalid scans fail without partial JSON or secret diagnostics", t => {
  const directory = fixture(t);
  assert.equal(scanDirectory(directory).shadow_secrets.length, 0);
  for (const payload of ['{"API_KEY":"doNotLeak",}', "TOKEN='doNotLeak", "TOKEN=" + "doNotLeak".repeat(120_000),
    Array.from({ length: 257 }, (_, index) => `API_KEY_${index}=doNotLeak`).join("\n")]) {
    write(directory, ".env", payload);
    const result = spawnSync(process.execPath, [cli, directory, "--json"], { encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /scan failed/);
    assert.ok(!result.stderr.includes("doNotLeak"));
  }
  write(directory, ".env", Array.from({ length: 128 }, (_, index) => `API_KEY_${index}=doNotLeak`).join("\n"));
  write(directory, ".env.local", Array.from({ length: 129 }, (_, index) => `API_KEY_${index}=doNotLeak`).join("\n"));
  assert.throws(() => scanDirectory(directory), /Scan failed/);
  assert.throws(() => scanDirectory(join(directory, "missing")), /Scan failed/);
  assert.throws(() => scanDirectory(join(directory, ".env")), /Scan failed/);
  for (const args of [["--unknown"], [directory, directory]]) {
    const result = spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /Usage:/);
  }
});

test("the browser engine has only relative imports and never imports the Node CLI", () => {
  const directory = join(root, "packages/engine");
  for (const file of readdirSync(directory).filter(file => file.endsWith(".ts") && file !== "cli.ts")) {
    const source = readFileSync(join(directory, file), "utf8");
    assert.doesNotMatch(source, /["']node:/, file);
    for (const match of source.matchAll(/(?:\bfrom\s+|\bimport\s*)["']([^"']+)["']/g)) {
      assert.ok(match[1].startsWith("."), `${file}: ${match[1]}`);
      assert.ok(!match[1].endsWith("/cli.ts"), `${file} must not import the CLI`);
    }
  }
});
