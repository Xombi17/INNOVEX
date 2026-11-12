"use client";
import { useState } from "react";
import { AccessibleDialog } from "./AccessibleDialog";

export function ConsentTrapSandbox({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [reviewing, setReviewing] = useState(false);
  return (
    <AccessibleDialog
      open={open}
      onClose={() => {
        setReviewing(false);
        onClose();
      }}
      title="Consent demonstration"
      id="consent-title"
    >
      <div className="space-y-5 text-slate-300">
        <p className="rounded-md border border-teal-500/30 bg-teal-500/10 p-3 text-teal-300">
          Sample simulation only. No app is connected and browser protection is
          not enabled. Your active analysis stays unchanged.
        </p>
        {!reviewing ? (
          <>
            <h3 className="font-semibold text-white">
              Example: NovaAI asks for broad access
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-slate-300">
              <li>Read, send and delete email.</li>
              <li>Access Google Drive files.</li>
              <li>Request ongoing access while you are away.</li>
            </ul>
            <p className="muted text-slate-400">
              A permission request is not proof that an app is malicious. Review
              whether its job needs this access.
            </p>
            <button
              className="control control-primary"
              type="button"
              onClick={() => setReviewing(true)}
            >
              Review the example permissions
            </button>
          </>
        ) : (
          <>
            <h3 className="font-semibold text-white">Review access before granting it</h3>
            <p className="muted text-slate-400">
              If the app only needs selected files, ask its developer to use{" "}
              <code className="rounded bg-[#141924] px-1.5 py-0.5 text-teal-300">drive.file</code>. Read-only email still exposes email
              content; it is not a harmless baseline.
            </p>
            <details className="border-t border-[#1e2636] pt-2">
              <summary className="cursor-pointer text-slate-300 hover:text-white">
                Why the app must restart authorization
              </summary>
              <p className="muted mt-3 text-slate-400">
                PKCE links a challenge to a secret verifier; scopes are not part
                of that hash. Editing scopes can still conflict with the app’s
                authorization transaction. The initiating app must create a
                fresh request with reviewed permissions, fresh state, and a
                verifier/challenge. A copied URL without those values is not a
                secure login replacement.
              </p>
            </details>
            <button
              className="control"
              type="button"
              onClick={() => setReviewing(false)}
            >
              Back to example
            </button>
          </>
        )}
      </div>
    </AccessibleDialog>
  );
}
