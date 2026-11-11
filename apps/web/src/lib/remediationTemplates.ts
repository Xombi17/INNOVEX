import type { ContainmentStep, AuditReport } from "@contracts/index";
export interface EnrichedStepDetails {
  copyableCommand: string;
  verificationProbe: string;
  expectedStatus: string;
  consoleUrl: string;
  providerLabel: string;
  rfcNote?: string;
  guidance: string;
  actor: string;
}
export function enrichContainmentStep(
  step: ContainmentStep,
  _report?: AuditReport,
): EnrichedStepDetails {
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
  let command = step.command_or_endpoint;
  let probe = step.verification_probe;
  let note = step.why_naive_fails;
  if (step.action_type === "github_grant_delete") {
    command =
      'curl -X DELETE -u "$CLIENT_ID:$CLIENT_SECRET" -H "Content-Type: application/json" "https://api.github.com/applications/$CLIENT_ID/grant" --data \'{"access_token":"<OLD_TOKEN>"}\'';
    note =
      "GitHub grant deletion expects HTTP 204. App users can remove access in settings; the API requires the app owner’s client credentials.";
  } else if (
    step.action_type === "rfc7009_revoke" &&
    issuer.includes("google")
  ) {
    command =
      'curl -X POST "https://oauth2.googleapis.com/revoke" --data-urlencode "token=<OLD_TOKEN>"';
    note =
      "Google documents project-token invalidation with possible propagation delay. RFC 7009 HTTP 200 alone is not evidence that independently issued credentials or sessions have been cleaned up.";
  } else if (
    issuer.includes("vercel") &&
    step.action_type === "rotate_downstream_key"
  ) {
    command =
      "Revoke the affected token in https://vercel.com/account/tokens, create a limited replacement, and update its consumers.";
  }
  if (issuer.includes("slack"))
    probe =
      "Call auth.test with the old token; inspect the JSON body for ok:false and token_revoked/invalid_auth. Slack may return HTTP 200 for an API error.";
  return {
    providerLabel: step.issuer,
    copyableCommand: command,
    verificationProbe: probe,
    expectedStatus: issuer.includes("slack")
      ? "Authentication rejected in the response body"
      : "The previously authorized operation rejects the old credential. A permission-only 403 is insufficient evidence of revocation.",
    consoleUrl: step.console_url ?? "",
    rfcNote: note,
    guidance: guide[step.action_type],
    actor:
      step.action_type === "github_grant_delete"
        ? "App user in settings; application owner for the API"
        : issuer.includes("microsoft") ||
            step.action_type === "audit_minted_apps"
          ? "Account or tenant administrator"
          : issuer.includes("discovered")
            ? "Credential owner; identify its actual issuer first"
            : "Credential owner or administrator with access to these settings",
  };
}
