"use client";
import { useState, type ReactNode } from "react";
import type { AuditReport, SimulationMode } from "@contracts/index";
import { ContainmentComparison } from "./ContainmentComparison";
import { PreConsentPreview } from "./PreConsentPreview";
import { ConsentTrapSandbox } from "./ConsentTrapSandbox";

interface Props {
  report: AuditReport;
  guidance?: ReactNode;
  simulationMode: SimulationMode;
  activeOAuthUrl: string | null;
  onChangeSimulationMode: (mode: SimulationMode) => void;
  onInspectUrl: (url: string) => void;
  onBack: () => void;
}

export function Step3FixBlocker({
  report,
  guidance,
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
        <h1 tabIndex={-1} className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
          Review recommended actions
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-400 font-normal leading-relaxed">
          Use provider settings to investigate and clean up confirmed exposure.
          Open technical details when you need them.
        </p>
      </div>

      {guidance}

      <ContainmentComparison
        report={report}
        simulationMode={simulationMode}
        onChangeSimulationMode={onChangeSimulationMode}
      />

      <details className="rounded-2xl border border-white/10 bg-[#12141c] p-5 sm:p-6 shadow-xl shadow-black/30">
        <summary className="cursor-pointer font-semibold text-white hover:text-blue-300 transition-colors text-sm sm:text-base">
          Prevent future overbroad app access
        </summary>
        <div className="mt-5 space-y-5">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            The website demonstration does not enable browser protection. The
            extension must be installed separately in desktop Chrome, and
            supports specific Google, GitHub and Microsoft authorization pages.
          </p>
          <div>
            <button
              className="rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-2 text-xs font-semibold text-teal-300 hover:bg-teal-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
              type="button"
              onClick={() => setSandboxOpen(true)}
            >
              Try consent demonstration
            </button>
          </div>

          {report.parsed_oauth && (
            <PreConsentPreview
              report={report}
              activeOAuthUrl={activeOAuthUrl}
              onInspectUrl={onInspectUrl}
            />
          )}

          <section
            aria-label="Install browser extension"
            className="space-y-3.5 border-t border-white/10 pt-5"
          >
            <h2 className="text-sm font-semibold text-white">Install the Chrome extension</h2>
            <div>
              <a
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                href="/downloads/scopebomb-mv3-extension.zip"
                download
              >
                Download extension (.zip)
              </a>
            </div>
            <ol className="list-decimal space-y-2 pl-5 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <li>Download and extract the archive.</li>
              <li>
                On desktop Chrome, open <code className="rounded-lg bg-[#0e1017] px-2 py-0.5 text-teal-300 font-mono text-xs border border-white/5">chrome://extensions</code> and
                enable Developer mode.
              </li>
              <li>
                Choose Load unpacked, select the extracted folder, and confirm
                ScopeBomb appears enabled.
              </li>
            </ol>
            <p className="text-xs text-slate-400 leading-relaxed">
              Then use the extension popup to inspect a supported authorization
              URL. Downloading the archive or using this sandbox does not
              install protection. This website cannot confirm extension
              installation.
            </p>
          </section>
        </div>
      </details>

      <div className="pt-2">
        <button
          type="button"
          className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs sm:text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          onClick={onBack}
        >
          Back to possible exposure
        </button>
      </div>

      <ConsentTrapSandbox
        open={sandboxOpen}
        onClose={() => setSandboxOpen(false)}
      />
    </div>
  );
}
