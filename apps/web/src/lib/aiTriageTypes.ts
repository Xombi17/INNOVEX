export interface AITriageRequest {
  inputMode: string;
  presetId?: string | null;
  headline: string;
  maxRiskScore: number;
  maxHops: number;
  trustBoundaries: string[];
  primaryProvider: string;
  requestedScopes: string[];
  detectedKeyNames: string[];
  naivePersistingCount: number;
  naiveStoppedPct: number;
  topPersistingLabels: string[];
  pkceProtected: boolean;
}

export interface AITriageResponse {
  attackerStory: string;
  whyRevokeFails: string;
  first60SecondsAction: string;
  modelBadge: string;
  provider: "gemini" | "openai" | "local-synthesizer";
  fallbackUsed: boolean;
  timestamp: string;
}

