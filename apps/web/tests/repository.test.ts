import { test } from "node:test";
import assert from "node:assert/strict";
import {
  repositoryIdentifier,
  scanRepository,
  RepositoryError,
} from "../src/lib/repositoryScan.ts";
const sha = "a".repeat(40),
  treeSha = "b".repeat(40);
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status });
function fake(
  files: Record<string, string | Response>,
  options: { truncated?: boolean; failures?: boolean } = {},
) {
  const urls: string[] = [];
  const request = (async (url: string | URL | Request, init?: RequestInit) => {
    const target = String(url);
    urls.push(target);
    assert.equal(init?.redirect, "error");
    if (target.endsWith("commits/HEAD"))
      return json({ sha, commit: { tree: { sha: treeSha } } });
    if (target.includes("git/trees/"))
      return json({
        truncated: options.truncated,
        tree: Object.keys(files).map((path) => ({
          path,
          type: "blob",
          mode: "100644",
        })),
      });
    assert.ok(
      target.startsWith(`https://raw.githubusercontent.com/owner/repo/${sha}/`),
    );
    const path = decodeURIComponent(target.split(`/${sha}/`)[1]);
    const value = files[path];
    if (value instanceof Response) return value;
    return new Response(value, { status: value === undefined ? 404 : 200 });
  }) as typeof fetch;
  return { request, urls };
}
test("repository input rejects foreign hosts, credentials and traversal", () => {
  for (const value of [
    "http://github.com/o/r",
    "https://github.com.evil.test/o/r",
    "https://user:password@github.com/o/r",
    "../repo",
    "owner/..",
    "https://github.com/o/r?url=http://127.0.0.1",
    "https://github.com/o/r/tree/main",
  ])
    assert.throws(() => repositoryIdentifier(value));
  assert.equal(
    repositoryIdentifier("https://github.com/owner/repo.git"),
    "owner/repo",
  );
});
test("all inspected configuration files contribute findings, with no raw values returned", async () => {
  const secret = "syntheticValueForRegressionOnly";
  const { request, urls } = fake({
    ".env": `VERCEL_TOKEN=${secret}`,
    ".mcp.json": '{"env":{"GITHUB_TOKEN":"candidate_value"}}',
    ".env.example": "OPENAI_API_KEY=your_key_here",
    ".github/workflows/ci.yml": "permissions: write-all",
  });
  const result = await scanRepository("owner/repo", request);
  assert.equal(result.analysis.report.shadow_secrets.length, 2);
  assert.equal(result.analysis.context.coverage?.inspected.length, 4);
  assert.ok(
    result.analysis.context.evidence.some((item) => item.kind === "workflow"),
  );
  assert.ok(
    result.analysis.context.evidence.some(
      (item) => item.kind === "placeholder",
    ),
  );
  assert.ok(
    result.analysis.context.evidence.some((item) => item.source === ".env"),
  );
  assert.ok(!JSON.stringify(result).includes(secret));
  assert.ok(!JSON.stringify(result).includes("syntheticMcpPayload"));
  assert.ok(urls.some((url) => url.includes(`/${sha}/.env`)));
});
test("empty results do not fabricate a clean or compromised project", async () => {
  const result = await scanRepository("owner/repo", fake({}).request);
  assert.equal(result.analysis.report.shadow_secrets.length, 0);
  assert.equal(result.analysis.context.evidence.length, 0);
  assert.equal(result.analysis.context.coverage?.matchingFiles, 0);
  assert.ok(!result.message.includes("clean"));
});
test("file cap, oversized files and truncated inventories remain visibly partial", async () => {
  const files = Object.fromEntries(
    Array.from({ length: 10 }, (_, index) => [
      `dir${index}/.env`,
      "TOKEN=your_token_here",
    ]),
  );
  files["dir0/.env"] = "TOKEN=" + "a".repeat(65536);
  const result = await scanRepository(
    "owner/repo",
    fake(files, { truncated: true }).request,
  );
  assert.equal(result.analysis.context.coverage?.partial, true);
  assert.equal(result.analysis.context.coverage?.matchingFiles, 10);
  assert.equal(result.analysis.context.coverage?.inspected.length, 7);
  assert.equal(result.analysis.context.coverage?.skipped.length, 3);
  assert.equal(result.analysis.report.shadow_secrets.length, 0);
});
test("rate limits and inaccessible repositories are errors, never clean scans", async () => {
  for (const status of [403, 404, 429, 500])
    await assert.rejects(
      scanRepository("owner/repo", (async () =>
        json({}, status)) as typeof fetch),
      (error) => error instanceof RepositoryError && error.status >= 400,
    );
});
test("unsupported or unreadable config is skipped and reported", async () => {
  const result = await scanRepository(
    "owner/repo",
    fake({
      ".mcp.json": '{"invalid":',
      ".env": new Response("", { status: 404 }),
    }).request,
  );
  assert.equal(result.analysis.context.coverage?.partial, true);
  assert.equal(result.analysis.context.coverage?.inspected.length, 0);
  assert.equal(result.analysis.report.shadow_secrets.length, 0);
});
