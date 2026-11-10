"use client";
import React from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import type { AuditReport, SimulationMode } from "@contracts/index";
import { ContainmentComparison } from "./ContainmentComparison";
import { PreConsentPreview } from "./PreConsentPreview";

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
  return (
    <div className="space-y-0">
      {/* Plain-English Headline */}
      <div className="px-5 pb-4 pt-5">
        <h1 className="text-[22px] font-semibold leading-[1.35] tracking-[-0.015em] text-[#131416]">
          Follow these steps by provider &amp; block bad logins before clicking Allow
        </h1>
        <p className="mt-1.5 text-[14px] leading-[1.5] text-[#5d5f60]">
          The containment checklist below shows the exact ordered actions needed to close all
          exposed paths. The Chrome Extension guard stops over-scoped consent before it happens.
        </p>
      </div>

      {/* Containment Comparison */}
      <div className="border-t border-[#e8eaec]">
        <ContainmentComparison
          report={report}
          simulationMode={simulationMode}
          onChangeSimulationMode={onChangeSimulationMode}
          showFullTableByDefault
        />
      </div>

      {/* Provider Kill-Switch Slot (Phase 6) */}
      <div className="border-t border-[#f0f1f2] px-5 py-4">
        <div className="rounded-[8px] border border-dashed border-[#e8eaec] p-4">
          <div className="text-[13px] font-medium text-[#131416]">Provider kill-switch scripts</div>
          <p className="mt-1 text-[13px] text-[#5d5f60]">
            Copy-ready <code className="font-mono">curl</code> revocation commands, verification
            probes, and direct account links for each detected issuer. Coming in Phase 6.
          </p>
        </div>
      </div>

      {/* Pre-Consent Preview */}
      <div className="border-t border-[#e8eaec]">
        <PreConsentPreview
          report={report}
          activeOAuthUrl={activeOAuthUrl}
          onInspectUrl={onInspectUrl}
        />
      </div>

      {/* Extension Download Slot (Phase 6) */}
      <div className="border-t border-[#f0f1f2] px-5 py-4">
        <div className="rounded-[8px] border border-dashed border-[#e8eaec] p-4">
          <div className="text-[13px] font-medium text-[#131416]">Download Chrome Extension</div>
          <p className="mt-1 text-[13px] text-[#5d5f60]">
            One-click download of <code className="font-mono">scopebomb-mv3-extension.zip</code>{" "}
            with 3-step install instructions for <code className="font-mono">chrome://extensions</code>. Coming in Phase 6.
          </p>
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
    </div>
  );
}
