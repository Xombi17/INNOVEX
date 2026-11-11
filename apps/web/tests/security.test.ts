import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { readBoundedText } from "../src/lib/boundedBody.ts";
import { analyzeInput } from "../src/lib/analysis.ts";
import { repositoryIdentifier } from "../src/lib/repositoryScan.ts";
import { validateTriageRequest, localTriage, triageRequest } from "../src/lib/triage.ts";
import { POST as triageRoute } from "../src/app/api/ai-triage/route.ts";
import { POST as scanRoute } from "../src/app/api/scan-repo/route.ts";
import { enrichContainmentStep } from "../src/lib/remediationTemplates.ts";

const summary = { inputMode: "mcp_config", providers: ["github", "vercel"], credentialCount: 2, scopeCount: 0, modeledNodes: 5 };
const request = (body: unknown) => new Request("http://localhost/api/test", { method: "POST", body: JSON.stringify(body) });

test("bounded bodies count streamed UTF-8 bytes and cancel oversized content", async () => {
  let cancelled = false;
  const response = new Response(new ReadableStream({ pull(controller) { controller.enqueue(new TextEncoder().encode("éé")); }, cancel() { cancelled = true; } }));
  await assert.rejects(readBoundedText(response, 3), /limit/);
  assert.equal(cancelled, true);
  assert.equal(await readBoundedText(new Response("é"), 2), "é");
});

test("both routes bound request bytes without trusting content-length", async () => {
  assert.equal((await triageRoute(new Request("http://localhost", { method: "POST", body: "é".repeat(2001) }))).status, 400);
  assert.equal((await scanRoute(new Request("http://localhost", { method: "POST", body: "é".repeat(1025) }))).status, 413);
});

test("configuration diagnostics exclude placeholders and raw credential values", () => {
  const result = analyzeInput({ mode: "mcp_config", raw_payload: 'GITHUB_TOKEN=${GITHUB_TOKEN}\nVERCEL_TOKEN=vcp_privateSentinel', simulation_mode: "naive_single_revoke" }, "example.env");
  assert.equal(result.report.shadow_secrets.length, 1);
  assert.equal(result.context.evidence.filter(item => item.kind === "placeholder").length, 1);
  assert.ok(!JSON.stringify(result).includes("privateSentinel"));
  assert.throws(() => analyzeInput({ mode: "mcp_config", raw_payload: '{"TOKEN":"privateSentinel",}', simulation_mode: "naive_single_revoke" }, "bad.json"), error => !String(error).includes("privateSentinel"));
});

test("repository route rejects arbitrary hosts and credentials before fetching", async t => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => { calls++; throw new Error(); });
  assert.equal(repositoryIdentifier("https://github.com/owner/repo.git"), "owner/repo");
  for (const repo of [null, {}, "http://github.com/a/b", "https://github.com.evil/a/b", "https://u:p@github.com/a/b", "https://127.0.0.1/a/b", "https://github.com/a/b/tree/main", "a/..", "a/%2e%2e", "https://github.com/a/b?token=secret"]) {
    assert.throws(() => repositoryIdentifier(repo));
    assert.equal((await scanRoute(request({ repo }))).status, 400);
  }
  assert.equal(calls, 0);
});

test("triage rejects arbitrary strings and extra fields before model calls", async t => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => { calls++; throw new Error(); });
  for (const data of [null, {}, { ...summary, headline: "privateSentinel" }, { ...summary, providers: ["ghp_privateSentinel"] }, { ...summary, modeledNodes: -1 }, { ...summary, providers: "github" }]) {
    assert.equal(validateTriageRequest(data), null);
    const response = await triageRoute(request(data));
    assert.equal(response.status, 400);
    assert.ok(!(await response.text()).includes("privateSentinel"));
  }
  assert.equal(calls, 0);
});

function inference(t: TestContext) {
  const previous = { gemini: process.env.GEMINI_API_KEY, openai: process.env.OPENAI_API_KEY };
  t.after(() => {
    for (const [key, value] of [["GEMINI_API_KEY", previous.gemini], ["OPENAI_API_KEY", previous.openai]]) {
      if (value === undefined) delete process.env[key!]; else process.env[key!] = value;
    }
  });
  process.env.GEMINI_API_KEY = "test-server-key";
  process.env.OPENAI_API_KEY = "";
}

test("malformed model output falls back; valid ordering cannot add security claims", async t => {
  inference(t);
  const received: string[] = [];
  t.mock.method(globalThis, "fetch", async (_url: unknown, init: RequestInit) => {
    assert.equal(init.redirect, "error");
    received.push(String(init.body));
    return Response.json({ candidates: [{ content: { parts: [{ text: '{"order":[0,0,1]}' }] } }] });
  });
  assert.equal((await (await triageRoute(request(summary))).json()).fallbackUsed, true);
  assert.ok(!received[0].includes("test-server-key"));
  t.mock.method(globalThis, "fetch", async () => Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ order: [2, 0, 1], inventedClaim: "You are secure" }) }] } }] }));
  const result = await (await triageRoute(request(summary))).json();
  assert.equal(result.fallbackUsed, false);
  const local = localTriage({ ...summary, inputMode: "mcp_config" });
  assert.deepEqual(result.items, [local.items[2], local.items[0], local.items[1]]);
  assert.ok(!JSON.stringify(result).includes("You are secure"));
});

test("oversized upstream model bodies are canceled and use local facts", async t => {
  inference(t);
  let cancelled = false;
  t.mock.method(globalThis, "fetch", async () => new Response(new ReadableStream({ pull(controller) { controller.enqueue(new Uint8Array(32769)); }, cancel() { cancelled = true; } })));
  assert.equal((await (await triageRoute(request(summary))).json()).fallbackUsed, true);
  assert.equal(cancelled, true);
});

test("OpenAI orders only local facts and receives only allowlisted context", async t => {
  inference(t);
  process.env.GEMINI_API_KEY = "";
  process.env.OPENAI_API_KEY = "test-server-key";
  const analysis = analyzeInput({ mode: "mcp_config", raw_payload: "GITHUB_TOKEN=privateInputSentinel", simulation_mode: "naive_single_revoke" }, "privatePathSentinel.env");
  const data = triageRequest(analysis.report);
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (url: unknown, init: RequestInit) => {
    calls++;
    assert.equal(url, "https://api.openai.com/v1/chat/completions");
    assert.equal(init.redirect, "error");
    assert.ok(init.signal instanceof AbortSignal);
    assert.equal((init.headers as Record<string, string>).Authorization, "Bearer test-server-key");
    const outbound = JSON.parse(String(init.body));
    const prompt = outbound.messages[0].content;
    assert.deepEqual(JSON.parse(prompt.split("Context: ")[1].split(". Facts: ")[0]), data);
    for (const forbidden of ["privateInputSentinel", "privatePathSentinel", "test-server-key", "raw_payload", "source_file"])
      assert.ok(!String(init.body).includes(forbidden));
    return Response.json({ choices: [{ message: { content: JSON.stringify({ order: [2, 0, 1], items: [{ body: "Invented safety claim" }] }) } }] });
  });
  const response = await triageRoute(request(data));
  const result = await response.json();
  const base = localTriage(data);
  assert.equal(calls, 1);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(result.provider, "openai");
  assert.equal(result.fallbackUsed, false);
  assert.match(result.modelBadge, /OpenAI.*rule-based facts/);
  assert.deepEqual(result.items, [base.items[2], base.items[0], base.items[1]]);
  assert.ok(!JSON.stringify(result).includes("Invented safety claim"));
});

test("OpenAI invalid responses and upstream failures preserve local fallback", async t => {
  inference(t);
  process.env.GEMINI_API_KEY = "";
  process.env.OPENAI_API_KEY = "test-server-key";
  const failures = [
    ["malformed envelope", () => new Response("not JSON")],
    ["malformed model JSON", () => Response.json({ choices: [{ message: { content: "not JSON" } }] })],
    ["duplicate indices", () => Response.json({ choices: [{ message: { content: '{"order":[0,0,1]}' } }] })],
    ["out-of-range indices", () => Response.json({ choices: [{ message: { content: '{"order":[0,1,3]}' } }] })],
    ["upstream HTTP failure", () => new Response("privateProviderError", { status: 503 })],
    ["upstream abort", () => { throw new DOMException("privateProviderError", "AbortError"); }],
  ] as const;
  for (const [label, respond] of failures) {
    await t.test(label, async child => {
      child.mock.method(globalThis, "fetch", async () => respond());
      const response = await triageRoute(request(summary));
      const result = await response.json();
      assert.equal(response.status, 200);
      assert.equal(result.fallbackUsed, true);
      assert.equal(result.provider, "local-synthesizer");
      assert.deepEqual(result.items, localTriage({ ...summary, inputMode: "mcp_config" }).items);
      assert.ok(!JSON.stringify(result).includes("privateProviderError"));
    });
  }
});

test("OpenAI cancels oversized UTF-8 output even when its character count fits", async t => {
  inference(t);
  process.env.GEMINI_API_KEY = "";
  process.env.OPENAI_API_KEY = "test-server-key";
  let cancelled = false;
  t.mock.method(globalThis, "fetch", async () => new Response(new ReadableStream({
    pull(controller) { controller.enqueue(new TextEncoder().encode("é".repeat(16385))); },
    cancel() { cancelled = true; },
  }), { headers: { "content-length": "1" } }));
  assert.equal((await (await triageRoute(request(summary))).json()).fallbackUsed, true);
  assert.equal(cancelled, true);
});

test("Gemini failure falls through to OpenAI; both failures fall back locally", async t => {
  inference(t);
  process.env.OPENAI_API_KEY = "test-second-key";
  for (const succeeds of [true, false]) {
    await t.test(succeeds ? "OpenAI succeeds" : "both providers fail", async child => {
      const calls: unknown[] = [];
      child.mock.method(globalThis, "fetch", async (url: unknown) => {
        calls.push(url);
        if (String(url).includes("googleapis.com")) throw new DOMException("Timed out", "TimeoutError");
        return succeeds
          ? Response.json({ choices: [{ message: { content: '{"order":[1,2,0]}' } }] })
          : Response.json({ choices: [{ message: { content: '{"order":[1,1,0]}' } }] });
      });
      const result = await (await triageRoute(request(summary))).json();
      assert.equal(calls.length, 2);
      assert.match(String(calls[0]), /googleapis/);
      assert.match(String(calls[1]), /api.openai.com/);
      assert.equal(result.provider, succeeds ? "openai" : "local-synthesizer");
      assert.equal(result.fallbackUsed, !succeeds);
      const items = localTriage({ ...summary, inputMode: "mcp_config" }).items;
      assert.deepEqual(result.items, succeeds ? [items[1], items[2], items[0]] : items);
    });
  }
});

test("unconfigured inference never fetches and returns the supported local summary", async t => {
  inference(t);
  process.env.GEMINI_API_KEY = "";
  const fetchMock = t.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected inference request"); });
  const result = await (await triageRoute(request(summary))).json();
  assert.equal(result.fallbackUsed, true);
  assert.equal(result.provider, "local-synthesizer");
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("local summary never certifies safety or observed compromise", () => {
  const result = localTriage({ ...summary, inputMode: "mcp_config" });
  assert.match(result.items[0].body, /does not verify/);
  assert.match(result.items[1].body, /depend on actual permissions/);
  assert.match(result.items[2].body, /not performed/);
  assert.match(localTriage({ ...summary, inputMode: "mcp_config", modeledNodes: 0 }).items[1].body, /limited catalog/);
});

test("remediation preserves issuer mechanics and independent credential verification", () => {
  const step = { priority: 1, issuer: "GitHub", target_resource: "grant", action_type: "github_grant_delete" as const, command_or_endpoint: "", why_naive_fails: "Independent issuers", verification_probe: "", console_url: null };
  const github = enrichContainmentStep(step);
  assert.match(github.copyableCommand, /DELETE/);
  assert.match(github.copyableCommand, /CLIENT_ID:\$CLIENT_SECRET/);
  assert.match(github.copyableCommand, /\/grant/);
  assert.match(github.expectedStatus, /204/);
  assert.match(github.expectedStatus, /PATs need separate/);
  const vercel = enrichContainmentStep({ ...step, issuer: "Vercel", action_type: "rotate_downstream_key" });
  assert.match(vercel.copyableCommand, /v3\/user\/tokens\/current/);
  const anthropic = enrichContainmentStep({ ...step, issuer: "Anthropic", action_type: "rotate_downstream_key" });
  assert.match(anthropic.verificationProbe, /v1\/models/);
  const gcp = enrichContainmentStep({ ...step, issuer: "Google Cloud", action_type: "rotate_downstream_key" });
  assert.match(gcp.rfcNote!, /does not revoke short-lived/);
});
