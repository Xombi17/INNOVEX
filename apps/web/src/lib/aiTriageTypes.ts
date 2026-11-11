export interface AITriageRequest {
  inputMode: "oauth_url" | "mcp_config" | "takeout_grant" | "incident_preset";
  providers: string[];
  credentialCount: number;
  scopeCount: number;
  modeledNodes: number;
}
export interface TriageItem {
  title: string;
  body: string;
}
export interface AITriageResponse {
  items: TriageItem[];
  modelBadge: string;
  provider: "gemini" | "openai" | "local-synthesizer";
  fallbackUsed: boolean;
  timestamp: string;
}
