import type { ParsedOAuthParams, PreConsentDecision } from "../../contracts/index.d.ts";
import { findScope, riskScores, scopeSeverity, sortedUnique } from "./catalog.ts";
import { parseOAuthUrl } from "./parsers.ts";

export function evaluatePreConsent(input: string | ParsedOAuthParams): PreConsentDecision {
  const oauth = typeof input === "string" ? parseOAuthUrl(input) : input;
  const flagged = oauth.requested_scopes.flatMap(scope => {
    const entry = findScope(oauth.provider, scope);
    const severity = scopeSeverity(oauth.provider, scope);
    return severity === "low" ? [] : [{
      scope_id: scope, severity,
      reason: entry?.capabilities.join("; ") ?? "Not fully described by the frozen catalog; review actual permissions before consent.",
      recommended_scope_id: entry?.least_privilege_alternative.scope_id ?? scope,
    }];
  });
  const score = Math.max(0, ...oauth.requested_scopes.map(scope => riskScores[scopeSeverity(oauth.provider, scope)]));
  const unknown = oauth.provider === "generic" || !oauth.requested_scopes.length;
  return {
    action: score >= 90 ? "BLOCK_PRE_CONSENT" : flagged.length || unknown ? "WARN" : "ALLOW",
    provider: oauth.provider, risk_score: unknown ? Math.max(score, 50) : score,
    pkce_protected: oauth.has_pkce,
    pkce_rewrite_warning: oauth.has_pkce ?
      "PKCE parameters detected (not cryptographically verified). Never rewrite the pending request. The initiating client must start fresh with a new verifier/challenge and state after scope review." :
      "Do not rewrite a pending authorization request. Ask the initiating client to start a fresh request with reviewed scopes and state.",
    flagged_scopes: flagged,
    recommended_scopes: sortedUnique(oauth.requested_scopes.map(scope => findScope(oauth.provider, scope)?.least_privilege_alternative.scope_id ?? scope)),
    // A URL alone cannot establish the initiating client's fresh state/verifier transaction.
    safe_replacement_url: null,
  };
}
