// Generated from data/scope_catalog.json by scripts/build.mjs — do not edit manually.
export default {
  "version": "1.0.0",
  "updated_at": "2026-11-10",
  "scopes": [
    {
      "provider": "google",
      "scope_id": "https://mail.google.com/",
      "display_name": "Full Gmail Access (IMAP/SMTP/Modify/Delete)",
      "severity": "critical",
      "category": "email_full",
      "capabilities": [
        "Read all emails, OTP codes, and password reset links",
        "Send emails as victim and purge security alert messages",
        "Manage forwarding rules and labels"
      ],
      "enables_targets": ["password_reset_otps", "billing_invoices", "downstream_saas_takeover"],
      "persistence_vectors": ["gmail_filter_exfil", "offline_refresh_token"],
      "least_privilege_alternative": {
        "scope_id": "https://www.googleapis.com/auth/gmail.readonly",
        "description": "Read-only mail access (or gmail.metadata when bodies are unnecessary)",
        "notes": "Cannot delete alert emails or plant forwarding filters; consider gmail.metadata if only headers are needed."
      },
      "is_pkce_sensitive": true,
      "revocation_endpoint": "https://oauth2.googleapis.com/revoke",
      "rfc7009_notes": "RFC 7009 POST returns HTTP 200 even if token is already invalid; access-token cascading is only SHOULD."
    },
    {
      "provider": "google",
      "scope_id": "https://www.googleapis.com/auth/gmail.modify",
      "display_name": "Gmail Read/Write/Delete (No Permanent Delete)",
      "severity": "critical",
      "category": "email_write",
      "capabilities": [
        "Read OTP and magic-link reset emails",
        "Trash/archive security alert emails before user notices",
        "Send phishing replies from trusted mailbox"
      ],
      "enables_targets": ["password_reset_otps", "downstream_saas_takeover"],
      "persistence_vectors": ["offline_refresh_token", "alert_suppression"],
      "least_privilege_alternative": {
        "scope_id": "https://www.googleapis.com/auth/gmail.readonly",
        "description": "Read-only inbox access without mailbox mutation",
        "notes": "Blocks alert suppression and outgoing impersonation."
      },
      "is_pkce_sensitive": true,
      "revocation_endpoint": "https://oauth2.googleapis.com/revoke",
      "rfc7009_notes": "Revoking refresh grant invalidates family at Google, but does not invalidate downstream SaaS sessions minted via intercepted OTPs."
    },
    {
      "provider": "google",
      "scope_id": "https://www.googleapis.com/auth/drive",
      "display_name": "Full Google Drive Read/Write",
      "severity": "critical",
      "category": "storage_full",
      "capabilities": [
        "Read and exfiltrate every file and shared drive document",
        "Read exported .env, SSH keys, and architecture docs"
      ],
      "enables_targets": ["shared_drive_secrets", "exported_env_files", "pii_documents"],
      "persistence_vectors": ["offline_refresh_token", "shared_permission_injection"],
      "least_privilege_alternative": {
        "scope_id": "https://www.googleapis.com/auth/drive.file",
        "description": "Per-file access only to files explicitly opened or created by the app",
        "notes": "Prevents bulk enumeration across personal and shared company folders."
      },
      "is_pkce_sensitive": true,
      "revocation_endpoint": "https://oauth2.googleapis.com/revoke",
      "rfc7009_notes": "Exported files/secrets copied out of Drive remain compromised after RFC 7009 revocation."
    },
    {
      "provider": "google",
      "scope_id": "https://www.googleapis.com/auth/cloud-platform",
      "display_name": "Full Google Cloud Platform Control",
      "severity": "critical",
      "category": "cloud_admin",
      "capabilities": [
        "Read/modify GCP IAM, KMS, Secret Manager, and Compute workloads",
        "Mint long-lived service account JSON keys"
      ],
      "enables_targets": ["gcp_secret_manager", "service_account_keys", "prod_buckets"],
      "persistence_vectors": ["minted_service_account_key", "iam_binding_backdoor"],
      "least_privilege_alternative": {
        "scope_id": "https://www.googleapis.com/auth/cloud-platform.read-only",
        "description": "Read-only GCP scope (better: scoped Workload Identity)",
        "notes": "Still broad for reads; avoid on third-party tools."
      },
      "is_pkce_sensitive": true,
      "revocation_endpoint": "https://oauth2.googleapis.com/revoke",
      "rfc7009_notes": "Any GCP service account private key minted during window persists permanently past OAuth revocation."
    },
    {
      "provider": "google",
      "scope_id": "https://www.googleapis.com/auth/userinfo.email",
      "display_name": "Basic Profile Email",
      "severity": "low",
      "category": "identity_min",
      "capabilities": ["Read primary email address for login identification"],
      "enables_targets": [],
      "persistence_vectors": [],
      "least_privilege_alternative": {
        "scope_id": "https://www.googleapis.com/auth/userinfo.email",
        "description": "Already least privilege",
        "notes": "Safe baseline identity scope."
      },
      "is_pkce_sensitive": false,
      "revocation_endpoint": "https://oauth2.googleapis.com/revoke",
      "rfc7009_notes": "Minimal blast radius."
    },
    {
      "provider": "github",
      "scope_id": "repo",
      "display_name": "Full Private & Public Repository Access",
      "severity": "critical",
      "category": "source_write",
      "capabilities": [
        "Read/write every private repository",
        "Harvest committed .env configs and deploy keys",
        "Push code directly to repositories"
      ],
      "enables_targets": ["private_source_code", "committed_secrets", "deploy_keys"],
      "persistence_vectors": ["newly_added_deploy_key", "committed_backdoor"],
      "least_privilege_alternative": {
        "scope_id": "public_repo",
        "description": "Public repos only (or Fine-Grained PAT pinned to 1 repository)",
        "notes": "Classic OAuth 'repo' is all-or-nothing across all orgs/private repos."
      },
      "is_pkce_sensitive": true,
      "revocation_endpoint": "https://api.github.com/applications/{client_id}/grant",
      "rfc7009_notes": "GitHub revokes via DELETE /applications/{client_id}/grant (Basic auth client_id:client_secret -> 204), not standard RFC 7009 form revoke."
    },
    {
      "provider": "github",
      "scope_id": "workflow",
      "display_name": "Update GitHub Actions Workflow YAML Files",
      "severity": "critical",
      "category": "ci_cd_rce",
      "capabilities": [
        "Modify .github/workflows/*.yml to exfiltrate GitHub Actions secrets",
        "Intercept CI/CD release pipelines for npm/PyPI/Docker/Vercel"
      ],
      "enables_targets": ["ci_cd_secrets", "release_artifact_poisoning", "prod_deploy_tokens"],
      "persistence_vectors": ["modified_workflow_yaml", "poisoned_release_artifact"],
      "least_privilege_alternative": {
        "scope_id": "read:user",
        "description": "Remove workflow scope completely; gate workflow edits via protected branches/CODEOWNERS",
        "notes": "Third-party AI or dev tools rarely need CI pipeline rewrite authority."
      },
      "is_pkce_sensitive": true,
      "revocation_endpoint": "https://api.github.com/applications/{client_id}/grant",
      "rfc7009_notes": "Revoking GitHub OAuth grant does not revert malicious commits to .github/workflows/*.yml or invalidate exfiltrated CI secrets."
    },
    {
      "provider": "github",
      "scope_id": "admin:org",
      "display_name": "Full Organization Admin",
      "severity": "critical",
      "category": "org_admin",
      "capabilities": [
        "Install org-wide OAuth/GitHub Apps",
        "Modify organization secrets and runner groups"
      ],
      "enables_targets": ["org_audit_bypass", "org_ci_runners", "org_secrets"],
      "persistence_vectors": ["rogue_org_oauth_app", "self_hosted_runner_implant"],
      "least_privilege_alternative": {
        "scope_id": "read:org",
        "description": "Read-only org membership check",
        "notes": "Never grant admin:org to IDE plugins or unvetted AI tools."
      },
      "is_pkce_sensitive": true,
      "revocation_endpoint": "https://api.github.com/applications/{client_id}/grant",
      "rfc7009_notes": "Rogue apps installed while token was active keep independent client credentials."
    },
    {
      "provider": "microsoft",
      "scope_id": "Application.ReadWrite.All",
      "display_name": "Microsoft Graph App Creation & Permission Grant",
      "severity": "critical",
      "category": "identity_admin",
      "capabilities": [
        "Create additional Entra ID / OAuth applications and client secrets",
        "Self-escalate Exchange / Graph permissions"
      ],
      "enables_targets": ["entra_oauth_apps", "corporate_exchange_ews"],
      "persistence_vectors": ["attacker_created_oauth_app", "added_app_secret"],
      "least_privilege_alternative": {
        "scope_id": "User.Read",
        "description": "Signed-in profile read only",
        "notes": "Never expose Application.ReadWrite.All outside audited tenant automation."
      },
      "is_pkce_sensitive": true,
      "revocation_endpoint": null,
      "rfc7009_notes": "Entra ID access JWTs remain valid until TTL (~60-90m) unless Continuous Access Evaluation (CAE) triggers."
    },
    {
      "provider": "microsoft",
      "scope_id": "Mail.ReadWrite",
      "display_name": "Exchange Online / Graph Mailbox ReadWrite",
      "severity": "critical",
      "category": "email_write",
      "capabilities": ["Access executive/corporate mailboxes via Graph or EWS"],
      "enables_targets": ["corporate_mailboxes", "internal_incident_threads"],
      "persistence_vectors": ["mailbox_rule_forwarding"],
      "least_privilege_alternative": {
        "scope_id": "Mail.Read",
        "description": "Read-only single mailbox (with app access policy scope)",
        "notes": "Pair with Exchange RBAC for Applications to restrict mailbox reach."
      },
      "is_pkce_sensitive": true,
      "revocation_endpoint": null,
      "rfc7009_notes": "Separately created attacker apps retain independent Exchange permissions."
    },
    {
      "provider": "slack",
      "scope_id": "admin",
      "display_name": "Workspace-Wide Slack Admin & History",
      "severity": "critical",
      "category": "workspace_admin",
      "capabilities": [
        "Read private/public Slack channels for shared .env snippets & keys",
        "Manage apps and workspace users"
      ],
      "enables_targets": ["slack_shared_secrets", "incident_channels"],
      "persistence_vectors": ["installed_slack_bot_token"],
      "least_privilege_alternative": {
        "scope_id": "channels:read",
        "description": "Metadata/selected channel reads only",
        "notes": "Avoid workspace-wide history read scopes on unvetted bots."
      },
      "is_pkce_sensitive": true,
      "revocation_endpoint": "https://slack.com/api/auth.revoke",
      "rfc7009_notes": "Bot tokens copied from Slack messages or config backups must be revoked individually."
    }
  ],
  "incident_presets": [
    {
      "preset_id": "rohan_mcp_oauth_trap",
      "title": "Rohan Developer Laptop: Unvetted AI Assistant + .mcp.json Token Overlap",
      "year": 2026,
      "classification": "Shadow-AI OAuth Over-Scope + Local MCP Secret Overlap",
      "summary": "Developer grants an unvetted AI productivity app Gmail Modify + Drive + GitHub repo/workflow scopes while storing VERCEL_TOKEN and OPENAI_API_KEY in local .mcp.json/.env.",
      "sample_oauth_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=9481203-shadowai.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fai-helper.example.com%2Fcallback&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.modify%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&access_type=offline&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256&state=rohan_demo",
      "sample_mcp_config": "{\n  \"mcpServers\": {\n    \"github-helper\": {\n      \"env\": {\n        \"GITHUB_TOKEN\": \"ghp_RoHaN94DemoClassicRepoWorkflow999\",\n        \"VERCEL_TOKEN\": \"vcp_demo_ProdEnvAccess_8812x\",\n        \"OPENAI_API_KEY\": \"sk-proj-demoRohanLeak9981abc\"\n      }\n    }\n  }\n}"
    },
    {
      "preset_id": "midnight_blizzard_2024",
      "title": "Midnight Blizzard Pattern (2024): Test-Tenant Account -> Legacy OAuth Privilege Abuse",
      "year": 2024,
      "classification": "OAuth App & Permission Governance Failure (Not Shadow AI)",
      "summary": "Password spray compromises an unprotected test-tenant account, abusing an over-privileged legacy OAuth app to mint new OAuth apps and gain corporate Exchange Online access.",
      "sample_oauth_url": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=legacy-test-oauth-app-001&response_type=code&redirect_uri=https%3A%2F%2Flegacy-test.example.internal%2Fauth&scope=Application.ReadWrite.All%20Mail.ReadWrite%20offline_access",
      "sample_mcp_config": null
    },
    {
      "preset_id": "salesloft_drift_2025",
      "title": "Salesloft Drift Pattern (Aug 2025): Vendor Compromise -> Multi-SaaS OAuth Fan-Out",
      "year": 2025,
      "classification": "Vendor / Supply-Chain OAuth Compromise (Multi-Path Fan-Out)",
      "summary": "Compromise of vendor GitHub -> Drift AWS infrastructure exposes Salesforce & Google Workspace OAuth tokens; exported customer data exposes secondary secrets requiring 100+ downstream token rotations.",
      "sample_oauth_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=vendor-drift-email-sync.apps.googleusercontent.com&response_type=code&redirect_uri=https%3A%2F%2Fdrift-sync.example.com%2Fcb&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.modify&access_type=offline",
      "sample_mcp_config": "{\n  \"vendorSync\": {\n    \"env\": {\n      \"SALESFORCE_REFRESH_TOKEN\": \"5Aep861DemoDriftExportedToken\",\n      \"SUPPORT_API_TOKEN\": \"tok_demo_ExportedFromCaseBody_771\"\n    }\n  }\n}"
    },
    {
      "preset_id": "context_ai_vercel_2026",
      "title": "Context.ai -> Vercel Pattern (Apr 2026): Third-Party AI Workspace OAuth -> Cloud Pivoting",
      "year": 2026,
      "classification": "Third-Party Shadow-Integration Risk via Google Workspace OAuth",
      "summary": "Compromised third-party AI tool with Workspace access pivots into employee Vercel account and accesses non-sensitive environment variables.",
      "sample_oauth_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=contextai-workspace.apps.googleusercontent.com&response_type=code&redirect_uri=https%3A%2F%2Fapp.contextai.example.com%2Foauth&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.readonly%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&access_type=offline",
      "sample_mcp_config": "{\n  \"cloudPivot\": {\n    \"env\": {\n      \"VERCEL_TOKEN\": \"vcp_demo_WorkspaceOAuthPivot_4410\"\n    }\n  }\n}"
    },
    {
      "preset_id": "litellm_ci_2026",
      "title": "LiteLLM Pattern (Oct 2026): Deleted-But-Unrevoked Key + GitHub CLI OAuth -> CI Release Hijack",
      "year": 2026,
      "classification": "Non-Human Key Hygiene Failure + Maintainer OAuth Compromise",
      "summary": "Admin key removed from git history but never revoked plus exposed GitHub CLI OAuth token enables CI workflow hijacking, secret theft, and poisoned package release.",
      "sample_oauth_url": "https://github.com/login/oauth/authorize?client_id=178c6fc778ccc68e1d6a&scope=repo%20workflow%20read:org&redirect_uri=http%3A%2F%2F127.0.0.1%3A0%2Fcallback",
      "sample_mcp_config": "{\n  \"ciLeak\": {\n    \"env\": {\n      \"LITELLM_ADMIN_KEY\": \"sk-litellm-demo-DeletedInGitNeverRevoked\",\n      \"GITHUB_TOKEN\": \"gho_demo_GitHubCLIOAuthHijack_552\"\n    }\n  }\n}"
    }
  ]
};
