import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildCleanInitiationTemplate, buildArenaDeepLink, isMonitoredOAuthUrl, SAMPLE_OAUTH_URLS } from "../shared.js";
import { evaluatePreConsent } from "../engine/index.js";

test("MV3 scope policy and handoff preserve pending PKCE and never produce a replayable replacement", () => {
  const original = SAMPLE_OAUTH_URLS.google_pkce_trap;
  const pending = new URL(original);
  const decision = evaluatePreConsent(original);
  assert.equal(decision.action, "BLOCK_PRE_CONSENT");
  assert.equal(decision.safe_replacement_url, null);
  const template = new URL(buildCleanInitiationTemplate(original, decision.recommended_scopes));
  for (const key of ["code_challenge", "code_challenge_method", "state"]) assert.equal(template.searchParams.has(key), false);
  assert.equal(new URL(original).searchParams.get("code_challenge"), pending.searchParams.get("code_challenge"));
  assert.equal(new URL(buildArenaDeepLink("https://scopebomb.vercel.app", original)).searchParams.get("oauth_url"), original);
  assert.equal(evaluatePreConsent(SAMPLE_OAUTH_URLS.google_safe_min).action, "ALLOW");
  assert.equal(isMonitoredOAuthUrl("https://accounts.google.com.evil/o/oauth2/v2/auth"), false);
});

test("service worker redirects high-risk top-level requests to guard without changing the original URL", async () => {
  const handlers = {};
  const updates = [];
  const stored = {};
  const listen = name => ({ addListener(callback) { handlers[name] = callback; } });
  const chrome = {
    webNavigation: { onBeforeNavigate: listen("navigate") },
    tabs: { onUpdated: listen("updated"), onRemoved: listen("removed"), async update(id, value) { updates.push({ id, ...value }); } },
    action: { async setBadgeText() {}, async setBadgeBackgroundColor() {} },
    storage: { local: { async set(value) { Object.assign(stored, value); } }, session: { async get() { return {}; }, async remove() {} } },
    runtime: { getURL(path) { return `chrome-extension://test/${path}`; }, onMessage: listen("message") },
  };
  const { evaluatePreConsent, parseOAuthUrl } = await import("../engine/index.js");
  const { ACTION_META } = await import("../shared.js");
  let source = await readFile(new URL("../background.js", import.meta.url), "utf8");
  source = source.replace(/^import .*;\n/gm, "");
  new Function("chrome", "evaluatePreConsent", "parseOAuthUrl", "ACTION_META", "isMonitoredOAuthUrl", source)(chrome, evaluatePreConsent, parseOAuthUrl, ACTION_META, isMonitoredOAuthUrl);
  handlers.navigate({ frameId: 0, tabId: 7, url: SAMPLE_OAUTH_URLS.google_pkce_trap });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(updates.length, 1);
  assert.equal(new URL(updates[0].url).searchParams.get("url"), SAMPLE_OAUTH_URLS.google_pkce_trap);
  handlers.navigate({ frameId: 1, tabId: 8, url: SAMPLE_OAUTH_URLS.google_pkce_trap });
  handlers.navigate({ frameId: 0, tabId: 9, url: SAMPLE_OAUTH_URLS.google_safe_min });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(updates.length, 1);
  assert.ok(stored.lastIntercepted);
});
