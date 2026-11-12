"use client";
import { useState } from "react";
import type { AuditReport } from "@contracts/index";
import { PROVIDER_LABELS } from "./uiTokens";

interface Props {
  report: AuditReport;
  activeOAuthUrl: string | null;
  onInspectUrl: (url: string) => void;
}
export function PreConsentPreview({ report }: Props) {
  const [status, setStatus] = useState("");
  const guard = report.pre_consent_guard;
  return (
    <section
      className="space-y-4 border-t border-[#1e2636] pt-4"
      aria-label="Permission review preview"
    >
      <h2 className="font-semibold text-white">
        Permission review for {PROVIDER_LABELS[guard.provider]}
      </h2>
      <p className="muted text-slate-300">
        {guard.action === "BLOCK_PRE_CONSENT"
          ? "The catalog recommends blocking this request for scope review in a supported extension flow."
          : guard.action === "WARN"
            ? "The catalog recommends further permission review."
            : "No catalog warning was triggered. This does not establish that the app or request is safe."}{" "}
        This website has not blocked or modified an authorization request.
      </p>
      {guard.flagged_scopes.length > 0 && (
        <ul className="divide-y divide-[#182030]">
          {guard.flagged_scopes.map((scope) => (
            <li key={scope.scope_id} className="py-3">
              <p className="break-all font-mono text-[13px] text-rose-300">
                Requested: {scope.scope_id}
              </p>
              <p className="muted mt-1 text-[13px] text-slate-400">{scope.reason}</p>
              <p className="mt-2 break-all font-mono text-[13px] text-teal-300">
                Review alternative: {scope.recommended_scope_id}
              </p>
            </li>
          ))}
        </ul>
      )}
      <p className="muted text-[13px] text-slate-400">
        An alternative must still fit the app’s job. Read-only email exposes
        message contents; narrower scopes can break features and do not
        guarantee safety.
      </p>
      <details className="border-t border-[#1e2636] pt-2">
        <summary className="cursor-pointer text-slate-300 hover:text-white">
          Authorization transaction details
        </summary>
        <p className="muted mt-3 text-slate-400">
          {guard.pkce_protected
            ? "PKCE parameters were detected, not cryptographically verified. "
            : "No PKCE parameters were detected in this input. "}
          PKCE compares a verifier with a challenge; requested scopes are not
          part of that hash. Do not alter a pending transaction. The initiating
          app must restart with reviewed scopes, fresh state and appropriate
          verifier/challenge values.
        </p>
        <p className="muted mt-2 text-slate-400">
          ScopeBomb provides scope recommendations, not a replacement login URL.
          Copying a URL with security parameters removed is not a secure client
          restart.
        </p>
      </details>
      {guard.recommended_scopes.length > 0 && (
        <button
          type="button"
          className="control"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(
                guard.recommended_scopes.join(" "),
              );
              setStatus(
                "Scope recommendations copied. No request was changed.",
              );
            } catch {
              setStatus(
                "Copy unavailable. Select the recommendations above to copy them manually.",
              );
            }
          }}
        >
          Copy scope recommendations
        </button>
      )}
      <p role="status" className="muted text-[13px] text-teal-300">
        {status}
      </p>
    </section>
  );
}
