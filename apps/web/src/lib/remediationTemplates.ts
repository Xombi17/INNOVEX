import type { ContainmentStep, AuditReport } from "../../../../contracts/index.d.ts";

export interface EnrichedStepDetails {
  copyableCommand: string;
  verificationProbe: string;
  expectedStatus: string;
  consoleUrl: string;
  providerLabel: string;
  rfcNote?: string;
  documentationUrl?: string;
  guidance: string;
  actor: string;
}

export function enrichContainmentStep(step: ContainmentStep, _report?: AuditReport): EnrichedStepDetails {
  const issuer = step.issuer.toLowerCase();
  const guide = {
    rfc7009_revoke:
      "Remove this app’s access in the provider’s connected-app settings. Review other credentials separately.",
    github_grant_delete:
      "Remove the affected OAuth app in GitHub settings. The grant-deletion API requires the application owner’s client credentials.",
    rotate_downstream_key:
      "Identify the credential and its owner. If exposure is confirmed, revoke it at its issuer, issue a limited replacement, and update dependent applications.",
    audit_minted_apps:
      "Review apps, keys and sharing permissions against your trusted inventory. Remove only unauthorized entries.",
    inspect_ci_workflows:
      "Review workflows, runners, deploy keys and release changes. Restore trusted versions and rotate confirmed exposed CI credentials.",
    invalidate_sessions:
      "Review independent sessions and residual tokens. Use the provider’s supported controls and confirm old access is rejected; revocation does not recover copied data.",
  };
  const base: EnrichedStepDetails = {
    guidance: guide[step.action_type],
    actor: step.action_type === "github_grant_delete" ? "App user in settings; application owner for the API" : "Credential owner or authorized administrator",
    providerLabel: step.issuer, copyableCommand: step.command_or_endpoint, verificationProbe: step.verification_probe,
    expectedStatus: "Review issuer-specific rejection and audit evidence; HTTP status alone does not prove containment.",
    consoleUrl: step.console_url ?? "", rfcNote: step.why_naive_fails,
  };
  if (step.action_type === "inspect_ci_workflows") return { ...base,
    copyableCommand: 'git log -n 10 -p -- .github/workflows/\ngh workflow list --all\ngh run list --limit 10',
    verificationProbe: "Review workflow diffs, runners, deployments and branch protections; rotate exposed CI credentials separately.",
    expectedStatus: "Unapproved persistence removed and each exposed credential independently rejected.",
    documentationUrl: "https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions",
  };
  if (step.action_type === "audit_minted_apps") return { ...base,
    expectedStatus: "Unauthorized apps, credentials, role grants and consent removed; verify each discovered issuer separately.",
    rfcNote: "An app inventory review is distinct from revoking a user's token. Use an authorized administrator and verify every discovered credential.",
  };
  if (issuer.includes("google") && step.action_type === "rotate_downstream_key") return { ...base,
    providerLabel: "Google Cloud IAM",
    copyableCommand: 'gcloud iam service-accounts keys list --iam-account="$SA_EMAIL"\ngcloud iam service-accounts keys delete "$KEY_ID" --iam-account="$SA_EMAIL"',
    verificationProbe: 'gcloud iam service-accounts keys list --iam-account="$SA_EMAIL"',
    expectedStatus: "Deleted key absent from inventory; separately assess already-issued short-lived credentials.",
    consoleUrl: "https://console.cloud.google.com/iam-admin/serviceaccounts",
    rfcNote: "Deleting a service-account key does not revoke short-lived credentials already issued from it. A generic API 403 does not establish revocation.",
    documentationUrl: "https://docs.cloud.google.com/iam/docs/keys-create-delete",
  };
  if (step.action_type === "invalidate_sessions" && !issuer.includes("microsoft")) return { ...base,
    expectedStatus: "Provider session inventory and affected account access checked; no verification was performed by ScopeBomb.",
  };
  if (issuer.includes("google")) {
    const target = step.target_resource.toLowerCase();
    if (
      target.includes("gmail") ||
      target.includes("mail") ||
      target.includes("filter") ||
      target.includes("forward")
    ) {
      return {
        ...base,
        providerLabel: "Gmail Forwarding & Filter Security",
        copyableCommand:
          "# Review and delete unauthorized mail forwarding rules & filters:\n# Open Gmail Settings -> Forwarding and POP/IMAP",
        verificationProbe:
          'curl -sS -i -H "Authorization: Bearer $OLD_ACCESS_TOKEN" https://gmail.googleapis.com/gmail/v1/users/me/settings/forwardingAddresses',
        expectedStatus:
          "Forwarding addresses removed; old token rejected with 401.",
        consoleUrl: "https://mail.google.com/mail/u/0/#settings/fwdandpop",
        rfcNote:
          "OAuth revocation alone does NOT delete Gmail forwarding filters previously planted by an attacker.",
        documentationUrl: "https://support.google.com/mail/answer/10957",
      };
    }
    if (target.includes("drive")) {
      return {
        ...base,
        providerLabel: "Google Drive File Access",
        copyableCommand:
          "# Review shared files and external permissions in Google Drive:\n# Inspect recently modified/shared sensitive files",
        verificationProbe:
          'curl -sS -i -H "Authorization: Bearer $OLD_ACCESS_TOKEN" https://www.googleapis.com/drive/v3/about?fields=user',
        expectedStatus: "Old access token rejected with 401 Unauthorized.",
        consoleUrl: "https://drive.google.com/drive/u/0/my-drive",
        rfcNote:
          "Files exported or downloaded by the app remain outside Google Drive; revoking access does not recover copied data.",
        documentationUrl: "https://support.google.com/drive/answer/2494886",
      };
    }
    if (
      target.includes("session") ||
      step.action_type === "invalidate_sessions"
    ) {
      return {
        ...base,
        providerLabel: "Google Account Active Sessions",
        copyableCommand:
          '# Terminate all active Google sessions and revoke app passwords:\n# Check "Your devices" in Google Security',
        verificationProbe:
          'curl -sS -i -H "Authorization: Bearer $OLD_ACCESS_TOKEN" https://www.googleapis.com/oauth2/v3/userinfo',
        expectedStatus:
          "All active sessions terminated and device tokens invalidated (401).",
        consoleUrl: "https://myaccount.google.com/security",
        rfcNote:
          "Disconnecting an app does not sign out active attacker browser sessions or revoke minted app passwords.",
        documentationUrl: "https://support.google.com/accounts/answer/3067630",
      };
    }
    return {
      ...base,
      providerLabel: "Google Connected Applications",
      copyableCommand:
        'curl -sS -X POST https://oauth2.googleapis.com/revoke --data-urlencode "token=$OLD_TOKEN"',
      verificationProbe:
        'curl -sS -i -H "Authorization: Bearer $OLD_ACCESS_TOKEN" https://www.googleapis.com/drive/v3/about?fields=user',
      expectedStatus:
        "Old access token rejected as invalid (normally 401); use an API this grant could access before revocation.",
      consoleUrl: "https://myaccount.google.com/connections",
      rfcNote:
        "RFC 7009 returns 200 for invalid tokens too, and access-token cascading is SHOULD. Google documents its own revocation behavior; confirm rejection after propagation and inspect other issuers separately.",
      documentationUrl:
        "https://developers.google.com/identity/protocols/oauth2/web-server#tokenrevoke",
    };
  }
  if (issuer.includes("github")) {
    if (step.action_type === "github_grant_delete") return { ...base, providerLabel: "GitHub OAuth Applications",
      copyableCommand: 'curl -sS -i -X DELETE -u "$CLIENT_ID:$CLIENT_SECRET" -H "Accept: application/vnd.github+json" -H "Content-Type: application/json" "https://api.github.com/applications/$CLIENT_ID/grant" --data "{\\"access_token\\":\\"$OLD_TOKEN\\"}"',
      verificationProbe: 'curl -sS -i -H "Authorization: Bearer $OLD_TOKEN" https://api.github.com/user',
      expectedStatus: "Grant deletion: 204. Old token: 401 Bad credentials. Independent PATs need separate revocation.",
      consoleUrl: "https://github.com/settings/connections/applications",
      rfcNote: "The deletion API requires the OAuth app owner's client ID and secret. End users can revoke authorization in GitHub settings instead.",
      documentationUrl: "https://docs.github.com/en/rest/apps/oauth-applications#delete-an-app-authorization",
    };
    return { ...base, providerLabel: "GitHub independent credentials",
      copyableCommand: "# Revoke the exposed PAT in https://github.com/settings/tokens\n# Inspect repository deploy keys separately in the repository settings.",
      verificationProbe: 'curl -sS -i -H "Authorization: Bearer $OLD_TOKEN" https://api.github.com/user',
      expectedStatus: "Old PAT rejected with 401 Bad credentials. Deploy-key access requires its own SSH check.",
      consoleUrl: "https://github.com/settings/tokens",
      rfcNote: "Refreshing a gh CLI login does not revoke an exposed token or deploy key.",
      documentationUrl: "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens",
    };
  }
  if (issuer.includes("microsoft") || issuer.includes("entra")) return { ...base, providerLabel: "Microsoft Entra ID",
    copyableCommand: 'curl -sS -X POST "https://graph.microsoft.com/v1.0/users/$USER_ID/revokeSignInSessions" -H "Authorization: Bearer $ADMIN_TOKEN"',
    verificationProbe: 'curl -sS -i -H "Authorization: Bearer $OLD_ACCESS_TOKEN" https://graph.microsoft.com/v1.0/me',
    expectedStatus: "Session invalidation may take minutes. Check refresh failure and old access-token rejection after expiry/enforcement.",
    consoleUrl: "https://entra.microsoft.com/",
    rfcNote: "Requires an authorized administrator with User.RevokeSessions.All. User-session revocation does not remove application credentials or app-only permissions; inspect these separately. A 403 alone is insufficient evidence.",
    documentationUrl: "https://learn.microsoft.com/en-us/graph/api/user-revokesigninsessions?view=graph-rest-1.0",
  };
  if (issuer.includes("vercel")) return { ...base, providerLabel: "Vercel Platform",
    copyableCommand: 'curl -sS -X DELETE -H "Authorization: Bearer $OLD_TOKEN" https://api.vercel.com/v3/user/tokens/current',
    verificationProbe: 'curl -sS -i -H "Authorization: Bearer $OLD_TOKEN" https://api.vercel.com/v2/user',
    expectedStatus: "Old token rejected as invalid; inspect the response body as well as status.",
    consoleUrl: "https://vercel.com/account/tokens",
    rfcNote: "This deletes the token authenticating the request. Replace dependent workloads with a new credential and review deployment persistence separately.",
    documentationUrl: "https://vercel.com/docs/rest-api/authentication/delete-an-authentication-token",
  };
  if (issuer.includes("slack")) return { ...base, providerLabel: "Slack API",
    copyableCommand: 'curl -sS -X POST https://slack.com/api/auth.revoke -H "Authorization: Bearer $OLD_TOKEN" -H "Content-Type: application/x-www-form-urlencoded"',
    verificationProbe: 'curl -sS -H "Authorization: Bearer $OLD_TOKEN" https://slack.com/api/auth.test',
    expectedStatus: 'JSON ok:false with token_revoked or invalid_auth; HTTP 200 alone is insufficient.',
    consoleUrl: "https://api.slack.com/apps",
    rfcNote: "With token rotation, auth.revoke revokes a single token; the installation can remain. Review refresh tokens and uninstall unauthorized apps separately.",
    documentationUrl: "https://docs.slack.dev/authentication/using-token-rotation",
  };
  if (issuer.includes("salesforce")) return { ...base, providerLabel: "Salesforce Connected App",
    copyableCommand: 'curl -sS -X POST "https://$MY_DOMAIN.my.salesforce.com/services/oauth2/revoke" --data-urlencode "token=$OLD_TOKEN"',
    verificationProbe: 'curl -sS -i -H "Authorization: Bearer $OLD_ACCESS_TOKEN" "https://$MY_DOMAIN.my.salesforce.com/services/oauth2/userinfo"',
    expectedStatus: "Userinfo rejects an invalid token with provider error Bad_OAuth_Token (documented 403); check the response body.",
    consoleUrl: "https://login.salesforce.com/",
    rfcNote: "Use your actual My Domain (and sandbox domain when applicable). Salesforce documents 400 invalid_token for an invalid revocation request; do not assume generic RFC 7009 semantics for every provider.",
    documentationUrl: "https://help.salesforce.com/s/articleView?id=sf.remoteaccess_using_userinfo_endpoint.htm&language=en_US&type=5",
  };
  if (issuer.includes("openai")) return { ...base, providerLabel: "OpenAI Platform",
    copyableCommand: "# Delete the exposed API key in https://platform.openai.com/api-keys\n# Create a replacement and update dependent workloads.",
    verificationProbe: 'curl -sS -i -H "Authorization: Bearer $OLD_TOKEN" https://api.openai.com/v1/models',
    expectedStatus: "401 with an invalid/revoked-key authentication error; check error details because other failures can also return 401.",
    consoleUrl: "https://platform.openai.com/api-keys",
    documentationUrl: "https://developers.openai.com/api/docs/guides/error-codes",
  };
  if (issuer.includes("anthropic")) return { ...base, providerLabel: "Anthropic Console",
    copyableCommand: "# Delete the exposed key in https://platform.claude.com/settings/keys\n# Create a replacement and update dependent workloads.",
    verificationProbe: 'curl -sS -i -H "x-api-key: $OLD_TOKEN" -H "anthropic-version: 2023-06-01" https://api.anthropic.com/v1/models',
    expectedStatus: "401 authentication_error; inspect details to distinguish revoked credentials from other authentication problems.",
    consoleUrl: "https://platform.claude.com/settings/keys",
    documentationUrl: "https://platform.claude.com/docs/en/api/errors",
  };
  if (issuer.includes("aws") || issuer.includes("cognito") || issuer.includes("amazon")) return { ...base, providerLabel: "AWS Cognito / IAM Identity Center",
    copyableCommand: 'aws cognito-idp revoke-token --client-id "$CLIENT_ID" --token "$REFRESH_TOKEN" --client-secret "$CLIENT_SECRET"\n# For IAM Identity Center (AWS SSO) user sessions:\naws sso-admin delete-account-assignment --instance-arn "$INSTANCE_ARN" --target-id "$ACCOUNT_ID" --target-type AWS_ACCOUNT --permission-set-arn "$PERMISSION_SET_ARN" --principal-type USER --principal-id "$USER_ID"',
    verificationProbe: 'curl -sS -i -H "Authorization: Bearer $OLD_ACCESS_TOKEN" -H "X-Amz-Target: AWSCognitoIdentityProviderService.GetUser" -H "Content-Type: application/x-amz-json-1.1" "https://cognito-idp.$AWS_REGION.amazonaws.com/"',
    expectedStatus: "400/401 with NotAuthorizedException (Access Token has been revoked); inspect individual AWS account and STS session invalidations separately.",
    consoleUrl: "https://console.aws.amazon.com/cognito/v2/idp/user-pools",
    rfcNote: "Cognito revoke-token revokes all access tokens previously issued by the refresh token. For AWS STS temporary credentials, session policies or IAM role revocation must be applied.",
    documentationUrl: "https://docs.aws.amazon.com/cognito/latest/developerguide/revocation-of-refresh-tokens.html",
  };
  if (issuer.includes("gitlab")) return { ...base, providerLabel: "GitLab OAuth & Access Tokens",
    copyableCommand: 'curl -sS -X POST "https://gitlab.com/oauth/revoke" --data "client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET&token=$OLD_TOKEN"',
    verificationProbe: 'curl -sS -i -H "Authorization: Bearer $OLD_TOKEN" "https://gitlab.com/api/v4/user"',
    expectedStatus: '401 Unauthorized with {"error":"invalid_token"}; inspect project deploy tokens and CI variables separately.',
    consoleUrl: "https://gitlab.com/-/user_settings/applications",
    rfcNote: "GitLab implements RFC 7009 token revocation. Revoking an OAuth access token does not revoke Personal Access Tokens (PATs) or Project Deploy Tokens.",
    documentationUrl: "https://docs.gitlab.com/api/oauth2/#revoke-a-token",
  };
  if (issuer.includes("atlassian") || issuer.includes("jira")) return { ...base, providerLabel: "Atlassian Cloud (Jira & Confluence)",
    copyableCommand: 'curl -sS -X POST "https://auth.atlassian.com/oauth/token/revoke" -H "Content-Type: application/json" -d "{\\"client_id\\":\\"$CLIENT_ID\\",\\"client_secret\\":\\"$CLIENT_SECRET\\",\\"token\\":\\"$OLD_TOKEN\\"}"',
    verificationProbe: 'curl -sS -i -H "Authorization: Bearer $OLD_TOKEN" "https://api.atlassian.com/me"',
    expectedStatus: "401 Unauthorized with error invalid_token or unauthorized; verify connected workspace access is completely cut.",
    consoleUrl: "https://id.atlassian.com/manage-profile/apps",
    rfcNote: "Revoking user authorization cuts 3LO app access across Jira and Confluence sites. API tokens generated by users must be deleted separately in Atlassian profile settings.",
    documentationUrl: "https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/#revoking-tokens",
  };
  return base;
}
