import type { AITriageRequest, AITriageResponse } from "./aiTriageTypes.ts";

const PROVIDERS = ["google", "github", "microsoft", "slack", "salesforce", "vercel", "anthropic", "openai", "generic"];
const BOUNDARIES = ["personal", "developer_local", "vendor", "ci_cd", "enterprise_tenant"];
const MODES = ["oauth_url", "mcp_config", "takeout_grant", "incident_preset"];

export function validateTriageRequest(value: unknown): AITriageRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid summary.");
  const data = value as Record<string, unknown>;
  const allowed = ["inputMode", "maxRiskScore", "maxHops", "trustBoundaries", "primaryProvider", "detectedProviders", "naivePersistingCount", "naiveStoppedPct", "pkceProtected", "rfc7009Status"];
  const integer = (key: string, max: number) => Number.isInteger(data[key]) && Number(data[key]) >= 0 && Number(data[key]) <= max;
  const list = (key: string, values: string[], max: number) => Array.isArray(data[key]) && data[key].length <= max && data[key].every(item => typeof item === "string" && values.includes(item));
  if (Object.keys(data).some(key => !allowed.includes(key)) || !MODES.includes(String(data.inputMode)) || !PROVIDERS.includes(String(data.primaryProvider)) ||
    !integer("maxRiskScore", 100) || !integer("maxHops", 100) || !integer("naivePersistingCount", 10000) || !integer("naiveStoppedPct", 100) ||
    !list("trustBoundaries", BOUNDARIES, 5) || !list("detectedProviders", PROVIDERS, 9) || typeof data.pkceProtected !== "boolean" || ![0, 200].includes(Number(data.rfc7009Status)) || typeof data.rfc7009Status !== "number") {
    throw new Error("Supply bounded summary counts and recognized providers/boundaries only.");
  }
  return data as unknown as AITriageRequest;
}

export function deterministicTriage(data: AITriageRequest): AITriageResponse {
  const count = data.naivePersistingCount;
  const issuers = data.detectedProviders.length ? data.detectedProviders.join(", ") : data.primaryProvider;
  return {
    attackerStory: count
      ? `The catalog models ${count} resources or credentials that could remain exposed, across up to ${data.maxHops} hops. These are possible paths if access and exploitation occur; this input does not establish compromise or effective permissions.`
      : "The catalog models no surviving downstream resources for this input. This limited inspection does not establish credential validity, account safety or absence of compromise.",
    whyRevokeFails: `${data.rfc7009Status === 200 ? "In this simulation, an RFC 7009 HTTP 200 response is not proof of containment; invalid tokens also receive 200 and access-token cascading is only SHOULD. " : "This input has no applicable RFC 7009 response. "}Revocation at one issuer does not clean up independent keys, apps or workflow changes at other issuers. Static keys can persist until revoked; illustrative access-token expiry is a separate issue.`,
    first60SecondsAction: count
      ? `Review the evidence and prioritized runbook for ${issuers}. If exposure is confirmed, revoke the affected grants, rotate independent credentials, inspect persistence and verify rejection at each affected issuer. No actions were executed here.`
      : "Review inspection coverage and any skipped files. Confirm actual granted permissions with the account owner before deciding whether cleanup is needed. No actions were executed here.",
    modelBadge: "Smart Triage · Offline Synthesizer", provider: "local-synthesizer", fallbackUsed: true,
  };
}

export function triagePrompt(data: AITriageRequest): string {
  return `Explain the following bounded audit simulation facts in plain English: ${JSON.stringify(data)}.
Return exactly three short JSON string fields: attackerStory, whyRevokeFails, first60SecondsAction.
Describe POSSIBLE exposure, never observed compromise. Counts are resources/nodes, not distinct attack paths. Do not invent issuers, credentials, apps or capabilities.
HTTP 200 is not evidence of containment; RFC 7009 returns it for invalid tokens, and access-token cascading is SHOULD. Mention a simulated RFC response only if rfc7009Status is 200. GitHub uses DELETE /applications/{client_id}/grant (204), not RFC 7009. Independent static keys persist until revoked, not until an assumed JWT expiry. Full containment is conditional on successful actions and verification. No actions/probes were executed. PKCE S256 derives its challenge from the verifier, not the scopes; require a fresh client-managed authorization transaction. Zero modeled survivors is not proof of safety.`;
}

export function parseModelTriage(text: string, provider: "gemini" | "openai"): AITriageResponse {
  const parsed = JSON.parse(text) as Record<string, unknown>;
  const fields = ["attackerStory", "whyRevokeFails", "first60SecondsAction"] as const;
  if (!parsed || Array.isArray(parsed) || Object.keys(parsed).length !== 3 || fields.some(key => typeof parsed[key] !== "string" || !parsed[key].trim() || parsed[key].length > 1800)) throw new Error("Invalid model summary.");
  return { attackerStory: String(parsed.attackerStory), whyRevokeFails: String(parsed.whyRevokeFails), first60SecondsAction: String(parsed.first60SecondsAction),
    provider, modelBadge: `AI Triage · Live Model (${provider === "gemini" ? "Gemini" : "OpenAI"})`, fallbackUsed: false };
}
