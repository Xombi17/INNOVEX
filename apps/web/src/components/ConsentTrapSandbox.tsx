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
      <div className="space-y-5">
        <p className="rounded-md bg-[#e6f2f5] p-3 text-[#155768]">
          Sample simulation only. No app is connected and browser protection is
          not enabled. Your active analysis stays unchanged.
        </p>
        {!reviewing ? (
          <>
            <h3 className="font-semibold">
              Example: NovaAI asks for broad access
            </h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>Read, send and delete email.</li>
              <li>Access Google Drive files.</li>
              <li>Request ongoing access while you are away.</li>
            </ul>
            <p className="muted">
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
            <h3 className="font-semibold">Review access before granting it</h3>
            <p className="muted">
              If the app only needs selected files, ask its developer to use{" "}
              <code>drive.file</code>. Read-only email still exposes email
              content; it is not a harmless baseline.
            </p>
            <details>
              <summary className="cursor-pointer">
                Why the app must restart authorization
              </summary>
              <p className="muted mt-3">
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
