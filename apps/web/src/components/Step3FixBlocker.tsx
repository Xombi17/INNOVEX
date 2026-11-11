"use client";
import { useState } from "react";
import type { AuditReport, SimulationMode } from "@contracts/index";
import { ContainmentComparison } from "./ContainmentComparison";
import { PreConsentPreview } from "./PreConsentPreview";
import { ConsentTrapSandbox } from "./ConsentTrapSandbox";
interface Props {
  report: AuditReport;
  simulationMode: SimulationMode;
  activeOAuthUrl: string | null;
  onChangeSimulationMode: (mode: SimulationMode) => void;
  onInspectUrl: (url: string) => void;
  onBack: () => void;
}
export function Step3FixBlocker({
  report,
  simulationMode,
  activeOAuthUrl,
  onChangeSimulationMode,
  onInspectUrl,
  onBack,
}: Props) {
  const [sandboxOpen, setSandboxOpen] = useState(false);
  return (
    <div className="space-y-6">
      <div>
        <h1 tabIndex={-1} className="text-2xl font-semibold">
          Review recommended actions
        </h1>
        <p className="muted mt-2">
          Use provider settings to investigate and clean up confirmed exposure.
          Open technical details when you need them.
        </p>
      </div>
      <ContainmentComparison
        report={report}
        simulationMode={simulationMode}
        onChangeSimulationMode={onChangeSimulationMode}
      />
      <details className="border-t border-[#e8eaec] pt-3">
        <summary className="cursor-pointer font-semibold">
          Prevent future overbroad app access
        </summary>
        <div className="mt-4 space-y-5">
          <p className="muted">
            The website demonstration does not enable browser protection. The
            extension must be installed separately in desktop Chrome, and
            supports specific Google, GitHub and Microsoft authorization pages.
          </p>
          <button
            className="control"
            type="button"
            onClick={() => setSandboxOpen(true)}
          >
            Try consent demonstration
          </button>
          {report.parsed_oauth && (
            <PreConsentPreview
              report={report}
              activeOAuthUrl={activeOAuthUrl}
              onInspectUrl={onInspectUrl}
            />
          )}
          <section
            aria-label="Install browser extension"
            className="space-y-3 border-t border-[#e8eaec] pt-4"
          >
            <h2 className="font-semibold">Install the Chrome extension</h2>
            <a
              className="control"
              href="/downloads/scopebomb-mv3-extension.zip"
              download
            >
              Download extension (.zip)
            </a>
            <ol className="list-decimal space-y-2 pl-5">
              <li>Download and extract the archive.</li>
              <li>
                On desktop Chrome, open <code>chrome://extensions</code> and
                enable Developer mode.
              </li>
              <li>
                Choose Load unpacked, select the extracted folder, and confirm
                ScopeBomb appears enabled.
              </li>
            </ol>
            <p className="muted text-[13px]">
              Then use the extension popup to inspect a supported authorization
              URL. Downloading the archive or using this sandbox does not
              install protection. This website cannot confirm extension
              installation.
            </p>
          </section>
        </div>
      </details>
      <button type="button" className="control" onClick={onBack}>
        Back to possible exposure
      </button>
      <ConsentTrapSandbox
        open={sandboxOpen}
        onClose={() => setSandboxOpen(false)}
      />
    </div>
  );
}
