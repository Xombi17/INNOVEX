"use client";
import { AccessibleDialog } from "./AccessibleDialog";
interface Props {
  open: boolean;
  onClose: () => void;
  onOpenSimulator: () => void;
  onOpenPkceGuard: () => void;
  onLoadMcpSample: () => void;
}
export function HowItWorksModal({ open, onClose, onOpenSimulator }: Props) {
  return (
    <AccessibleDialog
      open={open}
      onClose={onClose}
      title="About ScopeBomb"
      id="about-title"
    >
      <div className="space-y-5">
        <p>
          ScopeBomb helps developers review app permissions and credential-like
          values, understand possible exposure, and plan cleanup. Findings are
          based on supplied input and a limited rule catalog.
        </p>
        <div>
          <h3 className="font-semibold">What the website does</h3>
          <p className="muted mt-1">
            Parses local input in your browser. Public repository checks
            retrieve selected files on our server. Optional AI ordering receives
            only provider names and counts, after you request it.
          </p>
        </div>
        <div>
          <h3 className="font-semibold">What remains unknown</h3>
          <p className="muted mt-1">
            We do not sign in to your accounts, validate credential access,
            detect active attackers, execute cleanup, or confirm containment.
            Scenarios and preview outcomes are simulations.
          </p>
        </div>
        <details>
          <summary className="cursor-pointer font-medium">
            Browser extension and local command line
          </summary>
          <div className="mt-3 space-y-3">
            <p className="muted">
              The Chrome extension reviews supported Google, GitHub and
              Microsoft authorization pages after you install it. Trying the
              website sandbox does not install or activate it.
            </p>
            <p className="muted">
              For an offline project scan, clone the source repository, install
              Node 24, then run this from the project root:
            </p>
            <code className="block break-all rounded-md bg-[#f4f6f8] p-3 text-[13px]">
              node packages/engine/cli.ts /path/to/project --json
            </code>
            <a
              href="https://github.com/Xombi17/INNOVEX#quick-start"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1b6c80] underline"
            >
              Read installation instructions
            </a>
          </div>
        </details>
        <button
          type="button"
          className="control control-primary"
          onClick={() => {
            onClose();
            onOpenSimulator();
          }}
        >
          Try a labeled example
        </button>
      </div>
    </AccessibleDialog>
  );
}
