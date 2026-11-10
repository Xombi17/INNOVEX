"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowSquareOut,
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
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 pb-4 pt-5">
        <div>
          <h1 className="text-[22px] font-semibold leading-[1.35] tracking-[-0.015em] text-[#131416]">
            Follow these steps by provider &amp; block bad logins before clicking Allow
          </h1>
          <p className="mt-1.5 text-[14px] leading-[1.5] text-[#5d5f60]">
            The containment checklist below shows the exact ordered actions needed to close all
            exposed paths. The Chrome Extension guard stops over-scoped consent before it happens.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSandboxOpen(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-[6px] border border-[#1b6c80] bg-[#e6f2f5] px-3.5 text-[13px] font-medium text-[#1b6c80] transition hover:bg-[#d8eef3]"
        >
          <PlayCircle size={16} />
          Simulate Fake AI App Consent
        </button>
      </div>

      {/* Containment Comparison Table with Enriched CLI Kill-Switches */}
      <div className="border-t border-[#e8eaec]">
        <ContainmentComparison
          report={report}
          simulationMode={simulationMode}
          onChangeSimulationMode={onChangeSimulationMode}
          showFullTableByDefault
        />
      </div>

      {/* Pre-Consent Preview */}
      <div className="border-t border-[#e8eaec]">
        <PreConsentPreview
          report={report}
          activeOAuthUrl={activeOAuthUrl}
          onInspectUrl={onInspectUrl}
        />
      </div>

      {/* Real Extension Download & 3-Step Setup Card */}
      <div className="border-t border-[#f0f1f2] px-5 py-5">
        <div className="rounded-[12px] border border-[#e8eaec] bg-[#ffffff] p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f1f2] pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#1e7b4f]" />
              <h2 className="text-[14px] font-semibold text-[#131416]">
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

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 md:divide-x md:divide-[#f0f1f2]">
            <div className="space-y-1">
              <div className="text-[13px] font-semibold text-[#131416]">
                Step 1: Download &amp; Unzip
              </div>
              <p className="text-[13px] leading-[1.5] text-[#5d5f60]">
                Download <code className="font-mono text-[12px]">scopebomb-mv3-extension.zip</code> and extract the contents into a local folder.
              </p>
            </div>

            <div className="space-y-1 md:pl-4">
              <div className="text-[13px] font-semibold text-[#131416]">
                Step 2: Enable Developer Mode
              </div>
              <p className="text-[13px] leading-[1.5] text-[#5d5f60]">
                In Chrome, navigate to <code className="font-mono text-[12px]">chrome://extensions</code> and toggle <strong>Developer mode</strong> on (top right).
              </p>
            </div>

            <div className="space-y-1 md:pl-4">
              <div className="text-[13px] font-semibold text-[#131416]">
                Step 3: Load Unpacked
              </div>
              <p className="text-[13px] leading-[1.5] text-[#5d5f60]">
                Click <strong>Load unpacked</strong> and select the extracted folder. ScopeBomb now monitors Google, GitHub &amp; Microsoft OAuth requests before consent.
              </p>
            </div>
          </div>
        </div>
      </div>

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
      <ConsentTrapSandbox
        open={sandboxOpen}
        onClose={() => setSandboxOpen(false)}
        onApplyCleanScopes={(cleanUrl) => {
          onInspectUrl(cleanUrl);
        }}
        onInspectUrl={(url) => {
          onInspectUrl(url);
        }}
      />
    </div>
  );
}
