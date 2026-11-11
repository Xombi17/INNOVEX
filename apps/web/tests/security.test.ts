import test from "node:test";
import assert from "node:assert/strict";
import { readBoundedText } from "../src/lib/boundedBody.ts";
import { analyzeInput, isPlaceholder } from "../src/lib/analysis.ts";
import { parseRepository, scanRepository } from "../src/lib/repositoryScan.ts";
import { validateTriageRequest, deterministicTriage, parseModelTriage } from "../src/lib/aiTriage.ts";
import { POST as triageRoute } from "../src/app/api/ai-triage/route.ts";
import { POST as scanRoute } from "../src/app/api/scan-repo/route.ts";

const summary = { inputMode: "mcp_config", maxRiskScore: 95, maxHops: 4, trustBoundaries: ["developer_local", "vendor"], primaryProvider: "generic", detectedProviders: ["github", "vercel"], naivePersistingCount: 5, naiveStoppedPct: 0, pkceProtected: false, rfc7009Status: 0 };
const request = (body: unknown) => new Request("http://localhost/api/test", { method: "POST", body: JSON.stringify(body) });

test("bounded bodies count streamed UTF-8 bytes and cancel before oversized content is consumed", async () => {
  let cancelled = false;
  const response = new Response(new ReadableStream({ pull(controller) { controller.enqueue(new TextEncoder().encode("éé")); }, cancel() { cancelled = true; } }));
  await assert.rejects(readBoundedText(response, 3), /limit/);
  assert.equal(cancelled, true);
  assert.equal(await readBoundedText(new Response("é"), 2), "é");
});

test("configuration preprocessing excludes placeholders and retains only redacted credential evidence", () => {
  for (const value of ["${GITHUB_TOKEN}", "your-token", "sample_key", "changeme"]) assert.equal(isPlaceholder(value), true);
  const result = analyzeInput({ mode: "mcp_config", raw_payload: 'GITHUB_TOKEN=${GITHUB_TOKEN}\nVERCEL_TOKEN=vcp_privateSentinel', simulation_mode: "naive_single_revoke" }, "example.env");
  assert.equal(result.report.shadow_secrets.length, 1);
  assert.equal(result.context.evidence.filter(item => item.kind === "placeholder").length, 1);
  assert.ok(!JSON.stringify(result).includes("privateSentinel"));
  assert.throws(() => analyzeInput({ mode: "mcp_config", raw_payload: '{"TOKEN":"privateSentinel",}', simulation_mode: "naive_single_revoke" }, "bad.json"), error => !String(error).includes("privateSentinel"));
});

test("repository inputs reject credentials, traversal, branch paths and arbitrary hosts before fetching", async t => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => { calls += 1; throw new Error(); });
  assert.equal(parseRepository("https://github.com/owner/repo.git"), "owner/repo");
  for (const value of [null, {}, "http://github.com/a/b", "https://github.com.evil/a/b", "https://u:p@github.com/a/b", "https://127.0.0.1/a/b", "https://github.com/a/b/tree/main", "a/..", "a/%2e%2e", "https://github.com/a/b?token=secret"]) {
    assert.throws(() => parseRepository(value));
    assert.equal((await scanRoute(request({ repo: value }))).status, 400);
  }
  assert.equal(calls, 0);
});

test("repo scan merges all selected configs, pins revision and never returns raw contents or secret diagnostics", async t => {
  const sha = "a".repeat(40);
  const files: Record<string, string> = { ".env": "VERCEL_TOKEN=vcp_privateSentinel", ".mcp.json": '{"env":{"GITHUB_TOKEN":"ghp_privateSentinel"}}', ".env.example": "OPENAI_API_KEY=your-key", ".github/workflows/test.yml": "permissions:\n  contents: write" };
  t.mock.method(globalThis, "fetch", async (url: string | URL | Request, options?: RequestInit) => {
    assert.equal(options?.redirect, "error");
    if (String(url).startsWith("https://api.github.com/")) return Response.json({ sha, tree: Object.keys(files).map(path => ({ path, type: "blob" })) });
    assert.ok(String(url).includes(`/${sha}/`));
    return new Response(files[String(url).split(`/${sha}/`)[1]]);
  });
  const result = await scanRepository("owner/repo", AbortSignal.timeout(1000));
  assert.equal(result.analysis.report.shadow_secrets.length, 2);
  assert.equal(result.analysis.context.evidence.filter(item => item.kind === "placeholder").length, 1);
  assert.equal(result.analysis.context.evidence.filter(item => item.kind === "workflow").length, 1);
  assert.equal(result.analysis.context.coverage?.inspected.length, 4);
  assert.equal(result.analysis.context.coverage?.partial, false);
  assert.ok(!JSON.stringify(result).includes("privateSentinel"));
  assert.ok(!("syntheticMcpPayload" in result));
});

test("repo scan discloses caps, oversized and malformed files without manufacturing credentials", async t => {
  const paths = [".env", ".mcp.json", ...Array.from({ length: 9 }, (_, i) => `project${i}/.env`)];
  let requests = 0;
  t.mock.method(globalThis, "fetch", async (url: string | URL | Request) => {
    requests += 1;
    if (String(url).startsWith("https://api.github.com/")) return Response.json({ sha: "b".repeat(40), truncated: true, tree: paths.map(path => ({ path, type: "blob" })) });
    if (String(url).endsWith("/.mcp.json")) return new Response('{"TOKEN":"privateSentinel",}');
    if (String(url).endsWith("/.env") && !String(url).includes("/project")) return new Response("x".repeat(65537));
    return new Response("OPENAI_API_KEY=${OPENAI_API_KEY}");
  });
  const result = await scanRepository("owner/repo", AbortSignal.timeout(1000));
  assert.equal(requests, 9);
  assert.equal(result.analysis.context.coverage?.partial, true);
  assert.equal(result.analysis.context.coverage?.skipped.length, 5);
  assert.equal(result.analysis.report.shadow_secrets.length, 0);
  assert.ok(!JSON.stringify(result).includes("privateSentinel"));
  assert.ok(!result.message.includes("clean"));
});

test("triage rejects untrusted text, invalid shapes and out-of-range numbers before model calls", async t => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => { calls += 1; throw new Error(); });
  for (const data of [null, {}, { ...summary, headline: "privateSentinel" }, { ...summary, detectedProviders: ["ghp_privateSentinel"] }, { ...summary, naivePersistingCount: -1 }, { ...summary, trustBoundaries: "vendor" }]) {
    assert.throws(() => validateTriageRequest(data));
    const response = await triageRoute(request(data));
    assert.equal(response.status, 400);
    assert.ok(!(await response.text()).includes("privateSentinel"));
  }
  assert.equal(calls, 0);
});

test("fallback separates static-key persistence from expiry and never invents an RFC response", () => {
  const result = deterministicTriage(validateTriageRequest(summary));
  assert.match(result.whyRevokeFails, /no applicable RFC/);
  assert.match(result.whyRevokeFails, /Static keys can persist until revoked/);
  assert.match(result.attackerStory, /possible paths/);
  const empty = deterministicTriage(validateTriageRequest({ ...summary, naivePersistingCount: 0 }));
  assert.match(empty.attackerStory, /does not establish/);
  assert.match(deterministicTriage(validateTriageRequest({ ...summary, rfc7009Status: 200 })).whyRevokeFails, /SHOULD/);
});

test("triage validates the complete model response, falling back honestly on malformed upstream output", async t => {
  const previous = { gemini: process.env.GEMINI_API_KEY, openai: process.env.OPENAI_API_KEY };
  t.after(() => {
    if (previous.gemini === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previous.gemini;
    if (previous.openai === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous.openai;
  });
  process.env.GEMINI_API_KEY = "test-server-key";
  process.env.OPENAI_API_KEY = "";
  const received: string[] = [];
  t.mock.method(globalThis, "fetch", async (_url: unknown, init: RequestInit) => {
    received.push(String(init.body));
    return Response.json({ candidates: [{ content: { parts: [{ text: '{"attackerStory": ["wrong shape"]}' }] } }] });
  });
  let response = await triageRoute(request(summary));
  assert.equal((await response.json()).fallbackUsed, true);
  assert.equal(received.length, 1);
  assert.ok(!received[0].includes("test-server-key"));
  assert.throws(() => parseModelTriage('{"attackerStory":"ok"}', "gemini"));
  t.mock.method(globalThis, "fetch", async () => Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ attackerStory: "Possible exposure.", whyRevokeFails: "Independent issuers need review.", first60SecondsAction: "Review the evidence." }) }] } }] }));
  response = await triageRoute(request(summary));
  const result = await response.json();
  assert.equal(result.fallbackUsed, false);
  assert.equal(result.provider, "gemini");
  assert.equal((await triageRoute(new Request("http://localhost", { method: "POST", body: "x".repeat(5000) }))).status, 400);
});

test("remediation preserves real issuer mechanics and avoids treating status alone as proof", async () => {
  const { enrichContainmentStep } = await import("../src/lib/remediationTemplates.ts");
  const step = { priority: 1, issuer: "GitHub", target_resource: "grant", action_type: "github_grant_delete" as const, command_or_endpoint: "", why_naive_fails: "Independent issuers", verification_probe: "", console_url: null };
  const github = enrichContainmentStep(step);
  assert.match(github.copyableCommand, /DELETE/);
  assert.match(github.copyableCommand, /CLIENT_ID:\$CLIENT_SECRET/);
  assert.match(github.copyableCommand, /\/grant/);
  assert.match(github.expectedStatus, /204/);
  const vercel = enrichContainmentStep({ ...step, issuer: "Vercel", action_type: "rotate_downstream_key" });
  assert.match(vercel.copyableCommand, /v3\/user\/tokens\/current/);
  assert.ok(!vercel.copyableCommand.includes("npx vercel tokens"));
  const anthropic = enrichContainmentStep({ ...step, issuer: "Anthropic", action_type: "rotate_downstream_key" });
  assert.match(anthropic.verificationProbe, /v1\/models/);
  const gcp = enrichContainmentStep({ ...step, issuer: "Google Cloud", action_type: "rotate_downstream_key" });
  assert.match(gcp.rfcNote!, /does not revoke short-lived/);
  assert.ok(!gcp.expectedStatus.includes("401/403"));
});
