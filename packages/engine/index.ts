import type { AuditInput, AuditReport, PreConsentDecision, TrustBoundary } from "../../contracts/index.d.ts";
import { sortedUnique } from "./catalog.ts";
import { parseAuditInput } from "./parsers.ts";
import type { ParsedAuditInput } from "./parsers.ts";
import { buildBlastGraph } from "./graph.ts";
import { simulateContainment } from "./containment.ts";
import { evaluatePreConsent } from "./pre-consent.ts";

export { parseAuditInput, parseMcpConfig, parseOAuthUrl, parseTakeout } from "./parsers.ts";
export type { ParsedAuditInput } from "./parsers.ts";
export { buildBlastGraph } from "./graph.ts";
export { simulateContainment } from "./containment.ts";
export { evaluatePreConsent } from "./pre-consent.ts";
export type * from "../../contracts/index.d.ts";

export function analyzeAudit(input: AuditInput | ParsedAuditInput): AuditReport {
  // Normalized input lets local scanners merge already-redacted parser findings.
  const parsed = "raw_payload" in input ? parseAuditInput(input) : structuredClone(input);
  const graph = buildBlastGraph(parsed);
  const nodes = new Map(graph.nodes.map(node => [node.id, node]));
  const crossings: TrustBoundary[] = [];
  for (const edge of graph.edges) {
    const source = nodes.get(edge.source)!;
    const target = nodes.get(edge.target)!;
    if (source.trust_boundary !== target.trust_boundary) crossings.push(source.trust_boundary, target.trust_boundary);
  }
  const decisions = parsed.oauth_grants.map(evaluatePreConsent);
  const guard: PreConsentDecision = decisions.length ? {
    ...decisions[0],
    action: decisions.some(decision => decision.action === "BLOCK_PRE_CONSENT") ? "BLOCK_PRE_CONSENT" : decisions.some(decision => decision.action === "WARN") ? "WARN" : "ALLOW",
    risk_score: Math.max(...decisions.map(decision => decision.risk_score)),
    pkce_protected: decisions.some(decision => decision.pkce_protected),
    pkce_rewrite_warning: decisions.find(decision => decision.pkce_protected)?.pkce_rewrite_warning ?? decisions[0].pkce_rewrite_warning,
    flagged_scopes: [...new Map(decisions.flatMap(decision => decision.flagged_scopes).map(scope => [scope.scope_id, scope])).values()],
    recommended_scopes: sortedUnique(decisions.flatMap(decision => decision.recommended_scopes)),
  } : {
    action: "WARN", provider: "generic", risk_score: Math.max(0, ...parsed.shadow_secrets.map(finding => finding.severity === "critical" ? 95 : 75)),
    pkce_protected: false, pkce_rewrite_warning: "No OAuth authorization request was supplied; pre-consent evaluation is not applicable.",
    flagged_scopes: [], recommended_scopes: [], safe_replacement_url: null,
  };
  const maxHops = Math.max(0, ...graph.edges.map(edge => edge.hop));
  return {
    schema_version: "1.0.0", input_mode: parsed.input_mode, preset_id: parsed.preset_id,
    summary: {
      headline: `${maxHops}-hop potential blast radius across ${sortedUnique(crossings).length} trust boundaries`,
      max_risk_score: Math.max(0, guard.risk_score, ...graph.nodes.map(node => node.risk_score)), max_hops: maxHops,
      trust_boundary_crossings: sortedUnique(crossings) as TrustBoundary[],
      exposed_asset_count: graph.nodes.filter(node => ["data_store", "secret_credential", "downstream_platform"].includes(node.kind)).length,
      incident_framing_note: parsed.incident_framing_note,
    },
    parsed_oauth: parsed.oauth_grants[0] ?? null, shadow_secrets: parsed.shadow_secrets, graph,
    naive_containment: simulateContainment(graph, parsed, "naive_single_revoke"),
    full_containment: simulateContainment(graph, parsed, "full_multi_issuer"),
    pre_consent_guard: guard, ai_explainer_used: false,
  };
}
