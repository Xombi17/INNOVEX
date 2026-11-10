import test from "node:test";
import assert from "node:assert/strict";
import { evaluatePreConsent, parseOAuthUrl } from "../../packages/engine/index.ts";

test("critical PKCE grants are blocked with least-privilege suggestions and no replayable URL", () => {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth?client_id=app&scope=https://www.googleapis.com/auth/drive+https://www.googleapis.com/auth/gmail.modify+openid&code_challenge=a%2Bb&code_challenge_method=S256&state=s");
  const before = url.href;
  const decision = evaluatePreConsent(url.href);
  assert.equal(url.href, before);
  assert.equal(decision.action, "BLOCK_PRE_CONSENT");
  assert.equal(decision.pkce_protected, true);
  assert.equal(decision.flagged_scopes.length, 2);
  assert.deepEqual(decision.recommended_scopes, ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/gmail.readonly", "openid"]);
  assert.equal(decision.safe_replacement_url, null);
  assert.match(decision.pkce_rewrite_warning, /new verifier\/challenge and state/);
  const parsed = parseOAuthUrl(before);
  const snapshot = structuredClone(parsed);
  assert.deepEqual(evaluatePreConsent(parsed), decision);
  assert.deepEqual(parsed, snapshot);
});

test("low-risk recognized identity scopes are allowed; unknown scopes/issuers or absent scopes warn", () => {
  assert.equal(evaluatePreConsent("https://accounts.google.com/o/oauth2/v2/auth?scope=openid+email+profile").action, "ALLOW");
  assert.equal(evaluatePreConsent("https://github.com/login/oauth/authorize?scope=read:user").action, "ALLOW");
  assert.equal(evaluatePreConsent("https://login.microsoftonline.com/common/oauth2/v2.0/authorize?scope=User.Read").action, "ALLOW");
  for (const url of ["https://accounts.google.com/o/oauth2/v2/auth?scope=unknown.scope",
    "https://unknown.example/auth?scope=openid", "https://github.com/login/oauth/authorize?client_id=app"]) {
    const decision = evaluatePreConsent(url);
    assert.equal(decision.action, "WARN");
    assert.ok(decision.risk_score >= 50);
  }
});

test("read-only mail remains sensitive and non-PKCE requests also require fresh authorization", () => {
  const decision = evaluatePreConsent("https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/gmail.readonly");
  assert.equal(decision.action, "WARN");
  assert.equal(decision.pkce_protected, false);
  assert.equal(decision.safe_replacement_url, null);
  assert.match(decision.pkce_rewrite_warning, /fresh request/);
  assert.equal(evaluatePreConsent("https://slack.com/oauth/v2/authorize?scope=channels:read&user_scope=admin").action, "BLOCK_PRE_CONSENT");
});
