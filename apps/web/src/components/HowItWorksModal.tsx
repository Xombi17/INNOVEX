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
      <div className="space-y-5 text-slate-300">
        <p>
          ScopeBomb helps developers review app permissions and credential-like
          values, understand possible exposure, and plan cleanup. Findings are
          based on supplied input and a limited rule catalog.
        </p>
        <div>
          <h3 className="font-semibold text-white">What the website does</h3>
          <p className="muted mt-1 text-slate-400">
            Parses local input in your browser. Public repository checks
            retrieve selected files on our server. Optional AI ordering receives
            only provider names and counts, after you request it.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-white">What remains unknown</h3>
          <p className="muted mt-1 text-slate-400">
            We do not sign in to your accounts, validate credential access,
            detect active attackers, execute cleanup, or confirm containment.
            Scenarios and preview outcomes are simulations.
          </p>
        </div>
        <details className="border-t border-[#1e2636] pt-2">
          <summary className="cursor-pointer font-medium text-white hover:text-teal-300">
            Browser extension and local command line
          </summary>
          <div className="mt-3 space-y-3">
            <p className="muted text-slate-400">
              The Chrome extension reviews supported Google, GitHub and
              Microsoft authorization pages after you install it. Trying the
              website sandbox does not install or activate it.
            </p>
            <p className="muted text-slate-400">
              For an offline project scan, use a source checkout, install
              Node 24, then run this from the project root:
            </p>
            <code className="block break-all rounded-md border border-[#1e2636] bg-[#090c13] p-3 font-mono text-[13px] text-teal-300">
              node packages/engine/cli.ts /path/to/project --json
            </code>
            <a
              href="/downloads/scopebomb-mv3-extension.zip"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300 underline"
            >
              Download Chrome extension (.zip)
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
