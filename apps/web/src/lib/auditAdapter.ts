import type {
  AuditInput,
  AuditReport,
  BlastEdge,
  BlastNode,
  ContainmentStep,
  FlaggedScope,
  ParsedOAuthParams,
  ProviderId,
  ScopeCatalogEntry,
  Severity,
  ShadowSecretFinding,
  TrustBoundary,
} from "@contracts/index";
import sampleReportFixture from "@contracts/sample_report.fixture.json";
import scopeCatalogJson from "@data/scope_catalog.json";
import { PHASE1_PRESET_REPORTS } from "./presetFixtures";

export interface IncidentPresetSummary {
  preset_id: string;
  title: string;
  year: number;
  classification: string;
  summary: string;
  sample_oauth_url: string;
  sample_mcp_config: string | null;
}

const catalogScopes = scopeCatalogJson.scopes as ScopeCatalogEntry[];
const incidentPresets =
  scopeCatalogJson.incident_presets as IncidentPresetSummary[];

export function getIncidentPresets(): IncidentPresetSummary[] {
  return incidentPresets;
}

export function getCatalogScopes(): ScopeCatalogEntry[] {
  return catalogScopes;
}

/**
 * Single Phase 1 Boundary Adapter (`AuditInput -> AuditReport`).
 *
 * Swap Target (Post-Phase 1 Merge):
 * Replace `runFixtureBackedAudit` with a 1-line import of Codex's deterministic engine:
 *   `import { analyzeScopeBomb } from "@scopebomb/engine";`
 */
export function runScopeBombAudit(input: AuditInput): AuditReport {
  return runFixtureBackedAudit(input);
}

// ---------------------------------------------------------------------------
// Temporary Phase 1 fixture + catalog backing (replaced 1-line post-merge)
// ---------------------------------------------------------------------------

function runFixtureBackedAudit(input: AuditInput): AuditReport {
  if (input.mode === "incident_preset") {
    const presetId = input.preset_id ?? "rohan_mcp_oauth_trap";
    if (presetId === "rohan_mcp_oauth_trap") {
      return sampleReportFixture as AuditReport;
    }
    const found = PHASE1_PRESET_REPORTS[presetId];
    if (found) {
      return found;
    }
    return sampleReportFixture as AuditReport;
  }

  if (input.mode === "oauth_url") {
    return buildPreviewFromOAuthUrl(input.raw_payload);
  }

  return buildPreviewFromConfigOrTakeout(input.raw_payload, input.mode);
}

function detectProviderFromUrl(url: URL): ProviderId {
  const host = url.hostname.toLowerCase();
  if (host.includes("google")) return "google";
  if (host.includes("github")) return "github";
  if (host.includes("microsoftonline") || host.includes("live.com")) {
    return "microsoft";
  }
  if (host.includes("slack.com")) return "slack";
  if (host.includes("salesforce.com")) return "salesforce";
  if (host.includes("vercel.com")) return "vercel";
  return "generic";
}

function findCatalogEntry(
  provider: ProviderId,
  rawScope: string,
): ScopeCatalogEntry | undefined {
  const normalized = rawScope.trim().toLowerCase();
  return catalogScopes.find((entry) => {
    if (entry.provider !== provider && provider !== "generic") return false;
    const id = entry.scope_id.toLowerCase();
    return (
      id === normalized ||
      id.replace(/\/$/, "") === normalized.replace(/\/$/, "") ||
      id.endsWith(`/${normalized}`) ||
      normalized.endsWith(`/${id}`)
    );
  });
}

function severityScore(sev: Severity): number {
  switch (sev) {
    case "critical":
      return 94;
    case "high":
      return 78;
    case "medium":
      return 52;
    case "low":
      return 20;
  }
}

function buildSafeReplacementUrl(
  url: URL,
  recommendedScopes: string[],
): string {
  const clean = new URL(url.toString());
  if (recommendedScopes.length > 0) {
    clean.searchParams.set("scope", recommendedScopes.join(" "));
  }
  // Never rewrite scopes while keeping an old PKCE code_challenge or stale state.
  clean.searchParams.delete("code_challenge");
  clean.searchParams.delete("code_challenge_method");
  return clean.toString();
}

function buildPreviewFromOAuthUrl(rawUrl: string): AuditReport {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return {
      ...(sampleReportFixture as AuditReport),
      input_mode: "oauth_url",
      preset_id: null,
      summary: {
        headline:
          "Invalid OAuth authorization URL — paste a full https://... authorize URL",
        max_risk_score: 0,
        max_hops: 1,
        trust_boundary_crossings: ["personal"],
        exposed_asset_count: 0,
        incident_framing_note:
          "Could not parse input as a valid URL. Expected Google, GitHub, Microsoft, or Slack OAuth2 authorize URL.",
      },
      parsed_oauth: null,
      shadow_secrets: [],
      graph: { nodes: [], edges: [] },
      pre_consent_guard: {
        action: "WARN",
        provider: "generic",
        risk_score: 0,
        pkce_protected: false,
        pkce_rewrite_warning:
          "Provide a valid https:// OAuth consent URL to evaluate PKCE and scope downgrades.",
        flagged_scopes: [],
        recommended_scopes: [],
        safe_replacement_url: null,
      },
    };
  }

  const provider = detectProviderFromUrl(url);
  const rawScopeParam = url.searchParams.get("scope") ?? "";
  const requestedScopes = rawScopeParam
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const codeChallenge = url.searchParams.get("code_challenge");
  const codeChallengeMethod = url.searchParams.get("code_challenge_method");
  const accessType = url.searchParams.get("access_type");
  const stateParam = url.searchParams.get("state");

  const parsed: ParsedOAuthParams = {
    provider,
    client_id: url.searchParams.get("client_id"),
    redirect_uri: url.searchParams.get("redirect_uri"),
    requested_scopes: requestedScopes,
    response_type: url.searchParams.get("response_type"),
    access_type: accessType,
    has_pkce: Boolean(codeChallenge),
    code_challenge_method: codeChallengeMethod,
    state_present: Boolean(stateParam),
  };

  const flagged: FlaggedScope[] = [];
  const recommendedScopes: string[] = [];
  const matches: Array<{ raw: string; entry?: ScopeCatalogEntry }> = [];

  for (const scope of requestedScopes) {
    const entry = findCatalogEntry(provider, scope);
    matches.push({ raw: scope, entry });
    if (entry) {
      recommendedScopes.push(entry.least_privilege_alternative.scope_id);
      if (entry.severity === "critical" || entry.severity === "high") {
        flagged.push({
          scope_id: scope,
          severity: entry.severity,
          reason:
            entry.capabilities[0] ??
            `${entry.display_name} exceeds least privilege`,
          recommended_scope_id: entry.least_privilege_alternative.scope_id,
        });
      }
    } else {
      recommendedScopes.push(scope);
    }
  }

  const isKnownLeastPrivilege = (rawScope: string): boolean => {
    const norm = rawScope.trim().toLowerCase();
    return catalogScopes.some(
      (e) => e.least_privilege_alternative.scope_id.toLowerCase() === norm,
    );
  };

  const maxRisk = matches.reduce((acc, item) => {
    const score = item.entry
      ? severityScore(item.entry.severity)
      : isKnownLeastPrivilege(item.raw)
        ? 18
        : 45;
    return Math.max(acc, score);
  }, requestedScopes.length > 0 ? 18 : 15);

  const hasCritical = flagged.some((f) => f.severity === "critical");
  const action = hasCritical
    ? "BLOCK_PRE_CONSENT"
    : flagged.length > 0
      ? "WARN"
      : "ALLOW";

  const nodes: BlastNode[] = [
    {
      id: "n_user",
      label: `Authenticated User (${provider})`,
      kind: "human_identity",
      provider,
      severity: "medium",
      risk_score: 30,
      trust_boundary: "personal",
      survives_naive_revoke: false,
      notes: "Initiating OAuth consent flow.",
    },
    {
      id: "n_client",
      label: `OAuth Client (${parsed.client_id ?? "unknown client_id"})`,
      kind: "oauth_app",
      provider,
      severity: hasCritical ? "high" : "medium",
      risk_score: hasCritical ? 82 : 45,
      trust_boundary: "vendor",
      survives_naive_revoke: false,
      notes: `Redirect URI: ${parsed.redirect_uri ?? "not specified"}`,
    },
  ];

  const edges: BlastEdge[] = [
    {
      id: "e_oauth_1",
      source: "n_user",
      target: "n_client",
      relation: "authorizes",
      mechanism: `OAuth2 ${parsed.has_pkce ? "PKCE" : "non-PKCE"} consent (${parsed.access_type ?? "online"})`,
      hop: 1,
      survives_naive_revoke: false,
    },
  ];

  const boundaries = new Set<TrustBoundary>(["personal", "vendor"]);
  let persistingNodes: string[] = [];
  let persistingEdges: string[] = [];

  matches.forEach((m, idx) => {
    const scopeNodeId = `n_scope_${idx}`;
    const leastPriv = !m.entry && isKnownLeastPrivilege(m.raw);
    const sev: Severity = m.entry?.severity ?? (leastPriv ? "low" : "medium");
    const isRisky = sev === "critical" || sev === "high";
    const targetBoundary: TrustBoundary =
      provider === "github"
        ? "ci_cd"
        : provider === "microsoft"
          ? "enterprise_tenant"
          : "developer_local";
    if (isRisky) boundaries.add(targetBoundary);

    nodes.push({
      id: scopeNodeId,
      label: m.entry
        ? m.entry.display_name
        : leastPriv
          ? `Least-Privilege Scope: ${m.raw.replace("https://www.googleapis.com/auth/", "")}`
          : `Scope: ${m.raw}`,
      kind: "scope",
      provider,
      severity: sev,
      risk_score: leastPriv ? 18 : severityScore(sev),
      trust_boundary: targetBoundary,
      survives_naive_revoke: isRisky,
      notes:
        m.entry?.rfc7009_notes ??
        (leastPriv
          ? "Verified least-privilege replacement scope from data/scope_catalog.json."
          : "Unlisted scope; verify whether least-privilege alternative exists."),
    });

    const scopeEdgeId = `e_scope_${idx}`;
    edges.push({
      id: scopeEdgeId,
      source: "n_client",
      target: scopeNodeId,
      relation: "grants_scope",
      mechanism: m.raw,
      hop: 2,
      survives_naive_revoke: isRisky,
    });

    if (isRisky && m.entry && m.entry.persistence_vectors.length > 0) {
      const persistId = `n_persist_${idx}`;
      nodes.push({
        id: persistId,
        label: `Persistence: ${m.entry.persistence_vectors.join(", ")}`,
        kind: "attacker_persistence",
        provider,
        severity: sev,
        risk_score: severityScore(sev),
        trust_boundary: targetBoundary,
        survives_naive_revoke: true,
        notes: `Enables targets: ${m.entry.enables_targets.join(", ")}`,
      });
      const persistEdgeId = `e_persist_${idx}`;
      edges.push({
        id: persistEdgeId,
        source: scopeNodeId,
        target: persistId,
        relation: "persists_after_revoke",
        mechanism: m.entry.enables_targets[0] ?? "downstream_persistence",
        hop: 3,
        survives_naive_revoke: true,
      });
      persistingNodes.push(scopeNodeId, persistId);
      persistingEdges.push(scopeEdgeId, persistEdgeId);
    } else if (isRisky) {
      persistingNodes.push(scopeNodeId);
      persistingEdges.push(scopeEdgeId);
    }
  });

  const maxHops = edges.some((e) => e.hop === 3) ? 3 : 2;
  const revEndpoint =
    matches.find((m) => m.entry?.revocation_endpoint)?.entry
      ?.revocation_endpoint ??
    (provider === "google"
      ? "https://oauth2.googleapis.com/revoke"
      : provider === "github"
        ? "https://api.github.com/applications/{client_id}/grant"
        : "Provider session/grant revocation endpoint");

  const safeUrl =
    flagged.length > 0
      ? buildSafeReplacementUrl(url, recommendedScopes)
      : url.toString();

  const pkceWarning = parsed.has_pkce
    ? `Request carries PKCE (${parsed.code_challenge_method ?? "S256"} code_challenge). Rewriting scope= mid-flight would trigger invalid_scope/state mismatch or break client verifier binding; ScopeBomb blocks BEFORE consent and prepares a clean initiation URL without stale code_challenge.`
    : flagged.length > 0
      ? "Request has no PKCE code_challenge and asks for high-privilege scopes. Block pre-consent and re-initiate with least-privilege scopes."
      : "Requested scopes match least-privilege baseline.";

  const fullSteps: ContainmentStep[] = [
    {
      priority: 1,
      issuer: provider.toUpperCase(),
      target_resource: parsed.client_id ?? "OAuth grant",
      action_type:
        provider === "github" ? "github_grant_delete" : "rfc7009_revoke",
      command_or_endpoint:
        provider === "github"
          ? `DELETE https://api.github.com/applications/${parsed.client_id ?? "{client_id}"}/grant`
          : `POST ${revEndpoint}`,
      why_naive_fails:
        provider === "github"
          ? "GitHub revokes grants via Basic-auth DELETE -> 204, not RFC 7009 form POST."
          : "RFC 7009 HTTP 200 OK does not prove access-token cascading or clear exfiltrated secrets.",
      verification_probe:
        "Call downstream resource API with revoked token -> expect HTTP 401/403",
      console_url:
        provider === "google"
          ? "https://myaccount.google.com/permissions"
          : provider === "github"
            ? "https://github.com/settings/connections/applications"
            : null,
    },
  ];

  if (persistingNodes.length > 0) {
    fullSteps.push({
      priority: 2,
      issuer: "Downstream & Persistence Audit",
      target_resource: "Secondary tokens, CI workflows, mailbox rules",
      action_type:
        provider === "github" ? "inspect_ci_workflows" : "audit_minted_apps",
      command_or_endpoint:
        provider === "github"
          ? "Audit .github/workflows/*.yml, deploy keys, and downstream CI secrets"
          : "Audit forwarding rules, exported Drive secrets, and minted secondary apps",
      why_naive_fails:
        "Persistence artifacts created during the active token window live outside the original OAuth grant.",
      verification_probe:
        "Confirm no unapproved workflows, forwarding rules, or secondary keys remain",
      console_url: null,
    });
  }

  return {
    schema_version: "1.0.0",
    input_mode: "oauth_url",
    preset_id: null,
    summary: {
      headline:
        flagged.length > 0
          ? `${maxHops}-hop ${provider} OAuth over-scope: ${flagged.length} high-risk scope(s) flagged before consent`
          : `${provider} OAuth URL inspected — baseline least-privilege scopes`,
      max_risk_score: maxRisk,
      max_hops: maxHops,
      trust_boundary_crossings: Array.from(boundaries),
      exposed_asset_count: Math.max(1, persistingNodes.length),
      incident_framing_note:
        "Live Phase 1 OAuth URL inspection against data/scope_catalog.json (read-only preview; zero network calls).",
    },
    parsed_oauth: parsed,
    shadow_secrets: [],
    graph: { nodes, edges },
    naive_containment: {
      simulation_mode: "naive_single_revoke",
      rfc7009_http_status_returned: provider === "github" ? 204 : 200,
      rfc7009_trap_warning:
        persistingNodes.length > 0
          ? "Single-endpoint revocation leaves residual access token TTL window and any downstream persistence vectors untouched."
          : "No persisting downstream vectors detected for baseline scopes.",
      jwt_residual_ttl_seconds: persistingNodes.length > 0 ? 3600 : 0,
      contained_node_ids: ["n_client"],
      persisting_node_ids: persistingNodes,
      persisting_edge_ids: persistingEdges,
      containment_ratio:
        nodes.length > 1
          ? Number(
              (
                (nodes.length - 1 - persistingNodes.length) /
                Math.max(1, nodes.length - 1)
              ).toFixed(2),
            )
          : 1,
      ordered_steps: [fullSteps[0]],
    },
    full_containment: {
      simulation_mode: "full_multi_issuer",
      rfc7009_http_status_returned: provider === "github" ? 204 : 200,
      rfc7009_trap_warning:
        "Full containment combines provider revocation with downstream persistence audit and API rejection probes.",
      jwt_residual_ttl_seconds: 0,
      contained_node_ids: nodes
        .filter((n) => n.id !== "n_user")
        .map((n) => n.id),
      persisting_node_ids: [],
      persisting_edge_ids: [],
      containment_ratio: 1,
      ordered_steps: fullSteps,
    },
    pre_consent_guard: {
      action,
      provider,
      risk_score: maxRisk,
      pkce_protected: parsed.has_pkce,
      pkce_rewrite_warning: pkceWarning,
      flagged_scopes: flagged,
      recommended_scopes: recommendedScopes,
      safe_replacement_url: safeUrl,
    },
    ai_explainer_used: false,
  };
}

function maskSecret(val: string): string {
  const trimmed = val.trim().replace(/^["']|["']$/g, "");
  if (trimmed.length <= 8) return "****";
  return `${trimmed.slice(0, 4)}****${trimmed.slice(-4)}`;
}

function classifyKey(
  keyName: string,
  value: string,
): {
  provider: ProviderId;
  grant_type: ShadowSecretFinding["grant_type"];
  issuer: string;
  severity: Severity;
  targets: string[];
} {
  const k = keyName.toUpperCase();
  const v = value.trim();
  if (k.includes("GITHUB") || v.startsWith("ghp_") || v.startsWith("gho_")) {
    return {
      provider: "github",
      grant_type: v.startsWith("gho_") ? "oauth_token" : "static_pat",
      issuer: "GitHub",
      severity: "critical",
      targets: ["private_source_code", "ci_cd_secrets", "workflow_yaml"],
    };
  }
  if (k.includes("VERCEL") || v.startsWith("vcp_")) {
    return {
      provider: "vercel",
      grant_type: "api_key",
      issuer: "Vercel",
      severity: "critical",
      targets: ["prod_env_vars", "deployments"],
    };
  }
  if (k.includes("OPENAI") || v.startsWith("sk-proj-")) {
    return {
      provider: "openai",
      grant_type: "api_key",
      issuer: "OpenAI",
      severity: "high",
      targets: ["api_billing_quota", "fine_tunes_and_files"],
    };
  }
  if (k.includes("ANTHROPIC") || v.startsWith("sk-ant-")) {
    return {
      provider: "anthropic",
      grant_type: "api_key",
      issuer: "Anthropic",
      severity: "high",
      targets: ["api_billing_quota", "workspace_logs"],
    };
  }
  if (k.includes("SALESFORCE") || v.startsWith("5Aep")) {
    return {
      provider: "salesforce",
      grant_type: "oauth_token",
      issuer: "Salesforce",
      severity: "critical",
      targets: ["crm_customer_records", "support_cases"],
    };
  }
  if (k.includes("SLACK") || v.startsWith("xoxb-") || v.startsWith("xoxp-")) {
    return {
      provider: "slack",
      grant_type: "oauth_token",
      issuer: "Slack",
      severity: "critical",
      targets: ["private_channels", "shared_env_snippets"],
    };
  }
  return {
    provider: "generic",
    grant_type: "api_key",
    issuer: "External Key Issuer",
    severity: "high",
    targets: ["downstream_api_resources"],
  };
}

function buildPreviewFromConfigOrTakeout(
  rawPayload: string,
  mode: "mcp_config" | "takeout_grant",
): AuditReport {
  if (mode === "takeout_grant") {
    try {
      const parsedJson = JSON.parse(rawPayload);
      const items = Array.isArray(parsedJson)
        ? parsedJson
        : Array.isArray(parsedJson?.grants)
          ? parsedJson.grants
          : [parsedJson];
      const firstWithScopes = items.find(
        (item: Record<string, unknown>) =>
          item && (Array.isArray(item.scopes) || Array.isArray(item.scope)),
      );
      if (firstWithScopes) {
        const scopes: string[] = Array.isArray(firstWithScopes.scopes)
          ? firstWithScopes.scopes.map(String)
          : String(firstWithScopes.scope ?? "")
              .split(/[\s,]+/)
              .filter(Boolean);
        const clientId = String(
          firstWithScopes.clientId ??
            firstWithScopes.client_id ??
            firstWithScopes.displayName ??
            "takeout-oauth-grant",
        );
        const syntheticUrl = new URL(
          "https://accounts.google.com/o/oauth2/v2/auth",
        );
        syntheticUrl.searchParams.set("client_id", clientId);
        syntheticUrl.searchParams.set("scope", scopes.join(" "));
        syntheticUrl.searchParams.set("access_type", "offline");
        syntheticUrl.searchParams.set("response_type", "code");
        const report = buildPreviewFromOAuthUrl(syntheticUrl.toString());
        return {
          ...report,
          input_mode: "takeout_grant",
          summary: {
            ...report.summary,
            incident_framing_note: `Google Takeout OAuth grant export parsed locally for client "${clientId}".`,
          },
        };
      }
    } catch {
      // Fall through to generic key/token scan if not valid Takeout JSON.
    }
  }

  const findings: ShadowSecretFinding[] = [];
  const sourceFile = mode === "takeout_grant" ? "takeout_grants.json" : ".mcp.json / .env";

  const lineRegex =
    /["']?([A-Z0-9_]*(?:TOKEN|KEY|SECRET|PASSWORD|PAT)[A-Z0-9_]*)["']?\s*[:=]\s*["']?([^"'\s,}\]]+)["']?/gi;
  let match: RegExpExecArray | null;
  while ((match = lineRegex.exec(rawPayload)) !== null) {
    const [, keyName, rawVal] = match;
    if (!rawVal || rawVal.startsWith("${")) continue;
    const meta = classifyKey(keyName, rawVal);
    findings.push({
      source_file: sourceFile,
      provider: meta.provider,
      key_name: keyName,
      masked_preview: maskSecret(rawVal),
      grant_type: meta.grant_type,
      rotation_issuer: meta.issuer,
      severity: meta.severity,
      blast_targets: meta.targets,
    });
  }

  const nodes: BlastNode[] = [
    {
      id: "n_dev_host",
      label: `Local Workspace (${sourceFile})`,
      kind: "human_identity",
      provider: "generic",
      severity: "medium",
      risk_score: 35,
      trust_boundary: "developer_local",
      survives_naive_revoke: false,
      notes: "Secrets parsed locally in memory and masked immediately; zero raw values leave client.",
    },
  ];
  const edges: BlastEdge[] = [];
  const boundaries = new Set<TrustBoundary>(["developer_local"]);
  const persistingNodes: string[] = [];
  const persistingEdges: string[] = [];
  const steps: ContainmentStep[] = [];

  findings.forEach((f, idx) => {
    const nodeId = `n_secret_${idx}`;
    const boundary: TrustBoundary =
      f.provider === "github" || f.provider === "vercel"
        ? "ci_cd"
        : f.provider === "salesforce"
          ? "enterprise_tenant"
          : "vendor";
    boundaries.add(boundary);
    nodes.push({
      id: nodeId,
      label: `${f.key_name} (${f.masked_preview})`,
      kind: "secret_credential",
      provider: f.provider,
      severity: f.severity,
      risk_score: severityScore(f.severity),
      trust_boundary: boundary,
      survives_naive_revoke: true,
      notes: `Issued by ${f.rotation_issuer}; survives single-provider password reset or unrelated OAuth revoke.`,
    });
    const edgeId = `e_secret_${idx}`;
    edges.push({
      id: edgeId,
      source: "n_dev_host",
      target: nodeId,
      relation: "exposes_secret",
      mechanism: `${f.grant_type} embedded in ${f.source_file}`,
      hop: 1,
      survives_naive_revoke: true,
    });
    persistingNodes.push(nodeId);
    persistingEdges.push(edgeId);
    steps.push({
      priority: idx + 1,
      issuer: f.rotation_issuer,
      target_resource: `${f.key_name} (${f.masked_preview})`,
      action_type:
        f.provider === "github" ? "github_grant_delete" : "rotate_downstream_key",
      command_or_endpoint: `Revoke & rotate ${f.key_name} at ${f.rotation_issuer}`,
      why_naive_fails: `Issued by ${f.rotation_issuer}; unaffected by revoking a single OAuth app elsewhere.`,
      verification_probe: `Replay old ${f.masked_preview} credential -> confirm 401/403 rejection`,
      console_url:
        f.provider === "github"
          ? "https://github.com/settings/tokens"
          : f.provider === "vercel"
            ? "https://vercel.com/account/tokens"
            : null,
    });
  });

  if (findings.length === 0) {
    steps.push({
      priority: 1,
      issuer: "Local Config Scanner",
      target_resource: sourceFile,
      action_type: "invalidate_sessions",
      command_or_endpoint: "No static tokens matched in pasted payload",
      why_naive_fails: "Paste JSON or .env lines containing GITHUB_TOKEN, VERCEL_TOKEN, OPENAI_API_KEY, etc.",
      verification_probe: "Zero static non-human secrets detected",
      console_url: null,
    });
  }

  return {
    schema_version: "1.0.0",
    input_mode: mode,
    preset_id: null,
    summary: {
      headline:
        findings.length > 0
          ? `${findings.length} unmasked credential(s) detected in ${sourceFile} across ${boundaries.size} trust boundaries`
          : `No embedded static credentials matched in ${sourceFile}`,
      max_risk_score: findings.some((f) => f.severity === "critical")
        ? 95
        : findings.length > 0
          ? 78
          : 15,
      max_hops: findings.length > 0 ? 1 : 0,
      trust_boundary_crossings: Array.from(boundaries),
      exposed_asset_count: findings.length,
      incident_framing_note:
        "Local zero-exfil secret mask scan: raw values masked immediately in browser memory.",
    },
    parsed_oauth: null,
    shadow_secrets: findings,
    graph: { nodes, edges },
    naive_containment: {
      simulation_mode: "naive_single_revoke",
      rfc7009_http_status_returned: 200,
      rfc7009_trap_warning:
        findings.length > 0
          ? "Revoking a single Google/GitHub session leaves all embedded static PATs and API keys across independent issuers active."
          : "No static secrets to persist.",
      jwt_residual_ttl_seconds: findings.length > 0 ? 3600 : 0,
      contained_node_ids: [],
      persisting_node_ids: persistingNodes,
      persisting_edge_ids: persistingEdges,
      containment_ratio: findings.length > 0 ? 0 : 1,
      ordered_steps: steps.slice(0, 1),
    },
    full_containment: {
      simulation_mode: "full_multi_issuer",
      rfc7009_http_status_returned: 200,
      rfc7009_trap_warning:
        "Per-issuer rotation across every detected key eliminates static credential persistence.",
      jwt_residual_ttl_seconds: 0,
      contained_node_ids: persistingNodes,
      persisting_node_ids: [],
      persisting_edge_ids: [],
      containment_ratio: 1,
      ordered_steps: steps,
    },
    pre_consent_guard: {
      action: findings.length > 0 ? "WARN" : "ALLOW",
      provider: findings[0]?.provider ?? "generic",
      risk_score: findings.length > 0 ? 84 : 10,
      pkce_protected: false,
      pkce_rewrite_warning:
        "Static config secrets bypass OAuth consent entirely; move tokens into short-lived OIDC / brokered credentials.",
      flagged_scopes: [],
      recommended_scopes: [],
      safe_replacement_url: null,
    },
    ai_explainer_used: false,
  };
}
