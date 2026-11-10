// Frozen TypeScript Contract v1.0.0 — 1:1 mirror of contracts/scope_bomb.schema.json
// Workers MUST treat this file as read-only.

export type ProviderId =
  | "google"
  | "github"
  | "microsoft"
  | "slack"
  | "salesforce"
  | "vercel"
  | "anthropic"
  | "openai"
  | "generic";

export type Severity = "critical" | "high" | "medium" | "low";

export type TrustBoundary =
  | "personal"
  | "developer_local"
  | "vendor"
  | "ci_cd"
  | "enterprise_tenant";

export type InputMode =
  | "oauth_url"
  | "mcp_config"
  | "takeout_grant"
  | "incident_preset";

export type SimulationMode = "naive_single_revoke" | "full_multi_issuer";

export interface AuditInput {
  mode: InputMode;
  raw_payload: string;
  preset_id?: string | null;
  simulation_mode: SimulationMode;
}

export interface LeastPrivilegeAlternative {
  scope_id: string;
  description: string;
  notes: string;
}

export interface ScopeCatalogEntry {
  provider: ProviderId;
  scope_id: string;
  display_name: string;
  severity: Severity;
  category: string;
  capabilities: string[];
  enables_targets: string[];
  persistence_vectors: string[];
  least_privilege_alternative: LeastPrivilegeAlternative;
  is_pkce_sensitive: boolean;
  revocation_endpoint: string | null;
  rfc7009_notes: string;
}

export interface ReportSummary {
  headline: string;
  max_risk_score: number;
  max_hops: number;
  trust_boundary_crossings: TrustBoundary[];
  exposed_asset_count: number;
  incident_framing_note: string;
}

export interface ParsedOAuthParams {
  provider: ProviderId;
  client_id: string | null;
  redirect_uri: string | null;
  requested_scopes: string[];
  response_type: string | null;
  access_type: string | null;
  has_pkce: boolean;
  code_challenge_method: string | null;
  state_present: boolean;
}

export interface ShadowSecretFinding {
  source_file: string;
  provider: ProviderId;
  key_name: string;
  masked_preview: string;
  grant_type:
    | "oauth_token"
    | "static_pat"
    | "api_key"
    | "service_account"
    | "webhook_secret";
  rotation_issuer: string;
  severity: Severity;
  blast_targets: string[];
}

export type BlastNodeKind =
  | "human_identity"
  | "oauth_app"
  | "shadow_ai_tool"
  | "mcp_server"
  | "scope"
  | "data_store"
  | "secret_credential"
  | "attacker_persistence"
  | "downstream_platform";

export interface BlastNode {
  id: string;
  label: string;
  kind: BlastNodeKind;
  provider: ProviderId;
  severity: Severity;
  risk_score: number;
  trust_boundary: TrustBoundary;
  survives_naive_revoke: boolean;
  notes: string;
}

export type BlastEdgeRelation =
  | "authorizes"
  | "grants_scope"
  | "exposes_secret"
  | "crosses_boundary"
  | "persists_after_revoke"
  | "downgrades_to";

export interface BlastEdge {
  id: string;
  source: string;
  target: string;
  relation: BlastEdgeRelation;
  mechanism: string;
  hop: number;
  survives_naive_revoke: boolean;
}

export interface BlastRadiusGraph {
  nodes: BlastNode[];
  edges: BlastEdge[];
}

export type ContainmentActionType =
  | "rfc7009_revoke"
  | "github_grant_delete"
  | "rotate_downstream_key"
  | "audit_minted_apps"
  | "inspect_ci_workflows"
  | "invalidate_sessions";

export interface ContainmentStep {
  priority: number;
  issuer: string;
  target_resource: string;
  action_type: ContainmentActionType;
  command_or_endpoint: string;
  why_naive_fails: string;
  verification_probe: string;
  console_url: string | null;
}

export interface ContainmentOutcome {
  simulation_mode: SimulationMode;
  rfc7009_http_status_returned: number;
  rfc7009_trap_warning: string;
  jwt_residual_ttl_seconds: number;
  contained_node_ids: string[];
  persisting_node_ids: string[];
  persisting_edge_ids: string[];
  containment_ratio: number;
  ordered_steps: ContainmentStep[];
}

export interface FlaggedScope {
  scope_id: string;
  severity: Severity;
  reason: string;
  recommended_scope_id: string;
}

export interface PreConsentDecision {
  action: "ALLOW" | "WARN" | "BLOCK_PRE_CONSENT";
  provider: ProviderId;
  risk_score: number;
  pkce_protected: boolean;
  pkce_rewrite_warning: string;
  flagged_scopes: FlaggedScope[];
  recommended_scopes: string[];
  safe_replacement_url: string | null;
}

export interface AuditReport {
  schema_version: "1.0.0";
  input_mode: InputMode;
  preset_id?: string | null;
  summary: ReportSummary;
  parsed_oauth: ParsedOAuthParams | null;
  shadow_secrets: ShadowSecretFinding[];
  graph: BlastRadiusGraph;
  naive_containment: ContainmentOutcome;
  full_containment: ContainmentOutcome;
  pre_consent_guard: PreConsentDecision;
  ai_explainer_used: boolean;
}
