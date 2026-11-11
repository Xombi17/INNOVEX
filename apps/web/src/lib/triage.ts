import type { AuditReport } from "../../../../contracts/index.d.ts";
import type { AITriageRequest, AITriageResponse } from "./aiTriageTypes.ts";
const PROVIDERS = [
  "google",
  "github",
  "microsoft",
  "slack",
  "salesforce",
  "vercel",
  "anthropic",
  "openai",
  "generic",
];
export function triageRequest(report: AuditReport): AITriageRequest {
  return {
    inputMode: report.input_mode,
    providers: [
      ...new Set([
        ...report.graph.nodes
          .filter(
            (node) =>
              node.kind === "oauth_app" || node.kind === "shadow_ai_tool",
          )
          .map((node) => node.provider),
        ...report.shadow_secrets.map((item) => item.provider),
      ]),
    ],
    credentialCount: report.shadow_secrets.length,
    scopeCount: report.graph.nodes.filter((node) => node.kind === "scope")
      .length,
    modeledNodes: report.naive_containment.persisting_node_ids.length,
  };
}
export function validateTriageRequest(value: unknown): AITriageRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (
    Object.keys(data).some(
      (key) =>
        ![
          "inputMode",
          "providers",
          "credentialCount",
          "scopeCount",
          "modeledNodes",
        ].includes(key),
    )
  )
    return null;
  if (
    !["oauth_url", "mcp_config", "takeout_grant", "incident_preset"].includes(
      data.inputMode as string,
    ) ||
    !Array.isArray(data.providers) ||
    data.providers.length > 9 ||
    !data.providers.every(
      (provider) =>
        typeof provider === "string" && PROVIDERS.includes(provider),
    )
  )
    return null;
  if (
    ![data.credentialCount, data.scopeCount, data.modeledNodes].every(
      (number) =>
        typeof number === "number" &&
        Number.isSafeInteger(number) &&
        number >= 0 &&
        number <= 100000,
    )
  )
    return null;
  return data as unknown as AITriageRequest;
}
export function localTriage(data: AITriageRequest): AITriageResponse {
  const isConfig = data.inputMode === "mcp_config";
  return {
    items: [
      {
        title: "What was identified",
        body: isConfig
          ? `${data.credentialCount} credential-like value(s) identified in the inspected configuration. This does not verify that a credential works or has been leaked to an attacker.`
          : `${data.scopeCount} requested permission(s) in the supplied authorization input. Requested access is not proof of approval or actual exploitation.`,
      },
      {
        title: "What could follow",
        body:
          data.modeledNodes > 0
            ? `${data.modeledNodes} modeled nodes could need review beyond the original grant. These consequences depend on actual permissions, resource contents and independently valid credentials.`
            : "No downstream exposure is modeled by this limited catalog. Unknown permissions, additional files or other credentials may still require review.",
      },
      {
        title: "What to review next",
        body:
          data.credentialCount > 0
            ? "Confirm which credentials are real and who owns them. If exposure is confirmed, rotate each at its actual issuer and check rejection of the old credential. ScopeBomb has not performed these actions."
            : "Review whether the requested access is needed. If already granted, inspect the provider’s app settings. Any separate credentials or sessions must be checked at their own issuers; provider revocation policies differ.",
      },
    ],
    modelBadge: "Local rule-based summary",
    provider: "local-synthesizer",
    fallbackUsed: true,
    timestamp: new Date().toISOString(),
  };
}
/** Models can prioritize vetted facts, but cannot supply new security assertions. */
export function applyFactOrder(
  base: AITriageResponse,
  order: unknown,
  provider: "gemini" | "openai",
): AITriageResponse | null {
  if (
    !Array.isArray(order) ||
    order.length !== 3 ||
    new Set(order).size !== 3 ||
    !order.every((index) => Number.isInteger(index) && index >= 0 && index < 3)
  )
    return null;
  return {
    ...base,
    items: order.map((index) => base.items[index]),
    provider,
    fallbackUsed: false,
    modelBadge: `AI-prioritized summary (${provider === "gemini" ? "Gemini" : "OpenAI"}); rule-based facts`,
  };
}
