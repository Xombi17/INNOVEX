"use client";

import React, { useEffect, useState } from "react";
import type { AuditInput, AuditReport, SimulationMode } from "@contracts/index";
import {
  getIncidentPresets,
  tryRunScopeBombAudit,
} from "@/lib/auditAdapter";
import { ContainmentComparison } from "./ContainmentComparison";
import { DominoGraph } from "./DominoGraph";
import { DEMO_PKCE_TRAP_URL, InputAndPresetBar } from "./InputAndPresetBar";
import { PreConsentPreview } from "./PreConsentPreview";

interface ScopeBombArenaProps {
  initialReport: AuditReport;
}

const presets = getIncidentPresets();

export function ScopeBombArena({ initialReport }: ScopeBombArenaProps) {
  const [report, setReport] = useState<AuditReport>(initialReport);
  const [simulationMode, setSimulationMode] = useState<SimulationMode>(
    "naive_single_revoke",
  );
  const [inputError, setInputError] = useState<string | null>(null);
  const [externalOAuthUrl, setExternalOAuthUrl] = useState<string | null>(null);
  const [activeOAuthUrl, setActiveOAuthUrl] = useState<string | null>(
    presets[0]?.sample_oauth_url ?? null,
  );

  const handleRunAudit = (input: AuditInput) => {
    const result = tryRunScopeBombAudit(input);
    if (!result.ok) {
      setInputError(result.error);
      return;
    }

    setInputError(null);
    setReport(result.report);
    setSimulationMode(input.simulation_mode);

    if (input.mode === "oauth_url") {
      setActiveOAuthUrl(input.raw_payload);
    } else if (input.mode === "incident_preset") {
      const preset = presets.find(
        (p) => p.preset_id === (input.preset_id ?? result.report.preset_id),
      );
      setActiveOAuthUrl(preset?.sample_oauth_url ?? null);
    } else {
      setActiveOAuthUrl(null);
    }
  };

  const handleInspectUrl = (url: string) => {
    setExternalOAuthUrl(url);
    handleRunAudit({
      mode: "oauth_url",
      raw_payload: url,
      preset_id: null,
      simulation_mode: simulationMode,
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramUrl = params.get("oauth_url");
    if (paramUrl && paramUrl.trim()) {
      setExternalOAuthUrl(paramUrl);
      const result = tryRunScopeBombAudit({
        mode: "oauth_url",
        raw_payload: paramUrl,
        preset_id: null,
        simulation_mode: "naive_single_revoke",
      });
      if (result.ok) {
        setInputError(null);
        setReport(result.report);
        setActiveOAuthUrl(paramUrl);
      } else {
        setInputError(result.error);
      }
    }
  }, []);

  const activeOutcome =
    simulationMode === "naive_single_revoke"
      ? report.naive_containment
      : report.full_containment;

  const containmentPct = Math.round(activeOutcome.containment_ratio * 100);
  const persistingCount = activeOutcome.persisting_node_ids.length;

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      {/* Top Arena Header & <90s Demo Flow Strip */}
      <header className="rounded-xl border border-slate-800 bg-gradient-to-br from-[#0e1628] via-[#0b1120] to-[#080d18] p-4 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-rose-600 px-2 py-0.5 font-mono text-xs font-extrabold tracking-wide text-white">
                SCOPEBOMB
              </span>
              <span className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[11px] text-slate-300">
                INNOVEX 2026 · PS 05
              </span>
              <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-300">
                Zero-Login · Deterministic Engine
              </span>
            </div>
            <h1 className="mt-2 text-lg font-bold tracking-tight text-white sm:text-xl">
              OAuth & Shadow-AI Blast-Radius, RFC 7009 Persistence & Multi-Issuer
              Containment Simulator
            </h1>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              Proves why a single{" "}
              <code className="text-amber-300">POST /revoke → HTTP 200 OK</code>{" "}
              leaves attackers inside downstream issuers — and blocks
              over-scoped grants before PKCE handshake.
            </p>
          </div>

          {/* 3-Step <90s Guided Judge Pills */}
          <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => {
                handleRunAudit({
                  mode: "incident_preset",
                  raw_payload: presets[0]?.sample_oauth_url ?? "",
                  preset_id: "rohan_mcp_oauth_trap",
                  simulation_mode: "naive_single_revoke",
                });
              }}
              className="whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-left text-xs transition hover:border-sky-500/60"
            >
              <div className="font-mono text-[10px] text-sky-400">
                0:00–0:25
              </div>
              <div className="font-semibold text-slate-200">
                1. Trigger Blast Graph
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSimulationMode("naive_single_revoke")}
              className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-left text-xs transition ${
                simulationMode === "naive_single_revoke"
                  ? "border-rose-500/70 bg-rose-950/40"
                  : "border-slate-700 bg-slate-900/90 hover:border-rose-500/50"
              }`}
            >
              <div className="font-mono text-[10px] text-rose-400">
                0:25–0:55
              </div>
              <div className="font-semibold text-slate-200">
                2. HTTP 200 Trap
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSimulationMode("full_multi_issuer");
                if (!report.parsed_oauth) {
                  handleRunAudit({
                    mode: "oauth_url",
                    raw_payload: DEMO_PKCE_TRAP_URL,
                    preset_id: null,
                    simulation_mode: "full_multi_issuer",
                  });
                }
              }}
              className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-left text-xs transition ${
                simulationMode === "full_multi_issuer"
                  ? "border-emerald-500/70 bg-emerald-950/40"
                  : "border-slate-700 bg-slate-900/90 hover:border-emerald-500/50"
              }`}
            >
              <div className="font-mono text-[10px] text-emerald-400">
                0:55–1:25
              </div>
              <div className="font-semibold text-slate-200">
                3. Full Plan + PKCE Guard
              </div>
            </button>
          </div>
        </div>

        {/* 4 KPI Telemetry Cards */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950/75 px-3 py-2">
            <div className="text-[11px] text-slate-400">Max Risk Score</div>
            <div className="mt-0.5 font-mono text-xl font-bold text-rose-400">
              {report.summary.max_risk_score}
              <span className="text-xs font-normal text-slate-500"> / 100</span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/75 px-3 py-2">
            <div className="text-[11px] text-slate-400">Domino Depth</div>
            <div className="mt-0.5 font-mono text-xl font-bold text-slate-100">
              {report.summary.max_hops}{" "}
              <span className="text-xs font-normal text-slate-400">Hops</span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/75 px-3 py-2">
            <div className="text-[11px] text-slate-400">
              Boundaries Crossed
            </div>
            <div className="mt-0.5 font-mono text-xl font-bold text-amber-300">
              {report.summary.trust_boundary_crossings.length}{" "}
              <span className="text-xs font-normal text-slate-500">/ 5</span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/75 px-3 py-2">
            <div className="text-[11px] text-slate-400">
              Active Containment
            </div>
            <div
              className={`mt-0.5 font-mono text-xl font-bold ${
                persistingCount > 0 ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {containmentPct}%
              <span className="ml-1.5 text-xs font-medium">
                {persistingCount > 0
                  ? `(${persistingCount} persisting)`
                  : "(Verified)"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 1. Preset Selector + Live Input Surface */}
      <InputAndPresetBar
        presets={presets}
        activePresetId={report.preset_id ?? null}
        activeInputMode={report.input_mode}
        report={report}
        inputError={inputError}
        externalOAuthUrl={externalOAuthUrl}
        onClearError={() => setInputError(null)}
        onRunAudit={handleRunAudit}
      />

      {/* 2. Interactive Multi-Hop Blast-Radius Domino Graph */}
      <DominoGraph
        report={report}
        simulationMode={simulationMode}
        onChangeSimulationMode={setSimulationMode}
      />

      {/* 3. Side-by-Side Naive RFC 7009 Trap vs Full Multi-Issuer Containment */}
      <ContainmentComparison
        report={report}
        simulationMode={simulationMode}
        onChangeSimulationMode={setSimulationMode}
      />

      {/* 4. PKCE-Safe Pre-Consent Guard Preview */}
      <PreConsentPreview
        report={report}
        activeOAuthUrl={activeOAuthUrl}
        onInspectUrl={handleInspectUrl}
      />
    </div>
  );
}
