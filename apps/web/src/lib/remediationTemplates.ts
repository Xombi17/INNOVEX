import type { ContainmentStep, AuditReport } from "@contracts/index";

export interface EnrichedStepDetails {
  copyableCommand: string;
  verificationProbe: string;
  expectedStatus: string;
  consoleUrl: string;
  providerLabel: string;
  rfcNote?: string;
}

export function enrichContainmentStep(
  step: ContainmentStep,
  report?: AuditReport,
): EnrichedStepDetails {
  const issuerLower = step.issuer.toLowerCase();

  if (issuerLower.includes("google")) {
    return {
      providerLabel: "Google Identity",
      copyableCommand: `curl -s -X POST https://oauth2.googleapis.com/revoke -d "token=<ACTIVE_REFRESH_OR_ACCESS_TOKEN>"`,
      verificationProbe: `curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer <TOKEN>" https://gmail.googleapis.com/gmail/v1/users/me/profile`,
      expectedStatus: "401 Unauthorized",
      consoleUrl: "https://myaccount.google.com/connections",
      rfcNote:
        "RFC 7009 §2.2: Google returns HTTP 200 even if the token was already revoked. Verify with the probe above.",
    };
  }

  if (issuerLower.includes("github")) {
    if (step.action_type === "github_grant_delete") {
      return {
        providerLabel: "GitHub OAuth Applications",
        copyableCommand: `curl -s -X DELETE -u "$CLIENT_ID:$CLIENT_SECRET" https://api.github.com/applications/$CLIENT_ID/grant -d '{"access_token":"<TOKEN>"}'`,
        verificationProbe: `curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer <TOKEN>" https://api.github.com/user`,
        expectedStatus: "401 Bad credentials (or 204 on delete)",
        consoleUrl: "https://github.com/settings/applications",
        rfcNote:
          "GitHub OAuth applications use DELETE /applications/{client_id}/grant to cascade revoke all issued user tokens.",
      };
    }
    return {
      providerLabel: "GitHub Personal Access Tokens",
      copyableCommand: `gh auth refresh -h github.com -s read:user # or revoke PAT via GitHub Settings`,
      verificationProbe: `curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer <TOKEN>" https://api.github.com/user`,
      expectedStatus: "401 Bad credentials",
      consoleUrl: "https://github.com/settings/tokens",
    };
  }

  if (issuerLower.includes("microsoft") || issuerLower.includes("entra")) {
    return {
      providerLabel: "Microsoft Entra ID",
      copyableCommand: `curl -s -X POST https://graph.microsoft.com/v1.0/me/revokeSignInSessions -H "Authorization: Bearer <ADMIN_OR_USER_TOKEN>"`,
      verificationProbe: `curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer <TOKEN>" https://graph.microsoft.com/v1.0/me`,
      expectedStatus: "401 InvalidAuthenticationToken",
      consoleUrl: "https://myaccount.microsoft.com/applications",
      rfcNote:
        "Microsoft Entra ID access tokens may remain valid for up to 60-90 minutes (residual JWT lifetime) unless Continuous Access Evaluation (CAE) is enforced.",
    };
  }

  if (issuerLower.includes("vercel")) {
    return {
      providerLabel: "Vercel Platform",
      copyableCommand: `npx vercel tokens rm <TOKEN_NAME_OR_ID> --yes`,
      verificationProbe: `curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer <VERCEL_TOKEN>" https://api.vercel.com/v2/user`,
      expectedStatus: "401 Unauthorized",
      consoleUrl: "https://vercel.com/account/tokens",
    };
  }

  if (issuerLower.includes("slack")) {
    return {
      providerLabel: "Slack API",
      copyableCommand: `curl -s -X POST https://slack.com/api/auth.revoke -H "Authorization: Bearer <SLACK_TOKEN>"`,
      verificationProbe: `curl -s -H "Authorization: Bearer <SLACK_TOKEN>" https://slack.com/api/auth.test`,
      expectedStatus: "{\"ok\":false,\"error\":\"token_revoked\"}",
      consoleUrl: "https://api.slack.com/apps",
    };
  }

  if (issuerLower.includes("salesforce")) {
    return {
      providerLabel: "Salesforce Connected App",
      copyableCommand: `curl -s -X POST https://login.salesforce.com/services/oauth2/revoke -d "token=<TOKEN>"`,
      verificationProbe: `curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer <TOKEN>" https://login.salesforce.com/services/oauth2/userinfo`,
      expectedStatus: "401 Bad Request",
      consoleUrl: "https://login.salesforce.com",
    };
  }

  if (issuerLower.includes("openai")) {
    return {
      providerLabel: "OpenAI Platform",
      copyableCommand: `# Revoke compromised API key in OpenAI Dashboard:
https://platform.openai.com/api-keys`,
      verificationProbe: `curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer <KEY>" https://api.openai.com/v1/models`,
      expectedStatus: "401 Invalid Authentication",
      consoleUrl: "https://platform.openai.com/api-keys",
    };
  }

  if (issuerLower.includes("anthropic")) {
    return {
      providerLabel: "Anthropic Console",
      copyableCommand: `# Rotate compromised API key in Anthropic Console:
https://console.anthropic.com/settings/keys`,
      verificationProbe: `curl -s -o /dev/null -w "%{http_code}" -H "x-api-key: <KEY>" -H "anthropic-version: 2023-06-01" https://api.anthropic.com/v1/messages`,
      expectedStatus: "401 authentication_error",
      consoleUrl: "https://console.anthropic.com/settings/keys",
    };
  }

  // Default fallback for generic downstream tokens
  return {
    providerLabel: step.issuer,
    copyableCommand: step.command_or_endpoint,
    verificationProbe: step.verification_probe,
    expectedStatus: "401 Unauthorized",
    consoleUrl: step.console_url ?? "https://scopebomb.vercel.app",
    rfcNote: step.why_naive_fails ? `Why: ${step.why_naive_fails}` : undefined,
  };
}
