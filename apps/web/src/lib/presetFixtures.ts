import type { AuditReport } from "@contracts/index";

/**
 * Temporary Phase 1 fixture-backed reports for the 4 additional grounded presets
 * in `data/scope_catalog.json` (while `rohan_mcp_oauth_trap` uses
 * `contracts/sample_report.fixture.json` directly).
 *
 * Replaced automatically when `auditAdapter.ts` switches to Codex's live engine.
 */
export const PHASE1_PRESET_REPORTS: Record<string, AuditReport> = {
  midnight_blizzard_2024: {
    schema_version: "1.0.0",
    input_mode: "incident_preset",
    preset_id: "midnight_blizzard_2024",
    summary: {
      headline:
        "3-hop Entra ID governance failure: legacy test-tenant OAuth app mints independent Exchange access",
      max_risk_score: 94,
      max_hops: 3,
      trust_boundary_crossings: ["personal", "vendor", "enterprise_tenant"],
      exposed_asset_count: 5,
      incident_framing_note:
        "OAuth App & Permission Governance Failure (Not Shadow AI): password spray on an unprotected test-tenant account abused a legacy OAuth app with Application.ReadWrite.All to mint new apps.",
    },
    parsed_oauth: {
      provider: "microsoft",
      client_id: "legacy-test-oauth-app-001",
      redirect_uri: "https://legacy-test.example.internal/auth",
      requested_scopes: [
        "Application.ReadWrite.All",
        "Mail.ReadWrite",
        "offline_access",
      ],
      response_type: "code",
      access_type: "offline",
      has_pkce: false,
      code_challenge_method: null,
      state_present: false,
    },
    shadow_secrets: [],
    graph: {
      nodes: [
        {
          id: "n_test_acct",
          label: "Unprotected Test-Tenant Account (Password Spray)",
          kind: "human_identity",
          provider: "microsoft",
          severity: "high",
          risk_score: 72,
          trust_boundary: "personal",
          survives_naive_revoke: false,
          notes:
            "Non-MFA legacy test account compromised via password spray.",
        },
        {
          id: "n_legacy_app",
          label: "Legacy OAuth App (Application.ReadWrite.All)",
          kind: "oauth_app",
          provider: "microsoft",
          severity: "critical",
          risk_score: 90,
          trust_boundary: "vendor",
          survives_naive_revoke: false,
          notes:
            "Over-privileged legacy app in test tenant; revoking its user session alone leaves minted apps active.",
        },
        {
          id: "n_minted_apps",
          label: "Attacker-Minted Entra OAuth Apps & Client Secrets",
          kind: "attacker_persistence",
          provider: "microsoft",
          severity: "critical",
          risk_score: 94,
          trust_boundary: "enterprise_tenant",
          survives_naive_revoke: true,
          notes:
            "Created via Application.ReadWrite.All; holds independent client_id + secret unaffected by resetting the initial user or legacy app.",
        },
        {
          id: "n_corp_exchange",
          label: "Corporate Exchange Online / EWS Executive Mailboxes",
          kind: "data_store",
          provider: "microsoft",
          severity: "critical",
          risk_score: 94,
          trust_boundary: "enterprise_tenant",
          survives_naive_revoke: true,
          notes:
            "Accessed via Mail.ReadWrite / full_access_as_app on the attacker-created OAuth applications.",
        },
      ],
      edges: [
        {
          id: "e_mb_1",
          source: "n_test_acct",
          target: "n_legacy_app",
          relation: "authorizes",
          mechanism: "Password spray -> legacy tenant OAuth privilege reuse",
          hop: 1,
          survives_naive_revoke: false,
        },
        {
          id: "e_mb_2",
          source: "n_legacy_app",
          target: "n_minted_apps",
          relation: "crosses_boundary",
          mechanism:
            "Application.ReadWrite.All creates rogue Entra apps + secrets",
          hop: 2,
          survives_naive_revoke: true,
        },
        {
          id: "e_mb_3",
          source: "n_minted_apps",
          target: "n_corp_exchange",
          relation: "persists_after_revoke",
          mechanism:
            "Minted app authenticates directly to Exchange Online / Graph",
          hop: 3,
          survives_naive_revoke: true,
        },
      ],
    },
    naive_containment: {
      simulation_mode: "naive_single_revoke",
      rfc7009_http_status_returned: 200,
      rfc7009_trap_warning:
        "Resetting the test-tenant password or revoking the single legacy app session leaves Entra ID access JWTs active for ~60-90m (absent CAE) and never deletes attacker-minted OAuth applications.",
      jwt_residual_ttl_seconds: 5400,
      contained_node_ids: ["n_test_acct", "n_legacy_app"],
      persisting_node_ids: ["n_minted_apps", "n_corp_exchange"],
      persisting_edge_ids: ["e_mb_2", "e_mb_3"],
      containment_ratio: 0.5,
      ordered_steps: [
        {
          priority: 1,
          issuer: "Microsoft Entra ID",
          target_resource: "test-tenant account session",
          action_type: "invalidate_sessions",
          command_or_endpoint:
            "POST https://graph.microsoft.com/v1.0/users/{id}/revokeSignInSessions",
          why_naive_fails:
            "Does not delete secondary Entra applications or client secrets created before session invalidation.",
          verification_probe:
            "Check Graph auditLogs/directoryAudits for Add application / Add service principal events",
          console_url: "https://entra.microsoft.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps",
        },
      ],
    },
    full_containment: {
      simulation_mode: "full_multi_issuer",
      rfc7009_http_status_returned: 200,
      rfc7009_trap_warning:
        "Full containment audits and deletes attacker-minted Entra applications, rotates added client secrets, and verifies Exchange RBAC app access policies.",
      jwt_residual_ttl_seconds: 0,
      contained_node_ids: [
        "n_test_acct",
        "n_legacy_app",
        "n_minted_apps",
        "n_corp_exchange",
      ],
      persisting_node_ids: [],
      persisting_edge_ids: [],
      containment_ratio: 1.0,
      ordered_steps: [
        {
          priority: 1,
          issuer: "Microsoft Entra ID",
          target_resource: "Attacker-minted OAuth apps & credentials",
          action_type: "audit_minted_apps",
          command_or_endpoint:
            "DELETE https://graph.microsoft.com/v1.0/applications/{rogue_app_id}",
          why_naive_fails:
            "Minted OAuth apps hold independent client_credentials grants.",
          verification_probe:
            "POST /oauth2/v2.0/token with rogue client_id returns AADSTS700016 invalid_client",
          console_url: "https://entra.microsoft.com/#view/Microsoft_AAD_IAM/StartboardApplicationsMenuBlade/~/AppAppsPreview",
        },
        {
          priority: 2,
          issuer: "Microsoft Entra ID",
          target_resource: "legacy-test-oauth-app-001 + test account",
          action_type: "invalidate_sessions",
          command_or_endpoint:
            "POST https://graph.microsoft.com/v1.0/users/{id}/revokeSignInSessions + disable test tenant app",
          why_naive_fails:
            "Legacy test-tenant apps often bypass production Conditional Access and CAE.",
          verification_probe:
            "Verify Conditional Access enforces MFA + CAE across test tenants",
          console_url: "https://entra.microsoft.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/SignIns",
        },
        {
          priority: 3,
          issuer: "Exchange Online",
          target_resource: "Corporate mailboxes & EWS access",
          action_type: "inspect_ci_workflows",
          command_or_endpoint:
            "New-ServicePrincipal + New-ManagementScope (Exchange RBAC for Applications)",
          why_naive_fails:
            "Tenant-wide Mail.ReadWrite / full_access_as_app grants reach executive mailboxes.",
          verification_probe:
            "Get-MailboxFolderPermission & EWS audit logs confirm 401/403 for removed appId",
          console_url: "https://admin.exchange.microsoft.com/",
        },
      ],
    },
    pre_consent_guard: {
      action: "BLOCK_PRE_CONSENT",
      provider: "microsoft",
      risk_score: 94,
      pkce_protected: false,
      pkce_rewrite_warning:
        "No PKCE code_challenge or state parameter detected! Legacy non-PKCE request asks for tenant app-creation privileges (Application.ReadWrite.All) + Mail.ReadWrite.",
      flagged_scopes: [
        {
          scope_id: "Application.ReadWrite.All",
          severity: "critical",
          reason:
            "Allows creating attacker-controlled Entra OAuth apps and self-escalating Graph/Exchange permissions",
          recommended_scope_id: "User.Read",
        },
        {
          scope_id: "Mail.ReadWrite",
          severity: "critical",
          reason: "Grants full corporate mailbox read/write and forwarding rule creation",
          recommended_scope_id: "Mail.Read",
        },
      ],
      recommended_scopes: ["User.Read", "Mail.Read"],
      safe_replacement_url:
        "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=legacy-test-oauth-app-001&response_type=code&redirect_uri=https%3A%2F%2Flegacy-test.example.internal%2Fauth&scope=User.Read+Mail.Read",
    },
    ai_explainer_used: false,
  },

  salesloft_drift_2025: {
    schema_version: "1.0.0",
    input_mode: "incident_preset",
    preset_id: "salesloft_drift_2025",
    summary: {
      headline:
        "4-hop vendor supply-chain fan-out: Drift AWS/OAuth compromise reaches Google Workspace, Salesforce & exported secrets",
      max_risk_score: 95,
      max_hops: 4,
      trust_boundary_crossings: ["vendor", "personal", "enterprise_tenant"],
      exposed_asset_count: 7,
      incident_framing_note:
        "Vendor / Supply-Chain OAuth Compromise (Multi-Path Fan-Out): Drift vendor infrastructure compromise exposed Salesforce & Google Workspace OAuth tokens, leaking secondary keys from support case bodies.",
    },
    parsed_oauth: {
      provider: "google",
      client_id: "vendor-drift-email-sync.apps.googleusercontent.com",
      redirect_uri: "https://drift-sync.example.com/cb",
      requested_scopes: ["https://www.googleapis.com/auth/gmail.modify"],
      response_type: "code",
      access_type: "offline",
      has_pkce: false,
      code_challenge_method: null,
      state_present: false,
    },
    shadow_secrets: [
      {
        source_file: "vendorSync.json",
        provider: "salesforce",
        key_name: "SALESFORCE_REFRESH_TOKEN",
        masked_preview: "5Aep****oken",
        grant_type: "oauth_token",
        rotation_issuer: "Salesforce",
        severity: "critical",
        blast_targets: [
          "crm_customer_cases",
          "exported_support_attachments",
          "secondary_api_tokens",
        ],
      },
      {
        source_file: "vendorSync.json",
        provider: "generic",
        key_name: "SUPPORT_API_TOKEN",
        masked_preview: "tok_****_771",
        grant_type: "api_key",
        rotation_issuer: "Downstream Customer SaaS",
        severity: "high",
        blast_targets: ["customer_support_webhooks", "downstream_saas_tenants"],
      },
    ],
    graph: {
      nodes: [
        {
          id: "n_drift_vendor",
          label: "Compromised Vendor Sync (Drift AWS / GitHub)",
          kind: "oauth_app",
          provider: "generic",
          severity: "critical",
          risk_score: 90,
          trust_boundary: "vendor",
          survives_naive_revoke: false,
          notes:
            "Third-party vendor token store breached via vendor GitHub -> AWS pivot.",
        },
        {
          id: "n_drift_google",
          label: "Google Workspace OAuth (gmail.modify)",
          kind: "data_store",
          provider: "google",
          severity: "critical",
          risk_score: 88,
          trust_boundary: "personal",
          survives_naive_revoke: false,
          notes:
            "Revoking at oauth2.googleapis.com/revoke stops future Google refresh grants, but leaves Salesforce and exported keys untouched.",
        },
        {
          id: "n_drift_sf",
          label: "Salesforce OAuth Refresh Token (CRM Case Bodies)",
          kind: "secret_credential",
          provider: "salesforce",
          severity: "critical",
          risk_score: 95,
          trust_boundary: "enterprise_tenant",
          survives_naive_revoke: true,
          notes:
            "Separate OAuth issuer (login.salesforce.com); Google RFC 7009 revoke has zero effect.",
        },
        {
          id: "n_drift_keys",
          label: "Secondary Customer API Keys in Exported Cases",
          kind: "attacker_persistence",
          provider: "generic",
          severity: "critical",
          risk_score: 95,
          trust_boundary: "enterprise_tenant",
          survives_naive_revoke: true,
          notes:
            "Customer-pasted tokens harvested from support case text require 100+ downstream rotations.",
        },
      ],
      edges: [
        {
          id: "e_sd_1",
          source: "n_drift_vendor",
          target: "n_drift_google",
          relation: "grants_scope",
          mechanism: "Exfiltrated Google Workspace offline refresh token",
          hop: 1,
          survives_naive_revoke: false,
        },
        {
          id: "e_sd_2",
          source: "n_drift_vendor",
          target: "n_drift_sf",
          relation: "crosses_boundary",
          mechanism: "Exfiltrated Salesforce OAuth refresh grant (separate issuer)",
          hop: 2,
          survives_naive_revoke: true,
        },
        {
          id: "e_sd_3",
          source: "n_drift_sf",
          target: "n_drift_keys",
          relation: "exposes_secret",
          mechanism: "Bulk SOQL export of customer case bodies containing pasted keys",
          hop: 3,
          survives_naive_revoke: true,
        },
        {
          id: "e_sd_4",
          source: "n_drift_google",
          target: "n_drift_keys",
          relation: "persists_after_revoke",
          mechanism: "Already-exfiltrated email threads contain static secrets",
          hop: 4,
          survives_naive_revoke: true,
        },
      ],
    },
    naive_containment: {
      simulation_mode: "naive_single_revoke",
      rfc7009_http_status_returned: 200,
      rfc7009_trap_warning:
        "Revoking only the Google OAuth app returns HTTP 200 OK from Google, but Salesforce Connected App OAuth tokens and secrets already harvested from CRM case exports remain live across downstream issuers.",
      jwt_residual_ttl_seconds: 3600,
      contained_node_ids: ["n_drift_vendor", "n_drift_google"],
      persisting_node_ids: ["n_drift_sf", "n_drift_keys"],
      persisting_edge_ids: ["e_sd_2", "e_sd_3", "e_sd_4"],
      containment_ratio: 0.5,
      ordered_steps: [
        {
          priority: 1,
          issuer: "Google",
          target_resource: "vendor-drift-email-sync.apps.googleusercontent.com",
          action_type: "rfc7009_revoke",
          command_or_endpoint: "POST https://oauth2.googleapis.com/revoke",
          why_naive_fails:
            "Does not touch Salesforce OAuth Connected App grants or customer tokens parsed from exported support tickets.",
          verification_probe:
            "Verify Workspace OAuth Token Audit log shows revoke event + 401 on Gmail probe",
          console_url: "https://admin.google.com/ac/owl/list",
        },
      ],
    },
    full_containment: {
      simulation_mode: "full_multi_issuer",
      rfc7009_http_status_returned: 200,
      rfc7009_trap_warning:
        "Full vendor fan-out containment revokes across Google Workspace, Salesforce Connected Apps, and rotates all secondary tokens detected in exported case text.",
      jwt_residual_ttl_seconds: 0,
      contained_node_ids: [
        "n_drift_vendor",
        "n_drift_google",
        "n_drift_sf",
        "n_drift_keys",
      ],
      persisting_node_ids: [],
      persisting_edge_ids: [],
      containment_ratio: 1.0,
      ordered_steps: [
        {
          priority: 1,
          issuer: "Salesforce",
          target_resource: "SALESFORCE_REFRESH_TOKEN + Drift Connected App",
          action_type: "rfc7009_revoke",
          command_or_endpoint:
            "POST https://login.salesforce.com/services/oauth2/revoke (token=<redacted>)",
          why_naive_fails:
            "Salesforce OAuth runs on an independent issuer from Google Workspace.",
          verification_probe:
            "Verify /services/data/v60.0/query returns 401 INVALID_SESSION_ID",
          console_url: "https://help.salesforce.com/s/articleView?id=sf.remoteaccess_revoke_token.htm",
        },
        {
          priority: 2,
          issuer: "Google",
          target_resource: "vendor-drift-email-sync Google grant",
          action_type: "rfc7009_revoke",
          command_or_endpoint: "POST https://oauth2.googleapis.com/revoke",
          why_naive_fails:
            "Must remove app from Workspace API Controls in addition to token revoke.",
          verification_probe:
            "Block client_id in Workspace API Controls -> confirm invalid_grant",
          console_url: "https://admin.google.com/ac/owl/list",
        },
        {
          priority: 3,
          issuer: "Downstream SaaS Issuers",
          target_resource: "SUPPORT_API_TOKEN & case-body secrets",
          action_type: "rotate_downstream_key",
          command_or_endpoint:
            "Scan exported case bodies + rotate every detected API key/webhook secret",
          why_naive_fails:
            "Static secrets extracted from CRM cases survive OAuth revocation permanently.",
          verification_probe:
            "Replay check on rotated downstream keys returns 401/403",
          console_url: null,
        },
      ],
    },
    pre_consent_guard: {
      action: "BLOCK_PRE_CONSENT",
      provider: "google",
      risk_score: 90,
      pkce_protected: false,
      pkce_rewrite_warning:
        "Third-party vendor connector requests offline gmail.modify without PKCE. Downgrade to gmail.readonly or restrict via Workspace API Controls.",
      flagged_scopes: [
        {
          scope_id: "https://www.googleapis.com/auth/gmail.modify",
          severity: "critical",
          reason:
            "Read/write/delete mailbox access exceeds one-way email sync logging requirements",
          recommended_scope_id: "https://www.googleapis.com/auth/gmail.readonly",
        },
      ],
      recommended_scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
      safe_replacement_url:
        "https://accounts.google.com/o/oauth2/v2/auth?client_id=vendor-drift-email-sync.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fdrift-sync.example.com%2Fcb&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.readonly&access_type=offline&response_type=code",
    },
    ai_explainer_used: false,
  },

  context_ai_vercel_2026: {
    schema_version: "1.0.0",
    input_mode: "incident_preset",
    preset_id: "context_ai_vercel_2026",
    summary: {
      headline:
        "3-hop shadow-integration pivot: Google Workspace AI OAuth exposes Drive secrets -> Vercel env vars",
      max_risk_score: 89,
      max_hops: 3,
      trust_boundary_crossings: ["personal", "vendor", "ci_cd"],
      exposed_asset_count: 4,
      incident_framing_note:
        "Third-Party Shadow-Integration Risk via Google Workspace OAuth: compromised third-party AI tool with broad Drive/Workspace access pivots into employee Vercel account and reads environment variables.",
    },
    parsed_oauth: {
      provider: "google",
      client_id: "contextai-workspace.apps.googleusercontent.com",
      redirect_uri: "https://app.contextai.example.com/oauth",
      requested_scopes: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/drive",
      ],
      response_type: "code",
      access_type: "offline",
      has_pkce: false,
      code_challenge_method: null,
      state_present: false,
    },
    shadow_secrets: [
      {
        source_file: "cloudPivot.json",
        provider: "vercel",
        key_name: "VERCEL_TOKEN",
        masked_preview: "vcp_****4410",
        grant_type: "api_key",
        rotation_issuer: "Vercel",
        severity: "critical",
        blast_targets: ["vercel_project_env_vars", "preview_deployments"],
      },
    ],
    graph: {
      nodes: [
        {
          id: "n_emp_ws",
          label: "Employee Google Workspace Account",
          kind: "human_identity",
          provider: "google",
          severity: "medium",
          risk_score: 35,
          trust_boundary: "personal",
          survives_naive_revoke: false,
          notes: "Employee authorized third-party AI Workspace integration.",
        },
        {
          id: "n_context_ai",
          label: "Third-Party AI Integration (drive + gmail.readonly)",
          kind: "shadow_ai_tool",
          provider: "google",
          severity: "high",
          risk_score: 80,
          trust_boundary: "vendor",
          survives_naive_revoke: false,
          notes:
            "Compromised third-party AI backend abused full Drive scope to search exported config docs.",
        },
        {
          id: "n_drive_exports",
          label: "Shared Drive Docs & Exported .env / Token Notes",
          kind: "data_store",
          provider: "google",
          severity: "critical",
          risk_score: 86,
          trust_boundary: "personal",
          survives_naive_revoke: true,
          notes:
            "Any token strings already indexed/copied from Drive remain exposed after Google revoke.",
        },
        {
          id: "n_vercel_env",
          label: "Vercel Account & Project Environment Variables",
          kind: "downstream_platform",
          provider: "vercel",
          severity: "critical",
          risk_score: 89,
          trust_boundary: "ci_cd",
          survives_naive_revoke: true,
          notes:
            "Separate issuer (Vercel): Google RFC 7009 revoke does not revoke Vercel tokens or rotate exposed env vars.",
        },
      ],
      edges: [
        {
          id: "e_cv_1",
          source: "n_emp_ws",
          target: "n_context_ai",
          relation: "authorizes",
          mechanism: "Workspace OAuth consent (drive + gmail.readonly)",
          hop: 1,
          survives_naive_revoke: false,
        },
        {
          id: "e_cv_2",
          source: "n_context_ai",
          target: "n_drive_exports",
          relation: "grants_scope",
          mechanism: "Full drive scope enumerates shared docs & token backups",
          hop: 2,
          survives_naive_revoke: true,
        },
        {
          id: "e_cv_3",
          source: "n_drive_exports",
          target: "n_vercel_env",
          relation: "crosses_boundary",
          mechanism: "Pivots via VERCEL_TOKEN / Workspace SSO into Vercel env vars",
          hop: 3,
          survives_naive_revoke: true,
        },
      ],
    },
    naive_containment: {
      simulation_mode: "naive_single_revoke",
      rfc7009_http_status_returned: 200,
      rfc7009_trap_warning:
        "Google POST /revoke returns HTTP 200 OK, halting new Google Drive API calls once access token TTL expires, but does not revoke Vercel sessions/tokens or rotate read environment variables.",
      jwt_residual_ttl_seconds: 3600,
      contained_node_ids: ["n_emp_ws", "n_context_ai"],
      persisting_node_ids: ["n_drive_exports", "n_vercel_env"],
      persisting_edge_ids: ["e_cv_2", "e_cv_3"],
      containment_ratio: 0.5,
      ordered_steps: [
        {
          priority: 1,
          issuer: "Google",
          target_resource: "contextai-workspace.apps.googleusercontent.com",
          action_type: "rfc7009_revoke",
          command_or_endpoint: "POST https://oauth2.googleapis.com/revoke",
          why_naive_fails:
            "Leaves downstream Vercel access tokens and copied environment variables unrotated.",
          verification_probe:
            "Confirm Drive API call returns 401 invalid_token",
          console_url: "https://myaccount.google.com/permissions",
        },
      ],
    },
    full_containment: {
      simulation_mode: "full_multi_issuer",
      rfc7009_http_status_returned: 200,
      rfc7009_trap_warning:
        "Full containment revokes the Google Workspace integration, revokes Vercel tokens/sessions, and rotates non-sensitive/sensitive env vars pulled during exposure.",
      jwt_residual_ttl_seconds: 0,
      contained_node_ids: [
        "n_emp_ws",
        "n_context_ai",
        "n_drive_exports",
        "n_vercel_env",
      ],
      persisting_node_ids: [],
      persisting_edge_ids: [],
      containment_ratio: 1.0,
      ordered_steps: [
        {
          priority: 1,
          issuer: "Google",
          target_resource: "contextai-workspace OAuth grant",
          action_type: "rfc7009_revoke",
          command_or_endpoint: "POST https://oauth2.googleapis.com/revoke",
          why_naive_fails:
            "Only terminates Google refresh grant; Drive audit required to see accessed files.",
          verification_probe:
            "Audit Google Drive log for exported files + confirm 401 on refresh",
          console_url: "https://myaccount.google.com/permissions",
        },
        {
          priority: 2,
          issuer: "Vercel",
          target_resource: "VERCEL_TOKEN + active Vercel sessions",
          action_type: "rotate_downstream_key",
          command_or_endpoint:
            "DELETE https://api.vercel.com/v3/user/tokens/{tokenId} + rotate project env vars",
          why_naive_fails:
            "Vercel tokens and project environment variables live on a separate issuer.",
          verification_probe:
            "GET https://api.vercel.com/v2/user with old token returns 403 invalidToken",
          console_url: "https://vercel.com/account/tokens",
        },
      ],
    },
    pre_consent_guard: {
      action: "BLOCK_PRE_CONSENT",
      provider: "google",
      risk_score: 86,
      pkce_protected: false,
      pkce_rewrite_warning:
        "Third-party AI tool requests full Google Drive access (`drive`) instead of per-file `drive.file`. Downgrade before user consent.",
      flagged_scopes: [
        {
          scope_id: "https://www.googleapis.com/auth/drive",
          severity: "critical",
          reason:
            "Exposes every Drive file and shared folder rather than only explicitly selected files",
          recommended_scope_id: "https://www.googleapis.com/auth/drive.file",
        },
      ],
      recommended_scopes: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/drive.file",
      ],
      safe_replacement_url:
        "https://accounts.google.com/o/oauth2/v2/auth?client_id=contextai-workspace.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fapp.contextai.example.com%2Foauth&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.file&access_type=offline&response_type=code",
    },
    ai_explainer_used: false,
  },

  litellm_ci_2026: {
    schema_version: "1.0.0",
    input_mode: "incident_preset",
    preset_id: "litellm_ci_2026",
    summary: {
      headline:
        "4-hop CI supply-chain hijack: deleted-but-unrevoked admin key + GitHub CLI OAuth poisons package release",
      max_risk_score: 98,
      max_hops: 4,
      trust_boundary_crossings: ["developer_local", "ci_cd", "vendor"],
      exposed_asset_count: 6,
      incident_framing_note:
        "Non-Human Key Hygiene Failure + Maintainer OAuth Compromise: an admin key removed from git history but never revoked plus exposed GitHub CLI OAuth (repo + workflow) enabled CI workflow hijacking.",
    },
    parsed_oauth: {
      provider: "github",
      client_id: "178c6fc778ccc68e1d6a",
      redirect_uri: "http://127.0.0.1:0/callback",
      requested_scopes: ["repo", "workflow", "read:org"],
      response_type: null,
      access_type: null,
      has_pkce: false,
      code_challenge_method: null,
      state_present: false,
    },
    shadow_secrets: [
      {
        source_file: "ciLeak.json",
        provider: "generic",
        key_name: "LITELLM_ADMIN_KEY",
        masked_preview: "sk-l****oked",
        grant_type: "api_key",
        rotation_issuer: "LiteLLM Proxy / Cloud",
        severity: "critical",
        blast_targets: ["llm_proxy_admin", "upstream_provider_keys"],
      },
      {
        source_file: "ciLeak.json",
        provider: "github",
        key_name: "GITHUB_TOKEN",
        masked_preview: "gho_****_552",
        grant_type: "oauth_token",
        rotation_issuer: "GitHub",
        severity: "critical",
        blast_targets: [
          "private_source_code",
          "github_actions_workflows",
          "pypi_npm_release_pipeline",
        ],
      },
    ],
    graph: {
      nodes: [
        {
          id: "n_git_history",
          label: "Unrevoked LITELLM_ADMIN_KEY (Removed From Git Only)",
          kind: "secret_credential",
          provider: "generic",
          severity: "critical",
          risk_score: 90,
          trust_boundary: "developer_local",
          survives_naive_revoke: true,
          notes:
            "Deleting a key from git history without calling issuer revocation leaves the key 100% live.",
        },
        {
          id: "n_gh_cli_oauth",
          label: "Maintainer GitHub CLI OAuth (repo + workflow)",
          kind: "oauth_app",
          provider: "github",
          severity: "critical",
          risk_score: 95,
          trust_boundary: "developer_local",
          survives_naive_revoke: false,
          notes:
            "GitHub revokes via DELETE /applications/{client_id}/grant (204), not standard RFC 7009 form POST.",
        },
        {
          id: "n_ci_workflows",
          label: "Modified .github/workflows/*.yml (CI Secret Theft)",
          kind: "attacker_persistence",
          provider: "github",
          severity: "critical",
          risk_score: 98,
          trust_boundary: "ci_cd",
          survives_naive_revoke: true,
          notes:
            "Committed workflow changes & exfiltrated Actions secrets persist after token deletion.",
        },
        {
          id: "n_pkg_release",
          label: "Poisoned PyPI / npm Package Release Artifact",
          kind: "downstream_platform",
          provider: "generic",
          severity: "critical",
          risk_score: 98,
          trust_boundary: "vendor",
          survives_naive_revoke: true,
          notes:
            "Published package artifacts & PyPI/npm publish tokens remain compromised until yanked and rotated.",
        },
      ],
      edges: [
        {
          id: "e_ll_1",
          source: "n_git_history",
          target: "n_gh_cli_oauth",
          relation: "exposes_secret",
          mechanism: "Credential hygiene breach pivots to maintainer workstation",
          hop: 1,
          survives_naive_revoke: true,
        },
        {
          id: "e_ll_2",
          source: "n_gh_cli_oauth",
          target: "n_ci_workflows",
          relation: "crosses_boundary",
          mechanism: "repo + workflow scopes rewrite CI release YAML",
          hop: 2,
          survives_naive_revoke: false,
        },
        {
          id: "e_ll_3",
          source: "n_ci_workflows",
          target: "n_pkg_release",
          relation: "persists_after_revoke",
          mechanism: "CI pipeline injects payload into release artifact",
          hop: 3,
          survives_naive_revoke: true,
        },
      ],
    },
    naive_containment: {
      simulation_mode: "naive_single_revoke",
      rfc7009_http_status_returned: 200,
      rfc7009_trap_warning:
        "GitHub does not use standard RFC 7009 form POST; even after deleting the OAuth grant, unrevoked LITELLM_ADMIN_KEY, modified .github/workflows/*.yml commits, and poisoned release artifacts survive.",
      jwt_residual_ttl_seconds: 0,
      contained_node_ids: ["n_gh_cli_oauth"],
      persisting_node_ids: ["n_git_history", "n_ci_workflows", "n_pkg_release"],
      persisting_edge_ids: ["e_ll_1", "e_ll_3"],
      containment_ratio: 0.25,
      ordered_steps: [
        {
          priority: 1,
          issuer: "GitHub",
          target_resource: "GitHub CLI OAuth grant (178c6fc778ccc68e1d6a)",
          action_type: "github_grant_delete",
          command_or_endpoint:
            "DELETE https://api.github.com/applications/178c6fc778ccc68e1d6a/grant (204 No Content)",
          why_naive_fails:
            "Does not revoke LITELLM_ADMIN_KEY, revert malicious workflow YAML commits, or yank poisoned packages.",
          verification_probe: "GET https://api.github.com/user returns 401 Bad credentials",
          console_url: "https://github.com/settings/connections/applications",
        },
      ],
    },
    full_containment: {
      simulation_mode: "full_multi_issuer",
      rfc7009_http_status_returned: 204,
      rfc7009_trap_warning:
        "Full containment deletes the GitHub OAuth grant (HTTP 204), rotates unrevoked admin/PyPI/npm keys, and audits/reverts CI workflow tampering.",
      jwt_residual_ttl_seconds: 0,
      contained_node_ids: [
        "n_git_history",
        "n_gh_cli_oauth",
        "n_ci_workflows",
        "n_pkg_release",
      ],
      persisting_node_ids: [],
      persisting_edge_ids: [],
      containment_ratio: 1.0,
      ordered_steps: [
        {
          priority: 1,
          issuer: "GitHub",
          target_resource: "GitHub CLI OAuth grant (178c6fc778ccc68e1d6a)",
          action_type: "github_grant_delete",
          command_or_endpoint:
            "DELETE https://api.github.com/applications/178c6fc778ccc68e1d6a/grant",
          why_naive_fails:
            "Classic repo + workflow scopes persist via deploy keys & committed YAML.",
          verification_probe:
            "GET https://api.github.com/user with gho_ token returns 401 Bad credentials",
          console_url: "https://github.com/settings/connections/applications",
        },
        {
          priority: 2,
          issuer: "GitHub Actions CI",
          target_resource: ".github/workflows/*.yml & CI secrets",
          action_type: "inspect_ci_workflows",
          command_or_endpoint:
            "git log -p -- .github/workflows/ + rotate Actions secrets & deploy keys",
          why_naive_fails:
            "Workflow commits remain active in repo branches after token revocation.",
          verification_probe:
            "Diff HEAD vs clean tag + verify rotated PyPI/npm tokens invalidate old credentials",
          console_url: "https://github.com/settings/keys",
        },
        {
          priority: 3,
          issuer: "LiteLLM / PyPI / npm",
          target_resource: "LITELLM_ADMIN_KEY + package publish tokens",
          action_type: "rotate_downstream_key",
          command_or_endpoint:
            "Revoke LITELLM_ADMIN_KEY at issuer + yank compromised release version",
          why_naive_fails:
            "Git history deletion does not invalidate active keys at the issuing server.",
          verification_probe:
            "Call proxy admin endpoint with old key -> verify 401 Unauthorized",
          console_url: null,
        },
      ],
    },
    pre_consent_guard: {
      action: "BLOCK_PRE_CONSENT",
      provider: "github",
      risk_score: 96,
      pkce_protected: false,
      pkce_rewrite_warning:
        "GitHub classic OAuth requests `repo` + `workflow` across ALL private org repos and CI pipelines. Replace with a single-repo Fine-Grained PAT or drop `workflow`.",
      flagged_scopes: [
        {
          scope_id: "repo",
          severity: "critical",
          reason:
            "All-or-nothing read/write across every private repository and deploy key",
          recommended_scope_id: "public_repo",
        },
        {
          scope_id: "workflow",
          severity: "critical",
          reason:
            "Allows rewriting .github/workflows/*.yml for CI/CD RCE and secret exfiltration",
          recommended_scope_id: "read:user",
        },
      ],
      recommended_scopes: ["public_repo", "read:user", "read:org"],
      safe_replacement_url:
        "https://github.com/login/oauth/authorize?client_id=178c6fc778ccc68e1d6a&scope=public_repo+read%3Auser+read%3Aorg&redirect_uri=http%3A%2F%2F127.0.0.1%3A0%2Fcallback",
    },
    ai_explainer_used: false,
  },
};
