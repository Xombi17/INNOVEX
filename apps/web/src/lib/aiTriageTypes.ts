import type { InputMode, ProviderId, TrustBoundary } from "../../../../contracts/index.d.ts";

export interface AITriageRequest {
  inputMode: InputMode;
  maxRiskScore: number;
  maxHops: number;
  trustBoundaries: TrustBoundary[];
  primaryProvider: ProviderId;
  detectedProviders: ProviderId[];
  naivePersistingCount: number;
  naiveStoppedPct: number;
  pkceProtected: boolean;
  rfc7009Status: number;
}

export interface AITriageResponse {
  attackerStory: string;
  whyRevokeFails: string;
  first60SecondsAction: string;
  modelBadge: string;
  provider: "gemini" | "openai" | "local-synthesizer";
  fallbackUsed: boolean;
}
