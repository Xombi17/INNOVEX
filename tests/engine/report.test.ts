import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { analyzeAudit } from "../../packages/engine/index.ts";
import type { AuditInput } from "../../contracts/index.d.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const catalog = JSON.parse(readFileSync(new URL("../../data/scope_catalog.json", import.meta.url), "utf8"));

test("all presets and input modes emit only frozen AuditReport properties and validate against the schema", () => {
  const inputs: AuditInput[] = catalog.incident_presets.map((preset: { preset_id: string }) => ({
    mode: "incident_preset", raw_payload: "", preset_id: preset.preset_id, simulation_mode: "full_multi_issuer",
  }));
  inputs.push(
    { mode: "oauth_url", raw_payload: "https://github.com/login/oauth/authorize?scope=repo+workflow", simulation_mode: "naive_single_revoke" },
    { mode: "mcp_config", raw_payload: "OPENAI_API_KEY=sk-proj-reportPrivateCredential", simulation_mode: "naive_single_revoke" },
    { mode: "takeout_grant", raw_payload: '{"grants":[{"scopes":["openid"]},{"provider":"github","scope":"repo"}]}', simulation_mode: "full_multi_issuer" },
    { mode: "mcp_config", raw_payload: '{"mcpServers":{}}', simulation_mode: "full_multi_issuer" },
  );
  const reports = inputs.map(input => {
    const before = structuredClone(input);
    const report = analyzeAudit(input);
    assert.deepEqual(input, before);
    assert.deepEqual(report, analyzeAudit(input));
    assert.equal(report.ai_explainer_used, false);
    assert.ok(!JSON.stringify(report).includes("reportPrivateCredential"));
    assert.ok(report.summary.max_risk_score >= 0 && report.summary.max_risk_score <= 100);
    for (const outcome of [report.naive_containment, report.full_containment]) {
      assert.ok(outcome.containment_ratio >= 0 && outcome.containment_ratio <= 1);
      const ids = new Set(report.graph.nodes.map(node => node.id));
      assert.ok([...outcome.contained_node_ids, ...outcome.persisting_node_ids].every(id => ids.has(id)));
    }
    return report;
  });
  const result = spawnSync("python3", ["-B", "-c", [
    "import importlib.util,json,sys",
    "spec=importlib.util.spec_from_file_location('contracts','contracts/verify_contracts.py')",
    "module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)",
    "for report in json.load(sys.stdin): module.validate(report,module.SCHEMA,'AuditReport')",
  ].join("\n")], { cwd: root, input: JSON.stringify(reports), encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  assert.ok(reports.flatMap(report => report.graph.nodes).some(node => node.trust_boundary === "ci_cd"));
});

test("every catalog scope is traversed and neither catalog nor a previous report can be mutated through a result", () => {
  for (const entry of catalog.scopes) {
    const hosts: Record<string, string> = {
      google: "https://accounts.google.com/o/oauth2/v2/auth", github: "https://github.com/login/oauth/authorize",
      microsoft: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize", slack: "https://slack.com/oauth/v2/authorize",
    };
    const url = new URL(hosts[entry.provider]);
    url.searchParams.set("scope", entry.scope_id);
    const input: AuditInput = { mode: "oauth_url", raw_payload: url.href, simulation_mode: "naive_single_revoke" };
    const report = analyzeAudit(input);
    assert.equal(report.pre_consent_guard.flagged_scopes.length, entry.severity === "low" ? 0 : 1);
    for (const target of entry.enables_targets) assert.ok(report.graph.nodes.some(node => node.label === target));
    const original = JSON.stringify(report);
    report.graph.nodes[0].notes = "changed";
    report.pre_consent_guard.recommended_scopes.push("changed");
    assert.equal(JSON.stringify(analyzeAudit(input)), original);
  }
});

test("the selector does not drop either containment outcome and multi-grant guard uses the highest risk", () => {
  const input: AuditInput = { mode: "takeout_grant", raw_payload: '{"grants":[{"scopes":["openid"]},{"provider":"github","scope":"repo","code_challenge":"x"}]}', simulation_mode: "naive_single_revoke" };
  const report = analyzeAudit(input);
  assert.deepEqual(report, analyzeAudit({ ...input, simulation_mode: "full_multi_issuer" }));
  assert.equal(report.parsed_oauth!.provider, "google");
  assert.equal(report.pre_consent_guard.action, "BLOCK_PRE_CONSENT");
  assert.equal(report.pre_consent_guard.pkce_protected, true);
  assert.equal(report.pre_consent_guard.flagged_scopes[0].scope_id, "repo");
});
