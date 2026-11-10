import test from "node:test";
import assert from "node:assert/strict";
import { analyzeAudit, buildBlastGraph, parseAuditInput, simulateContainment } from "../../packages/engine/index.ts";

test("naive Google revocation retains copied keys; full plan covers each issuer with probes", () => {
  const report = analyzeAudit({ mode: "incident_preset", raw_payload: "rohan_mcp_oauth_trap", simulation_mode: "naive_single_revoke" });
  const naive = report.naive_containment;
  const full = report.full_containment;
  assert.equal(naive.rfc7009_http_status_returned, 200);
  assert.match(naive.rfc7009_trap_warning, /invalid token.*200.*SHOULD/);
  assert.equal(naive.ordered_steps.length, 1);
  assert.ok(naive.jwt_residual_ttl_seconds > 0);
  const githubKey = report.graph.nodes.find(node => node.kind === "secret_credential" && node.provider === "github")!;
  assert.ok(naive.persisting_node_ids.includes(githubKey.id));
  assert.ok(naive.containment_ratio < full.containment_ratio);
  assert.equal(full.containment_ratio, 1);
  assert.deepEqual(full.persisting_edge_ids, []);
  assert.deepEqual(full.persisting_node_ids, []);
  assert.match(full.rfc7009_trap_warning, /ONLY AFTER/);
  for (const issuer of ["Google", "GitHub", "Vercel", "OpenAI"]) assert.ok(full.ordered_steps.some(step => step.issuer === issuer));
  assert.ok(full.ordered_steps.every((step, index) => step.priority === index + 1 && step.verification_probe.length > 20));
  assert.equal(naive.contained_node_ids.length + naive.persisting_node_ids.length, report.graph.nodes.length - 1);
  assert.ok(!naive.contained_node_ids.includes("identity"));
  assert.equal(new Set([...naive.contained_node_ids, ...naive.persisting_node_ids]).size, report.graph.nodes.length - 1);
});

test("GitHub grant deletion uses Basic authentication, JSON access_token, and 204 rather than RFC 7009", () => {
  const report = analyzeAudit({ mode: "incident_preset", raw_payload: "litellm_ci_2026", simulation_mode: "full_multi_issuer" });
  const revoke = report.naive_containment.ordered_steps[0];
  assert.equal(revoke.action_type, "github_grant_delete");
  assert.match(revoke.command_or_endpoint, /DELETE https:\/\/api.github.com\/applications\/\{client_id\}\/grant/);
  assert.match(revoke.command_or_endpoint, /Basic client_id:client_secret/);
  assert.match(revoke.command_or_endpoint, /access_token.*204/);
  assert.equal(report.naive_containment.rfc7009_http_status_returned, 0);
  assert.ok(report.full_containment.ordered_steps.some(step => step.action_type === "inspect_ci_workflows"));
  assert.ok(!report.full_containment.ordered_steps.some(step => step.action_type === "rfc7009_revoke"));
});

test("Microsoft keeps JWT residual window and requires minted-app/permission cleanup", () => {
  const report = analyzeAudit({ mode: "incident_preset", raw_payload: "midnight_blizzard_2024", simulation_mode: "full_multi_issuer" });
  assert.equal(report.naive_containment.jwt_residual_ttl_seconds, 5400);
  assert.ok(report.full_containment.ordered_steps.some(step => step.action_type === "audit_minted_apps"));
  assert.equal(report.naive_containment.rfc7009_http_status_returned, 0);
  assert.match(report.naive_containment.ordered_steps[0].command_or_endpoint, /No generic RFC 7009 endpoint/);
  assert.ok(!report.graph.nodes.some(node => node.kind === "shadow_ai_tool"));
  assert.match(report.summary.incident_framing_note, /Not Shadow AI/);
});

test("a single revoke does not contain secondary Takeout grants", () => {
  const report = analyzeAudit({ mode: "takeout_grant", raw_payload: JSON.stringify({ grants: [
    { provider: "google", client_id: "one", scope: "openid" }, { provider: "github", client_id: "two", scope: "repo" },
  ] }), simulation_mode: "naive_single_revoke" });
  assert.ok(report.naive_containment.persisting_node_ids.includes("grant:1:github"));
  assert.ok(!report.naive_containment.persisting_node_ids.includes("grant:0:google"));
  assert.ok(report.full_containment.ordered_steps.some(step => step.action_type === "github_grant_delete"));
});

test("static-only input never invents an RFC response; PATs need key rotation rather than OAuth grant deletion", () => {
  const report = analyzeAudit({ mode: "mcp_config", raw_payload: "GITHUB_TOKEN=ghp_unitPrivate\nVERCEL_TOKEN=vcp_unitPrivate", simulation_mode: "full_multi_issuer" });
  assert.equal(report.naive_containment.rfc7009_http_status_returned, 0);
  assert.equal(report.naive_containment.containment_ratio, 0);
  assert.equal(report.naive_containment.jwt_residual_ttl_seconds, 0);
  assert.ok(report.full_containment.ordered_steps.some(step => step.issuer === "GitHub" && step.action_type === "rotate_downstream_key"));
  assert.ok(!report.full_containment.ordered_steps.some(step => step.action_type === "github_grant_delete"));
  const parsed = parseAuditInput({ mode: "mcp_config", raw_payload: "{\"mcpServers\":{}}", simulation_mode: "naive_single_revoke" });
  const empty = simulateContainment(buildBlastGraph(parsed), parsed, "naive_single_revoke");
  assert.equal(empty.containment_ratio, 1);
  assert.deepEqual(empty.ordered_steps, []);
  assert.throws(() => simulateContainment(report.graph, parsed, "bad" as never), /simulation mode/);
});

test("detected OAuth tokens use their issuer's revoke flow and minted service-account keys are rotated", () => {
  const report = analyzeAudit({ mode: "mcp_config", raw_payload: "GOOGLE_ACCESS_TOKEN=ya29_unitPrivate\nGITHUB_TOKEN=gho_unitPrivate\nSALESFORCE_REFRESH_TOKEN=unitPrivate", simulation_mode: "full_multi_issuer" });
  assert.ok(report.full_containment.ordered_steps.some(step => step.issuer === "GitHub" && step.action_type === "github_grant_delete"));
  for (const issuer of ["Google", "Salesforce"]) assert.ok(report.full_containment.ordered_steps.some(step => step.issuer === issuer && step.action_type === "rfc7009_revoke"));
  const cloud = analyzeAudit({ mode: "oauth_url", raw_payload: "https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/cloud-platform", simulation_mode: "full_multi_issuer" });
  assert.ok(cloud.full_containment.ordered_steps.some(step => step.target_resource.includes("minted_service_account_key") && step.action_type === "rotate_downstream_key"));
});
