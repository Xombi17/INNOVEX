import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeInput, prepareConfiguration } from "../src/lib/analysis.ts";
import {
  localTriage,
  triageRequest,
  validateTriageRequest,
  applyFactOrder,
} from "../src/lib/triage.ts";

const analyze = (raw_payload: string) =>
  analyzeInput(
    { mode: "mcp_config", raw_payload, simulation_mode: "naive_single_revoke" },
    ".env.example",
  );
test("placeholders and references are evidence, not invented credentials", () => {
  const result = analyze(
    "OPENAI_API_KEY=your_key_here\nGITHUB_TOKEN=${GH_TOKEN}\nVERCEL_TOKEN=example_value\nOTHER_SECRET=\nAPI_KEY=changeme",
  );
  assert.equal(result.report.shadow_secrets.length, 0);
  assert.equal(
    result.context.evidence.filter((item) => item.kind === "placeholder")
      .length,
    5,
  );
  assert.equal(result.report.naive_containment.persisting_node_ids.length, 0);
});
test("real credential-like values retain provenance without exposing values", () => {
  const secret = "ghp_" + "syntheticTestValueOnly".repeat(3);
  const result = analyze(
    `GITHUB_TOKEN=${secret}\nOPENAI_API_KEY=your_key_here`,
  );
  assert.equal(result.report.shadow_secrets.length, 1);
  assert.equal(result.report.shadow_secrets[0].source_file, ".env.example");
  assert.equal(
    result.context.evidence.find((item) => item.kind === "credential")?.subject,
    "GITHUB_TOKEN",
  );
  assert.ok(!JSON.stringify(result).includes(secret));
  assert.equal(result.report.schema_version, "1.0.0");
});
test("JSON references are filtered without damaging real values or service-account metadata", () => {
  const result = analyze(
    '{"mcpServers":{"one":{"env":{"GITHUB_TOKEN":"${GITHUB_TOKEN}","OPENAI_API_KEY":"not_a_placeholder_real_candidate"}}}}',
  );
  assert.equal(result.report.shadow_secrets.length, 1);
  assert.equal(result.report.shadow_secrets[0].key_name, "OPENAI_API_KEY");
  assert.match(
    result.context.evidence.find((item) => item.kind === "placeholder")!.source,
    /mcpServers.one.env.GITHUB_TOKEN/,
  );
});
test("malformed JSON errors never repeat a pasted secret", () => {
  assert.throws(
    () => prepareConfiguration('{"OPENAI_API_KEY":"sensitive-value"', "input"),
    (error) =>
      error instanceof Error && !error.message.includes("sensitive-value"),
  );
});
test("unknown permission is reviewable, not certified safe", () => {
  const result = analyzeInput(
    {
      mode: "oauth_url",
      raw_payload:
        "https://accounts.google.com/o/oauth2/v2/auth?client_id=test&scope=unlisted_permission",
      simulation_mode: "naive_single_revoke",
    },
    "Supplied link",
  );
  assert.equal(result.report.pre_consent_guard.action, "WARN");
  assert.equal(result.context.evidence[0].subject, "unlisted_permission");
  assert.match(
    localTriage(triageRequest(result.report)).items[1].body,
    /limited catalog/,
  );
});
test("AI receives only fixed provider names and counts", () => {
  const result = analyze("GITHUB_TOKEN=not_a_placeholder_real_candidate");
  const data = triageRequest(result.report);
  assert.deepEqual(
    Object.keys(data).sort(),
    [
      "credentialCount",
      "inputMode",
      "modeledNodes",
      "providers",
      "scopeCount",
    ].sort(),
  );
  assert.ok(validateTriageRequest(data));
  assert.equal(
    validateTriageRequest({ ...data, raw_payload: "should-never-be-sent" }),
    null,
  );
  assert.equal(
    validateTriageRequest({ ...data, providers: ["arbitrary-secret"] }),
    null,
  );
  assert.equal(validateTriageRequest({ ...data, modeledNodes: -1 }), null);
});
test("AI can reorder vetted facts but cannot invent or duplicate claims", () => {
  const base = localTriage(
    triageRequest(
      analyze("GITHUB_TOKEN=not_a_placeholder_real_candidate").report,
    ),
  );
  assert.equal(applyFactOrder(base, [0, 0, 1], "openai"), null);
  assert.equal(applyFactOrder(base, [0, 1, "2"], "gemini"), null);
  assert.equal(applyFactOrder(base, [0, 1, 3], "openai"), null);
  const reordered = applyFactOrder(base, [2, 0, 1], "openai")!;
  assert.deepEqual(reordered.items, [
    base.items[2],
    base.items[0],
    base.items[1],
  ]);
  assert.equal(reordered.fallbackUsed, false);
});
test("multi-grant summaries count every requested scope and provider", () => {
  const result = analyzeInput(
    {
      mode: "takeout_grant",
      simulation_mode: "naive_single_revoke",
      raw_payload: JSON.stringify([
        { provider: "google", scopes: ["openid", "email"] },
        { provider: "github", scopes: ["repo"] },
      ]),
    },
    "grant export",
  );
  assert.equal(
    result.context.evidence.filter((item) => item.kind === "permission").length,
    3,
  );
  assert.equal(triageRequest(result.report).scopeCount, 3);
  assert.deepEqual(
    new Set(triageRequest(result.report).providers),
    new Set(["google", "github"]),
  );
});
