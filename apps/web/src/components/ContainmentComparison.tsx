"use client";

import React, { useState } from "react";
import type { AuditReport, SimulationMode } from "@contracts/index";
import { PROVIDER_LABELS } from "./uiTokens";

interface ContainmentComparisonProps {
  report: AuditReport;
  simulationMode: SimulationMode;
  onChangeSimulationMode: (mode: SimulationMode) => void;
}

export function ContainmentComparison({
  report,
  simulationMode,
  onChangeSimulationMode,
}: ContainmentComparisonProps) {
  const [copiedCmdKey, setCopiedCmdKey] = useState<string | null>(null);

  const naive = report.naive_containment;
  const full = report.full_containment;
  const nodeMap = new Map(report.graph.nodes.map((n) => [n.id, n]));

  const naivePct = Math.round(naive.containment_ratio * 100);
  const fullPct = Math.round(full.containment_ratio * 100);

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCmdKey(key);
      setTimeout(() => {
        setCopiedCmdKey((prev) => (prev === key ? null : prev));
      }, 1500);
    } catch {
      // Clipboard API may be blocked in insecure headless contexts; fail silently.
    }
  };

  return (
    <section
      aria-label="Side-by-Side Containment Comparison"
      className="grid grid-cols-1 gap-4 lg:grid-cols-2"
    >
      {/* LEFT: NAIVE RFC 7009 TRAP */}
      <div
        className={`flex min-w-0 flex-col justify-between rounded-xl border p-4 shadow-lg transition ${
          simulationMode === "naive_single_revoke"
            ? "border-rose-500/70 bg-[#140d18]"
            : "border-slate-800 bg-[#0d1424]"
        }`}
      >
        <div>
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-rose-200">
                  3A. Naive Single Revoke
                </h3>
                <span className="rounded border border-amber-500/50 bg-amber-500/15 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-300">
                  {naive.rfc7009_http_status_returned > 0
                    ? `HTTP ${naive.rfc7009_http_status_returned} OK (TRAP)`
                    : "NON-RFC 7009 (N/A · 0)"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                {naive.rfc7009_http_status_returned > 0
                  ? `Illusion of safety: revoking one token returns HTTP ${naive.rfc7009_http_status_returned}, yet attackers stay inside downstream boundaries.`
                  : "Single-issuer action does not touch separate GitHub/Vercel/OpenAI credentials or residual access tokens."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onChangeSimulationMode("naive_single_revoke")}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                simulationMode === "naive_single_revoke"
                  ? "border-rose-400 bg-rose-600 text-white"
                  : "border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
              }`}
            >
              {simulationMode === "naive_single_revoke"
                ? "Active on Graph"
                : "Show Red Paths"}
            </button>
          </div>

          {/* Metrics Row */}
          <div className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2">
              <div className="text-[10px] uppercase text-slate-400">
                Contained
              </div>
              <div className="font-mono text-base font-bold text-rose-300">
                {naivePct}%
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2">
              <div className="text-[10px] uppercase text-slate-400">
                Persisting Nodes
              </div>
              <div className="font-mono text-base font-bold text-rose-400">
                {naive.persisting_node_ids.length}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2">
              <div className="text-[10px] uppercase text-slate-400">
                Residual JWT TTL
              </div>
              <div className="font-mono text-base font-bold text-amber-300">
                {naive.jwt_residual_ttl_seconds}s
              </div>
            </div>
          </div>

          {/* RFC 7009 Trap Warning */}
          <div className="mb-3 rounded-lg border border-rose-500/40 bg-rose-950/30 p-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-rose-300">
              {naive.rfc7009_http_status_returned > 0
                ? `Why HTTP ${naive.rfc7009_http_status_returned} Does Not Equal Containment`
                : "Why Single-Grant Revocation Leaves Attackers Active"}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-rose-100/90">
              {naive.rfc7009_trap_warning}
            </p>
          </div>

          {/* Persisting Blast Nodes */}
          <div className="mb-3">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Surviving Attacker Paths ({naive.persisting_node_ids.length})
            </div>
            {naive.persisting_node_ids.length === 0 ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5 text-xs text-emerald-300">
                No downstream persistence detected for this minimal scope set.
              </div>
            ) : (
              <div className="space-y-1.5">
                {naive.persisting_node_ids.map((id) => {
                  const node = nodeMap.get(id);
                  return (
                    <div
                      key={id}
                      className="flex items-start justify-between gap-2 rounded-lg border border-rose-500/30 bg-rose-950/20 px-2.5 py-2"
                    >
                      <div>
                        <div className="text-xs font-semibold text-rose-200">
                          {node?.label ?? id}
                        </div>
                        {node?.notes && (
                          <div className="mt-0.5 text-[11px] text-rose-200/75">
                            {node.notes}
                          </div>
                        )}
                      </div>
                      {node && (
                        <span className="shrink-0 rounded bg-rose-500/20 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-rose-300">
                          {PROVIDER_LABELS[node.provider]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Single Naive Step Attempted */}
        {naive.ordered_steps[0] && (
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2.5">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Single Action Executed in Naive Response
            </div>
            <div className="mt-1 break-all font-mono text-xs text-slate-200">
              {naive.ordered_steps[0].command_or_endpoint}
            </div>
            <div className="mt-1 text-[11px] text-amber-300/90">
              Gap: {naive.ordered_steps[0].why_naive_fails}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: FULL MULTI-ISSUER CONTAINMENT PLAN */}
      <div
        className={`flex min-w-0 flex-col justify-between rounded-xl border p-4 shadow-lg transition ${
          simulationMode === "full_multi_issuer"
            ? "border-emerald-500/70 bg-[#0b1815]"
            : "border-slate-800 bg-[#0d1424]"
        }`}
      >
        <div>
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-200">
                  3B. Full Multi-Issuer Containment Plan
                </h3>
                <span className="rounded border border-emerald-500/50 bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
                  {fullPct}% VERIFIED
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                Priority-ordered remediation across every issuer with API
                rejection probes beyond HTTP 200 (zero destructive live calls).
              </p>
            </div>

            <button
              type="button"
              onClick={() => onChangeSimulationMode("full_multi_issuer")}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                simulationMode === "full_multi_issuer"
                  ? "border-emerald-400 bg-emerald-600 text-white"
                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
              }`}
            >
              {simulationMode === "full_multi_issuer"
                ? "Active on Graph"
                : "Apply Full Plan"}
            </button>
          </div>

          <div className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2">
              <div className="text-[10px] uppercase text-slate-400">
                Contained
              </div>
              <div className="font-mono text-base font-bold text-emerald-300">
                {fullPct}%
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2">
              <div className="text-[10px] uppercase text-slate-400">
                Issuer Steps
              </div>
              <div className="font-mono text-base font-bold text-emerald-300">
                {full.ordered_steps.length}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2">
              <div className="text-[10px] uppercase text-slate-400">
                Persisting Paths
              </div>
              <div className="font-mono text-base font-bold text-emerald-400">
                {full.persisting_node_ids.length}
              </div>
            </div>
          </div>

          {/* Ordered Multi-Issuer Steps */}
          <div className="space-y-2.5">
            {full.ordered_steps.map((step) => {
              const copyKey = `step-${step.priority}-${step.issuer}`;
              const copied = copiedCmdKey === copyKey;
              return (
                <div
                  key={copyKey}
                  className="rounded-lg border border-slate-800 bg-slate-950/80 p-3"
                >
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                        P{step.priority}
                      </span>
                      <span className="text-xs font-semibold text-slate-100">
                        {step.issuer}
                      </span>
                      <span className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                        {step.action_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(copyKey, step.command_or_endpoint)
                        }
                        className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-300 hover:border-slate-500 hover:text-white"
                      >
                        {copied ? "Copied!" : "Copy Payload"}
                      </button>
                      {step.console_url && (
                        <a
                          href={step.console_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-300 hover:bg-sky-500/20"
                        >
                          Console ↗
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Target:{" "}
                    <span className="break-all text-slate-200">
                      {nodeMap.get(step.target_resource)?.label ??
                        step.target_resource}
                    </span>
                  </div>

                  <div className="mt-1.5 overflow-x-auto rounded border border-slate-800 bg-[#070b14] px-2.5 py-1.5 font-mono text-[11px] break-words text-emerald-300">
                    {step.command_or_endpoint}
                  </div>

                  <div className="mt-1.5 text-[11px] text-slate-400">
                    <span className="font-semibold text-emerald-300">
                      Verification probe:
                    </span>{" "}
                    <span className="break-words font-mono text-slate-200">
                      {step.verification_probe}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
