"use client";
import { useState, type ReactNode } from "react";
import type { AuditReport, SimulationMode } from "@contracts/index";
import { DominoGraph } from "./DominoGraph";
import { humanizeNodeLabel } from "./uiTokens";
import { AgentSwarmCenter } from "./AgentSwarmCenter";

export function Step2AttackPath({
  report,
  guidance,
  simulationMode,
  onChangeSimulationMode,
  onBack,
  onContinue,
}: {
  report: AuditReport;
  guidance?: ReactNode;
  simulationMode: SimulationMode;
  onChangeSimulationMode: (mode: SimulationMode) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  // Show one connected chain, never imply unrelated branches are a proven sequence.
  const longest = [...report.graph.edges].sort((a, b) => b.hop - a.hop)[0];
  const chain: string[] = longest ? [longest.target] : [];
  let cursor: string | undefined = longest?.source;
  const visited = new Set(chain);
  while (cursor && !visited.has(cursor)) {
    chain.unshift(cursor);
    visited.add(cursor);
    cursor = report.graph.edges.find((edge) => edge.target === cursor)?.source;
  }
  const nodes = chain
    .map((id) => report.graph.nodes.find((node) => node.id === id))
    .filter((node) => !!node);
  const hasExposure = report.naive_containment.persisting_node_ids.length > 0;
  return (
    <div className="space-y-6">
      <div>
        <h1 tabIndex={-1} className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
          Understand possible exposure
        </h1>
        <p className="mt-1.5 max-w-[75ch] text-xs sm:text-sm text-slate-400 font-normal leading-relaxed">
          {hasExposure
            ? "Follow one conditional chain from the supplied input. Each link depends on real permissions, resource contents and credential validity."
            : "No downstream exposure is modeled for this input. The catalog is limited, so this does not prove your accounts or project are safe."}
        </p>
      </div>

      {guidance}

      <div className="rounded-2xl border border-white/10 bg-[#12141c] p-5 shadow-xl shadow-black/30">
        <strong className="text-sm font-semibold text-white">Possible consequence, not an observed attack</strong>
        <p className="mt-1.5 text-xs text-slate-400 leading-relaxed font-normal">
          For example, if an app can read a file containing another service’s
          valid API key, that copied key may need separate revocation.
          Disconnecting the original app does not revoke a credential issued by
          another service.
        </p>
      </div>

      {hasExposure && (
        <ol className="exposure-chain" aria-label="One possible exposure chain" data-guide-target="exposure" tabIndex={-1}>
          {nodes.map((node, index) => (
            <li
              key={node.id}
              className="exposure-link"
            >
              <span className="exposure-number" aria-hidden="true">{index + 1}</span>
              <div className="rounded-xl border border-white/5 bg-[#181b24] p-4 shadow-sm">
                <div className="text-sm font-semibold text-white">{humanizeNodeLabel(node)}</div>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed font-normal">{node.notes}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {/* Hero Domino Blast Radius Graph */}
      <div className="rounded-2xl border border-white/10 bg-[#0e1017] shadow-2xl shadow-black/50 overflow-hidden">
        <DominoGraph
          report={report}
          simulationMode={simulationMode}
          onChangeSimulationMode={onChangeSimulationMode}
        />
      </div>

      <details className="rounded-2xl border border-white/10 bg-[#12141c] p-5 shadow-xl shadow-black/30" onToggle={(event) => setExpanded(event.currentTarget.open)}>
        <summary className="cursor-pointer text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors">
          View RFC 7009 protocol specifications and model assumptions
        </summary>
        <div className="mt-3.5 space-y-2 text-xs text-slate-400 leading-relaxed font-normal">
          <p>
            Model contains <span className="font-mono text-teal-300">{report.graph.nodes.length}</span> nodes across <span className="font-mono text-teal-300">{report.summary.trust_boundary_crossings.length}</span> trust boundaries.
            Severity rating <span className="font-mono text-rose-300">{report.summary.max_risk_score}/100</span> is rule-based.
          </p>
          {report.naive_containment.rfc7009_http_status_returned > 0 && (
            <p>
              RFC 7009 permits HTTP 200 for invalid tokens; downstream token cascading is only a SHOULD recommendation in the RFC.
              Google project-level revocation may carry propagation delays.
            </p>
          )}
        </div>
      </details>

      {/* Autonomous Defensive Agent Swarm */}
      <AgentSwarmCenter report={report} />

      <div className="flex flex-wrap justify-between gap-3 pt-4">
        <button
          type="button"
          className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs sm:text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          onClick={onBack}
        >
          Back to input
        </button>
        <button
          type="button"
          className="rounded-full bg-white text-slate-950 font-semibold px-5 py-2 text-xs sm:text-sm hover:bg-slate-200 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          onClick={onContinue}
        >
          Review recommended actions
        </button>
      </div>
    </div>
  );
}
