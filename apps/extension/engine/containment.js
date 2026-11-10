// Generated from packages/engine/containment.ts by scripts/build.mjs — do not edit manually.
                                                                                                                                                                    
                                                     

const issuers                                                                                              = {
  google: { name: "Google", console: "https://myaccount.google.com/connections", rotate: "Revoke the affected credential in Google Cloud IAM / service account keys or Google Account connections, according to credential type", probe: "Old credential must fail at its authorized Google resource API; inspect IAM bindings and service-account keys" },
  github: { name: "GitHub", console: "https://github.com/settings/tokens", rotate: "Revoke the affected PAT/deploy key at GitHub and replace with a scoped credential", probe: "GET https://api.github.com/user with the old token must return 401 Bad credentials; verify deploy-key removal separately" },
  microsoft: { name: "Microsoft Entra ID", console: "https://entra.microsoft.com/", rotate: "Delete the affected app secret/certificate and revoke the grant at Microsoft Entra ID", probe: "Old credential cannot mint tokens; existing Graph access tokens must also be rejected or expire" },
  slack: { name: "Slack", console: "https://api.slack.com/apps", rotate: "POST https://slack.com/api/auth.revoke with token=<REDACTED>; revoke each affected bot/user token separately", probe: "auth.test with the old token must return ok:false with token_revoked/invalid_auth; HTTP 200 alone is not success" },
  salesforce: { name: "Salesforce", console: "https://login.salesforce.com/", rotate: "Revoke the affected connected-app token at its Salesforce instance /services/oauth2/revoke", probe: "Old token must fail an authorized Salesforce REST resource request with INVALID_SESSION_ID" },
  vercel: { name: "Vercel", console: "https://vercel.com/account/tokens", rotate: "Revoke the affected Vercel token and issue a scoped replacement; rotate any exported environment credentials at their issuers", probe: "GET https://api.vercel.com/v2/user with the old token must fail with invalidToken/unauthorized" },
  openai: { name: "OpenAI", console: "https://platform.openai.com/api-keys", rotate: "Revoke the affected OpenAI API key and issue a project-scoped replacement", probe: "GET https://api.openai.com/v1/models with the old key must fail authentication (401 invalid_api_key)" },
  anthropic: { name: "Anthropic", console: "https://console.anthropic.com/settings/keys", rotate: "Revoke the affected Anthropic API key and issue a scoped replacement", probe: "An authorized Anthropic API request with the old key must fail with 401 authentication_error" },
  generic: { name: "Discovered downstream issuer", console: null, rotate: "Identify the credential issuer, inventory affected credentials, revoke each exposed credential, and issue scoped replacements", probe: "Use the old credential at its previously authorized resource API; require authentication rejection, not a permission-only 403" },
};

function revokeGrant(provider            , target        )                                    {
  const issuer = issuers[provider];
  const base = { issuer: issuer.name, target_resource: target,
    why_naive_fails: "Revoking one grant cannot remove copied credentials, independently minted apps, sessions or persisted artifacts at other issuers.",
    verification_probe: issuer.probe, console_url: issuer.console };
  if (provider === "google") return { ...base, action_type: "rfc7009_revoke",
    command_or_endpoint: "POST https://oauth2.googleapis.com/revoke (form token=<REDACTED>; use required client authentication)",
    verification_probe: "Verify refresh-token redemption fails, then probe previously authorized Gmail/Drive/Google APIs until old access tokens are rejected or expire" };
  if (provider === "github") return { ...base, action_type: "github_grant_delete",
    command_or_endpoint: 'DELETE https://api.github.com/applications/{client_id}/grant (Basic client_id:client_secret; JSON {"access_token":"<REDACTED>"}; expected 204)',
    console_url: "https://github.com/settings/connections/applications" };
  if (provider === "salesforce") return { ...base, action_type: "rfc7009_revoke", command_or_endpoint: issuer.rotate };
  return { ...base, action_type: "invalidate_sessions", command_or_endpoint: provider === "microsoft" ?
    "Remove the compromised Entra OAuth permission grant; revoke sign-in sessions and disable the affected service principal as needed. No generic RFC 7009 endpoint is assumed." : issuer.rotate };
}

function cleanNode(node           , finding                      )                                    {
  const issuer = issuers[node.provider];
  const base = { issuer: issuer.name, target_resource: node.id,
    why_naive_fails: "This resource has an independent credential or persistence lifecycle; upstream revocation does not clean it up.",
    console_url: issuer.console };
  if (finding?.grant_type === "oauth_token") return revokeGrant(finding.provider, node.id);
  if (node.kind === "secret_credential" || /service_account_key|added_app_secret|slack_bot_token|deploy_key/.test(node.label)) return { ...base, action_type: "rotate_downstream_key",
    command_or_endpoint: issuer.rotate, verification_probe: issuer.probe };
  if (node.trust_boundary === "ci_cd" || /committed_backdoor|deploy_key|release_artifact/.test(node.label)) {
    return { ...base, action_type: "inspect_ci_workflows",
      command_or_endpoint: "Review and restore workflow commits, protected branches, deploy keys and runners; rotate CI secrets and quarantine/rebuild affected release artifacts",
      verification_probe: "Diff workflows and release provenance against trusted revisions; remove unauthorized keys/runners; old CI credentials must fail authentication" };
  }
  if (/app|iam_binding|shared_permission/.test(node.label)) return { ...base, action_type: "audit_minted_apps",
    command_or_endpoint: "Inventory and remove attacker-created applications, client secrets, IAM bindings and injected sharing permissions at this issuer",
    verification_probe: "Compare grants/apps/keys/sharing against the trusted inventory; removed principals and old credentials must fail resource API authentication" };
  return { ...base, action_type: "invalidate_sessions",
    command_or_endpoint: "Revoke independent sessions and remove unauthorized mailbox filters, forwarding rules and alert suppression; verify access-token expiry/rejection",
    verification_probe: "Old sessions/tokens must fail a previously authorized resource API call; forwarding/filter review must show no unauthorized persistence" };
}

export function simulateContainment(graph                  , input                  , mode                )                     {
  if (!["naive_single_revoke", "full_multi_issuer"].includes(mode)) throw new Error("Invalid simulation mode.");
  const full = mode === "full_multi_issuer";
  const grants = full ? input.oauth_grants : input.oauth_grants.slice(0, 1);
  const steps = grants.map((grant, index) => revokeGrant(grant.provider, `grant:${index}:${grant.provider}`));
  if (full) {
    const findings = new Map(input.shadow_secrets.map((finding, index) => [`secret:${index}`, finding]));
    for (const node of graph.nodes) {
      if (node.kind === "secret_credential" || (node.kind === "attacker_persistence" && node.label !== "offline_refresh_token")) steps.push(cleanNode(node, findings.get(node.id)));
    }
    const resourceProviders = new Set(graph.nodes.filter(node => ["data_store", "downstream_platform"].includes(node.kind)).map(node => node.provider));
    for (const provider of [...resourceProviders].sort()) {
      const issuer = issuers[provider];
      steps.push({ issuer: issuer.name, target_resource: `${provider} resource sessions and residual access tokens`,
        action_type: "invalidate_sessions", command_or_endpoint: "Invalidate independent sessions where supported; otherwise wait for measured token expiry and require rejection by every affected resource API",
        why_naive_fails: "Access-token cascading is only SHOULD under RFC 7009; JWTs and downstream sessions may outlive the refresh grant.",
        verification_probe: `${issuer.probe}. Confirm rejection of all old tokens, sessions and newly discovered credentials before declaring containment.`, console_url: issuer.console });
    }
  }
  // The identity is context, not an attack resource, so it is excluded from both sets and the denominator.
  const resources = graph.nodes.filter(node => node.kind !== "human_identity");
  const contained = resources.filter(node => full || !node.survives_naive_revoke);
  const persisting = resources.filter(node => !full && node.survives_naive_revoke);
  const persistingIds = new Set(persisting.map(node => node.id));
  const hasRfcRevoke = steps.some(step => step.action_type === "rfc7009_revoke");
  return {
    simulation_mode: mode, rfc7009_http_status_returned: hasRfcRevoke ? 200 : 0,
    rfc7009_trap_warning: `${hasRfcRevoke ? "Simulated RFC 7009 HTTP 200 OK is not proof of containment: even an invalid token returns 200; access-token cascading is only SHOULD." : "No RFC 7009 response is modeled (status 0 = not applicable); GitHub grant DELETE expects 204 and other issuers use their own revocation controls."} ${full ? "Full containment is a projected outcome ONLY AFTER every listed action, issuer discovery and API rejection probe succeeds, including expiry of residual tokens." : "Naive results assume the first grant was actually revoked; HTTP status alone cannot establish that. Other grants and independent credentials remain live. Residual JWT TTL is illustrative, not measured; actual expiry and CAE/provider policy may differ."} Previously copied data cannot be recovered by revocation.`,
    // shortcut: no token expiry claims are supplied, use an illustrative 3600s (Entra 5400s); replace with measured exp/CAE evidence when available.
    jwt_residual_ttl_seconds: full || !input.oauth_grants.length ? 0 : input.oauth_grants.some(grant => grant.provider === "microsoft") ? 5400 : 3600,
    contained_node_ids: contained.map(node => node.id), persisting_node_ids: [...persistingIds],
    persisting_edge_ids: full ? [] : graph.edges.filter(edge => edge.survives_naive_revoke && persistingIds.has(edge.target)).map(edge => edge.id),
    containment_ratio: resources.length ? contained.length / resources.length : 1,
    ordered_steps: steps.map((step, index) => ({ priority: index + 1, ...step })),
  };
}
