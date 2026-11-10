import test from "node:test";
import assert from "node:assert/strict";
import { buildBlastGraph, parseAuditInput } from "../../packages/engine/index.ts";

const parseUrl = (url: string) => parseAuditInput({ mode: "oauth_url", raw_payload: url, simulation_mode: "naive_single_revoke" });

test("graph builds deterministic, connected multi-hop paths with unique IDs and correct hop depths", () => {
  const input = parseUrl("https://github.com/login/oauth/authorize?scope=repo+workflow+admin:org");
  const graph = buildBlastGraph(input);
  assert.deepEqual(graph, buildBlastGraph(input));
  assert.equal(new Set(graph.nodes.map(node => node.id)).size, graph.nodes.length);
  assert.equal(new Set(graph.edges.map(edge => edge.id)).size, graph.edges.length);
  const nodes = new Map(graph.nodes.map(node => [node.id, node]));
  const depths = new Map([["identity", 0]]);
  for (const edge of graph.edges) {
    assert.ok(nodes.has(edge.source) && nodes.has(edge.target));
    assert.equal(edge.hop, depths.get(edge.source)! + 1);
    depths.set(edge.target, edge.hop);
  }
  assert.equal(depths.size, graph.nodes.length);
  assert.ok(Math.max(...graph.edges.map(edge => edge.hop)) >= 5);
  assert.ok(graph.nodes.some(node => node.trust_boundary === "ci_cd"));
  assert.ok(graph.nodes.some(node => node.kind === "attacker_persistence" && node.label === "modified_workflow_yaml" && node.survives_naive_revoke));
  assert.ok(graph.nodes.every(node => Number.isInteger(node.risk_score) && node.risk_score >= 0 && node.risk_score <= 100));
});

test("scope ordering/deduplication does not change the graph, and capabilities are provider-specific", () => {
  assert.deepEqual(buildBlastGraph(parseUrl("https://github.com/login/oauth/authorize?scope=repo+workflow")),
    buildBlastGraph(parseUrl("https://github.com/login/oauth/authorize?scope=workflow+repo+repo")));
  const graph = buildBlastGraph(parseUrl("https://accounts.google.com/o/oauth2/v2/auth?scope=repo"));
  assert.ok(!graph.nodes.some(node => node.kind === "data_store"));
  assert.ok(graph.nodes.some(node => node.label === "repo" && node.severity === "medium"));
});

test("identity-only grants create no invented assets or persistence; refresh persistence requires offline access", () => {
  const identity = buildBlastGraph(parseUrl("https://accounts.google.com/o/oauth2/v2/auth?scope=openid+email"));
  assert.ok(!identity.nodes.some(node => ["data_store", "secret_credential", "attacker_persistence"].includes(node.kind)));
  const base = "https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/drive";
  assert.ok(!buildBlastGraph(parseUrl(base)).nodes.some(node => node.label === "offline_refresh_token"));
  assert.ok(buildBlastGraph(parseUrl(`${base}&access_type=offline`)).nodes.some(node => node.label === "offline_refresh_token"));
});

test("local config is an independent branch and does not assume a PAT's workflow privileges", () => {
  const input = parseAuditInput({ mode: "incident_preset", raw_payload: "rohan_mcp_oauth_trap", simulation_mode: "naive_single_revoke" });
  const graph = buildBlastGraph(input);
  assert.ok(graph.edges.some(edge => edge.source === "identity" && edge.target === "local_config"));
  assert.ok(!graph.edges.some(edge => edge.source.includes("scope") && edge.target.startsWith("secret:")));
  assert.ok(!graph.nodes.some(node => node.label === "modified_workflow_yaml"));
  assert.ok(graph.nodes.some(node => node.trust_boundary === "developer_local"));
});
