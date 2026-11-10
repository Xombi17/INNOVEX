"use client";
import React from "react";
import { ArrowRight } from "@phosphor-icons/react";
import type { AuditInput, AuditReport, SimulationMode } from "@contracts/index";
import type { IncidentPresetSummary } from "@/lib/auditAdapter";
import { PROVIDER_LABELS } from "./uiTokens";
import { InputAndPresetBar } from "./InputAndPresetBar";
import { PresetStrip } from "./PresetStrip";

interface Step1Props {
  report: AuditReport;
  simulationMode: SimulationMode;
  presets: IncidentPresetSummary[];
  inputError: string | null;
  externalOAuthUrl: string | null;
  interceptedBanner: boolean;
  onRunAudit: (input: AuditInput) => void;
  onClearError: () => void;
  onSelectPreset: (preset: IncidentPresetSummary) => void;
  onContinue: () => void;
}

export function Step1ScanVerdict({
  report,
  simulationMode,
  presets,
  inputError,
  externalOAuthUrl,
  interceptedBanner,
  onRunAudit,
  onClearError,
  onSelectPreset,
  onContinue,
}: Step1Props) {
  const activeOutcome =
    simulationMode === "naive_single_revoke"
      ? report.naive_containment
      : report.full_containment;
  const containmentPct = Math.round(activeOutcome.containment_ratio * 100);
  const persistingCount = activeOutcome.persisting_node_ids.length;
  const naivePct = Math.round(report.naive_containment.containment_ratio * 100);
  const fullPct = Math.round(report.full_containment.containment_ratio * 100);

  const headline =
    persistingCount > 0
      ? `Check what one AI login link or leaked .env key exposes — ${persistingCount} paths still open`
      : `Check what one AI login link or leaked .env key exposes — all paths contained`;

  return (
    <div className="space-y-0">
      {/* Plain-English Headline */}
      <div className="px-5 pb-4 pt-5">
        <h1 className="text-[22px] font-semibold leading-[1.35] tracking-[-0.015em] text-[#131416]">
          {headline}
        </h1>
        <p className="mt-1.5 text-[14px] leading-[1.5] text-[#5d5f60]">
          {report.summary.headline}
        </p>
      </div>

      {/* Intercepted link banner */}
      {interceptedBanner && (
        <div className="mx-5 mb-4 rounded-[6px] bg-[#e6f2f5] px-3 py-2 text-[13px] text-[#1b6c80]">
          Intercepted link passed from Chrome extension guard — pre-filled below
        </div>
      )}

      {/* Always-visible scanner */}
      <InputAndPresetBar
        presets={presets}
        activePresetId={report.preset_id ?? null}
        activeInputMode={report.input_mode}
        report={report}
        inputError={inputError}
        externalOAuthUrl={externalOAuthUrl}
        scannerOpen={true}
        onToggleScanner={() => {}}
        onClearError={onClearError}
        onRunAudit={onRunAudit}
      />

      {/* Preset Strip */}
      <PresetStrip
        presets={presets}
        activePresetId={report.preset_id ?? null}
        onSelectPreset={onSelectPreset}
      />

      {/* 4-Cell Metric Strip */}
      <div className="grid grid-cols-2 divide-y divide-[#f0f1f2] border-y border-[#e8eaec] md:grid-cols-4 md:divide-x md:divide-y-0 md:divide-[#e8eaec]">
        <div className="px-5 py-3.5">
          <div className="text-[13px] font-medium text-[#5d5f60]">Blast risk</div>
          <div className="mt-1 text-[28px] font-normal leading-[1.3] text-[#131416] tabular-nums">
            {report.summary.max_risk_score}
            <span className="ml-1 text-[14px] text-[#5d5f60]">/ 100</span>
          </div>
        </div>
        <div className="px-5 py-3.5">
          <div className="text-[13px] font-medium text-[#5d5f60]">Escalation depth</div>
          <div className="mt-1 text-[28px] font-normal leading-[1.3] text-[#131416] tabular-nums">
            {report.summary.max_hops}
            <span className="ml-1.5 text-[14px] text-[#5d5f60]">
              hops · {report.summary.trust_boundary_crossings.length}/5 zones
            </span>
          </div>
        </div>
        <div className="px-5 py-3.5">
          <div className="text-[13px] font-medium text-[#5d5f60]">Active containment</div>
          <div
            className="mt-1 text-[28px] font-normal leading-[1.3] tabular-nums"
            style={{ color: persistingCount > 0 ? "#831c1e" : "#04250e" }}
          >
            {containmentPct}%
            <span className="ml-1.5 text-[14px] text-[#5d5f60]">
              {simulationMode === "naive_single_revoke"
                ? `vs ${fullPct}% full`
                : `vs ${naivePct}% single`}
            </span>
          </div>
        </div>
        <div className="px-5 py-3.5">
          <div className="text-[13px] font-medium text-[#5d5f60]">Paths still open</div>
          <div
            className="mt-1 text-[28px] font-normal leading-[1.3] tabular-nums"
            style={{ color: persistingCount > 0 ? "#c4242a" : "#1e7b4f" }}
          >
            {persistingCount}
            <span className="ml-1.5 text-[14px] text-[#5d5f60]">
              {persistingCount > 0 ? "bypassed revoke" : "contained"}
            </span>
          </div>
        </div>
      </div>

      {/* AI Triage Slot (Phase 5 placeholder) */}
      <div className="mx-5 my-4 rounded-[8px] border border-dashed border-[#e8eaec] p-4">
        <div className="text-[13px] font-medium text-[#5d5f60]">AI Threat Brief</div>
        <p className="mt-1 text-[13px] text-[#5d5f60]">
          Plain-English attacker story and first-60-seconds action will appear here after scanning a URL or repo. Live AI triage wired in Phase 5.
        </p>
      </div>

      {/* Step Continue */}
      <div className="flex justify-end px-5 pb-5">
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[#131416] px-4 text-[13px] font-medium text-[#ffffff] transition hover:bg-[#2a2c30]"
        >
          Continue to Attack Path
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
