"use client";
import React from "react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import type { AuditReport, SimulationMode } from "@contracts/index";
import { DominoGraph } from "./DominoGraph";

interface Step2Props {
  report: AuditReport;
  simulationMode: SimulationMode;
  onChangeSimulationMode: (mode: SimulationMode) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function Step2AttackPath({
  report,
  simulationMode,
  onChangeSimulationMode,
  onBack,
  onContinue,
}: Step2Props) {
  const persistingCount =
    simulationMode === "naive_single_revoke"
      ? report.naive_containment.persisting_node_ids.length
      : report.full_containment.persisting_node_ids.length;
  const totalContained = report.full_containment.contained_node_ids.length;

  const headline =
    simulationMode === "naive_single_revoke"
      ? `Why clicking Revoke still leaves ${persistingCount} paths open`
      : `Full multi-account fix closes all ${totalContained} exposed paths`;

  return (
    <div className="space-y-0">
      {/* Plain-English Headline */}
      <div className="px-5 pb-4 pt-5">
        <h1 className="text-[22px] font-semibold leading-[1.35] tracking-[-0.015em] text-[#131416]">
          {headline}
        </h1>
        <p className="mt-1.5 text-[14px] leading-[1.5] text-[#5d5f60]">
          The domino map below shows how a single OAuth grant escalates across issuers and trust
          boundaries. Use the toggle to compare outcomes.
        </p>
      </div>

      {/* Simulation Segmented Toggle */}
      <div className="px-5 pb-4">
        <div className="inline-flex overflow-hidden rounded-[8px] border border-[#e8eaec]">
          <button
            type="button"
            onClick={() => onChangeSimulationMode("naive_single_revoke")}
            className={`px-4 py-1.5 text-[13px] transition ${
              simulationMode === "naive_single_revoke"
                ? "bg-[#131416] text-[#ffffff]"
                : "bg-[#ffffff] text-[#5d5f60] hover:bg-[#f4f6f8]"
            }`}
          >
            After 1-Click Revoke (Fails)
          </button>
          <button
            type="button"
            onClick={() => onChangeSimulationMode("full_multi_issuer")}
            className={`border-l border-[#e8eaec] px-4 py-1.5 text-[13px] transition ${
              simulationMode === "full_multi_issuer"
                ? "bg-[#131416] text-[#ffffff]"
                : "bg-[#ffffff] text-[#5d5f60] hover:bg-[#f4f6f8]"
            }`}
          >
            After Full Multi-Issuer Plan (Fixed)
          </button>
        </div>
      </div>

      {/* DominoGraph */}
      <div className="border-t border-[#e8eaec]">
        <DominoGraph
          report={report}
          simulationMode={simulationMode}
          onChangeSimulationMode={onChangeSimulationMode}
        />
      </div>

      {/* Technical Forensics Collapsible Disclosure */}
      <div className="border-t border-[#f0f1f2] px-5 py-4">
        <details>
          <summary className="cursor-pointer text-[13px] text-[#1b6c80] hover:underline">
            Technical forensics &amp; RFC 7009 proof
          </summary>
          <div className="mt-3 space-y-2 text-[13px] text-[#5d5f60]">
            <p>
              RFC 7009 §2.2: servers MUST respond with HTTP 200 even when the token was already
              invalid or expired — this response is NOT proof of revocation. Access tokens may
              remain valid until their natural TTL expires.
            </p>
            <p>
              <strong className="text-[#131416]">Scenario:</strong>{" "}
              {report.preset_id ?? report.input_mode} · Max hops: {report.summary.max_hops} ·
              Risk score: {report.summary.max_risk_score}/100
            </p>
            <p>
              <strong className="text-[#131416]">Trust boundaries crossed:</strong>{" "}
              {report.summary.trust_boundary_crossings.join(", ") || "none"}
            </p>
          </div>
        </details>
      </div>

      {/* Step Navigation */}
      <div className="flex items-center justify-between border-t border-[#f0f1f2] px-5 pb-5 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[#cdced1] bg-[#ffffff] px-4 text-[13px] text-[#131416] transition hover:bg-[#f4f6f8]"
        >
          <ArrowLeft size={14} />
          Scan &amp; Verdict
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[#131416] px-4 text-[13px] font-medium text-[#ffffff] transition hover:bg-[#2a2c30]"
        >
          View Fix Plan &amp; Blocker
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
