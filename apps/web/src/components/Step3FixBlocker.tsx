"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  DownloadSimple,
  PlayCircle,
  ShieldCheck,
} from "@phosphor-icons/react";
import type { AuditReport, SimulationMode } from "@contracts/index";
import { ContainmentComparison } from "./ContainmentComparison";
import { PreConsentPreview } from "./PreConsentPreview";
import { ConsentTrapSandbox } from "./ConsentTrapSandbox";

interface Step3Props {
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
}: Step3Props) {
  const [sandboxOpen, setSandboxOpen] = useState(false);


  return (
    <div className="space-y-0">
      {/* Plain-English Headline & Sandbox Trigger */}
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 pb-5 pt-5">
        <div className="max-w-[70ch]">
          <h1 className="text-[22px] font-semibold leading-[1.35] tracking-[-0.015em] text-[#131416]">
            Fix by provider &amp; block risky OAuth logins
          </h1>
          <p className="mt-1.5 text-[14px] leading-[1.5] text-[#5d5f60]">
            Review the modeled cleanup actions by issuer. Full containment assumes successful execution and verification; copied data cannot be recovered. Install the extension separately to inspect supported browser consent navigations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSandboxOpen(true)}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[6px] border border-[#1b6c80] bg-[#e6f2f5] px-3.5 text-[13px] font-medium text-[#1b6c80] transition hover:bg-[#d8eef3]"
        >
          <PlayCircle size={16} />
          Simulate Fake AI App Consent
        </button>
      </div>

      {/* Containment Comparison Table with Enriched CLI Kill-Switches */}
      <ContainmentComparison
        report={report}
        simulationMode={simulationMode}
        onChangeSimulationMode={onChangeSimulationMode}
        runbookOnly
      />

      {/* Pre-Consent Preview */}
      <details className="border-t border-[#e8eaec] p-5"><summary className="cursor-pointer font-medium text-[#1b6c80]">Review the permission guard and narrower scopes</summary>
      <PreConsentPreview
        report={report}
        activeOAuthUrl={activeOAuthUrl}
        onInspectUrl={onInspectUrl}
      />
      </details>

      {/* Real Extension Download & 3-Step Setup Section (Flat Hairline Grid) */}
      <section
        aria-label="Install Chrome Extension"
        className="border-t border-[#e8eaec] px-5 py-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f1f2] pb-3.5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#1e7b4f]" />
            <h2 className="text-[16px] font-semibold text-[#131416]">
              Install Chrome Extension (MV3 Pre-Consent Guard)
            </h2>
          </div>
          <a
            href="/downloads/scopebomb-mv3-extension.zip"
            download="scopebomb-mv3-extension.zip"
            className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[#131416] px-3.5 text-[13px] font-medium text-[#ffffff] transition hover:bg-[#2a2c30]"
          >
            <DownloadSimple size={14} />
            Download Extension (.zip)
          </a>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-0 md:divide-x md:divide-[#f0f1f2]">
          <div className="space-y-1 md:pr-4">
            <div className="text-[14px] font-semibold text-[#131416]">
              Step 1: Download &amp; Unzip
            </div>
            <p className="text-[13px] leading-[1.5] text-[#5d5f60]">
              Download <code>scopebomb-mv3-extension.zip</code> and extract the contents into a local folder.
            </p>
          </div>

          <div className="space-y-1 md:px-4">
            <div className="text-[14px] font-semibold text-[#131416]">
              Step 2: Enable Developer Mode
            </div>
            <p className="text-[13px] leading-[1.5] text-[#5d5f60]">
              In Chrome, navigate to <code>chrome://extensions</code> and toggle <strong>Developer mode</strong> on (top right).
            </p>
          </div>

          <div className="space-y-1 md:pl-4">
            <div className="text-[14px] font-semibold text-[#131416]">
              Step 3: Load Unpacked
            </div>
            <p className="text-[13px] leading-[1.5] text-[#5d5f60]">
              Click <strong>Load unpacked</strong> and select the extracted folder. ScopeBomb now monitors Google, GitHub &amp; Microsoft OAuth requests before consent.
            </p>
          </div>
        </div>
      </section>

      {/* Step Navigation */}
      <div className="flex items-center border-t border-[#f0f1f2] px-5 pb-5 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[#cdced1] bg-[#ffffff] px-4 text-[13px] text-[#131416] transition hover:bg-[#f4f6f8]"
        >
          <ArrowLeft size={14} />
          Attack Path
        </button>
      </div>

      {/* Fake AI App Consent Simulator Modal */}
      <ConsentTrapSandbox open={sandboxOpen} onClose={() => setSandboxOpen(false)} />
    </div>
  );
}
