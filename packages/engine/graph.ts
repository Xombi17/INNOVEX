import type { BlastEdge, BlastNode, BlastRadiusGraph, ProviderId, Severity, TrustBoundary } from "../../contracts/index.d.ts";
import { findScope, riskScores, scopeSeverity } from "./catalog.ts";
import type { ParsedAuditInput } from "./parsers.ts";

function nodeId(...parts: string[]): string {
  return parts.map(part => encodeURIComponent(part)).join(":");
}

const credentialTargets = new Set([
  "committed_secrets", "shared_drive_secrets", "exported_env_files", "ci_cd_secrets",
  "prod_deploy_tokens", "gcp_secret_manager", "service_account_keys", "org_secrets",
  "slack_shared_secrets", "exported_customer_secrets", "deploy_keys",
]);

const ciTargets = new Set(["ci_cd_secrets", "prod_deploy_tokens", "release_artifact_poisoning", "org_ci_runners"]);

export function buildBlastGraph(input: ParsedAuditInput): BlastRadiusGraph {
  const nodes = new Map<string, BlastNode>();
  const edges = new Map<string, BlastEdge>();
  const depths = new Map<string, number>();
  const primary = input.oauth_grants[0]?.provider ?? input.shadow_secrets[0]?.provider ?? "generic";
  const addNode = (id: string, label: string, kind: BlastNode["kind"], provider: ProviderId,
    severity: Severity, boundary: TrustBoundary, survives: boolean, notes: string): string => {
    nodes.set(id, { id, label, kind, provider, severity, risk_score: riskScores[severity],
      trust_boundary: boundary, survives_naive_revoke: survives, notes });
    return id;
  };
  const link = (source: string, target: string, relation: BlastEdge["relation"], mechanism: string): void => {
    const hop = (depths.get(source) ?? 0) + 1;
    depths.set(target, hop);
    const id = nodeId("edge", source, target, relation);
    edges.set(id, { id, source, target, relation, mechanism, hop,
      survives_naive_revoke: nodes.get(target)!.survives_naive_revoke });
  };
  const root = addNode("identity", "Account / workstation owner", "human_identity", primary, "low", "personal", false,
    "Entry point for the supplied grants and local configuration; no live account lookup.");
  depths.set(root, 0);

  for (const [index, grant] of input.oauth_grants.entries()) {
    const app = addNode(nodeId("grant", String(index), grant.provider), `${grant.provider} OAuth grant`,
      input.preset_id && ["rohan_mcp_oauth_trap", "context_ai_vercel_2026"].includes(input.preset_id) ? "shadow_ai_tool" : "oauth_app",
      grant.provider, "low", "vendor", index > 0,
      "Models successful revocation of this grant, not an inference from HTTP status alone.");
    link(root, app, "authorizes", "OAuth consent to the supplied client");
    for (const scope of [...grant.requested_scopes].sort()) {
      const entry = findScope(grant.provider, scope);
      const severity = scopeSeverity(grant.provider, scope);
      const scopeNode = addNode(nodeId(app, "scope", scope), scope, "scope", grant.provider, severity, "vendor", index > 0,
        entry?.capabilities.join("; ") ?? "Scope is not in the frozen capability catalog; do not infer unlisted permissions.");
      link(app, scopeNode, "grants_scope", "Requested scope; actual role and resource permissions must also permit access");
      for (const target of entry?.enables_targets ?? []) {
        const boundary: TrustBoundary = ciTargets.has(target) ? "ci_cd" :
          ["microsoft", "slack"].includes(grant.provider) || entry?.category === "cloud_admin" ? "enterprise_tenant" : "personal";
        const targetNode = addNode(nodeId(scopeNode, "target", target), target, "data_store", grant.provider, severity, boundary, true,
          "Potential resource access, not evidence of exploitation. An existing access token may outlive grant revocation until expiry/rejection.");
        link(scopeNode, targetNode, "crosses_boundary", "Conditional catalog capability; a valid residual access token may retain access");
        if (credentialTargets.has(target)) {
          const key = addNode(nodeId(targetNode, "copied_credential"), "Potential copied credential", "secret_credential",
            target === "service_account_keys" ? "google" : "generic", severity, boundary, true,
            "Conditional: only if this resource actually contains a usable credential. Identify its issuer and permissions before rotation.");
          link(targetNode, key, "exposes_secret", "A copied or minted credential has an independent lifecycle");
          const downstream = addNode(nodeId(key, "platform"), "Potential downstream API access", "downstream_platform",
            target === "service_account_keys" ? "google" : "generic", severity,
            "enterprise_tenant", true, "Conditional on the copied credential's actual issuer, validity and permissions.");
          link(key, downstream, "crosses_boundary", "Use an independently issued credential at its own resource server");
        }
        if (["password_reset_otps", "downstream_saas_takeover"].includes(target)) {
          const session = addNode(nodeId(targetNode, "session"), "Potential downstream session", "downstream_platform", "generic",
            severity, "vendor", true, "Conditional on a usable reset link/OTP and the downstream service's additional authentication controls.");
          link(targetNode, session, "persists_after_revoke", "A session minted at another issuer is not revoked with the original OAuth grant");
        }
      }
      for (const vector of entry?.persistence_vectors ?? []) {
        if (vector === "offline_refresh_token" && grant.access_type !== "offline" && !grant.requested_scopes.includes("offline_access")) continue;
        const refresh = vector === "offline_refresh_token";
        const persistence = addNode(nodeId(scopeNode, "persistence", vector), vector, "attacker_persistence", grant.provider, severity,
          /workflow|release|runner|backdoor/.test(vector) && grant.provider === "github" ? "ci_cd" : "enterprise_tenant", !refresh || index > 0,
          refresh ? "The explicitly requested refresh grant is the naive revocation target." :
            "Conditional attacker-created artifact: requires successful exploitation and independent cleanup; revocation alone does not remove it.");
        link(scopeNode, persistence, "persists_after_revoke", entry!.rfc7009_notes);
      }
    }
  }

  if (input.shadow_secrets.length) {
    const config = addNode("local_config", "Local / exported integration configuration", "mcp_server", "generic", "high", "developer_local", true,
      "Pasted configuration contains credentials. OAuth consent alone does not prove access to this local file.");
    link(root, config, "crosses_boundary", "Independent local/configuration exposure surface");
    for (const [index, finding] of input.shadow_secrets.entries()) {
      const secret = addNode(nodeId("secret", String(index)), finding.key_name, "secret_credential", finding.provider,
        finding.severity, "developer_local", true,
        `${finding.grant_type}; rotate at ${finding.rotation_issuer}. Effective permissions are unknown from the secret value.`);
      link(config, secret, "exposes_secret", "Credential found in supplied configuration; value redacted before graph construction");
      for (const target of finding.blast_targets) {
        const resource = addNode(nodeId(secret, "resource", target), target, "downstream_platform", finding.provider,
          finding.severity, ciTargets.has(target) ? "ci_cd" : "vendor", true,
          "Potential access only; inspect the credential's actual scope, role and resource restrictions.");
        link(secret, resource, "crosses_boundary", "Independent credential issuer; unrelated OAuth revocation has no effect");
        if (credentialTargets.has(target)) {
          const copied = addNode(nodeId(resource, "secondary_secret"), "Potential secondary credential", "secret_credential", "generic",
            finding.severity, "enterprise_tenant", true, "Conditional fan-out if exported data contains another valid credential; issuer discovery required.");
          link(resource, copied, "exposes_secret", "Secrets in exported source/configuration require separate issuer rotation");
        }
      }
    }
  }
  return { nodes: [...nodes.values()].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    edges: [...edges.values()].sort((a, b) => a.hop - b.hop || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) };
}
