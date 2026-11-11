"use client";
import { useState } from "react";
import type { AuditReport, SimulationMode } from "@contracts/index";
import { DominoGraph } from "./DominoGraph";
import { humanizeNodeLabel } from "./uiTokens";
export function Step2AttackPath({
  report,
  simulationMode,
  onChangeSimulationMode,
  onBack,
  onContinue,
}: {
  report: AuditReport;
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
        <h1 tabIndex={-1} className="text-2xl font-semibold">
          Understand possible exposure
        </h1>
        <p className="muted mt-2 max-w-[75ch]">
          {hasExposure
            ? "Follow one conditional chain from the supplied input. Each link depends on real permissions, resource contents and credential validity."
            : "No downstream exposure is modeled for this input. The catalog is limited, so this does not prove your accounts or project are safe."}
        </p>
      </div>
      <div className="rounded-lg bg-[#f4f6f8] p-4">
        <strong>Possible consequence, not an observed attack</strong>
        <p className="muted mt-2">
          For example, if an app can read a file containing another service’s
          valid API key, that copied key may need separate revocation.
          Disconnecting the original app does not revoke a credential issued by
          another service.
        </p>
      </div>
      {hasExposure && (
        <ol className="space-y-3" aria-label="One possible exposure chain">
          {nodes.map((node, index) => (
            <li
              key={node.id}
              className="flex gap-3 border-b border-[#e8eaec] pb-3"
            >
              <span className="font-mono text-[#1b6c80]">{index + 1}.</span>
              <div>
                <div className="font-medium">{humanizeNodeLabel(node)}</div>
                <p className="muted mt-1 text-[13px]">{node.notes}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
      <details onToggle={(event) => setExpanded(event.currentTarget.open)}>
        <summary className="cursor-pointer font-medium text-[#1b6c80]">
          Explore the full model and technical assumptions
        </summary>
        {expanded && (
          <div className="mt-5 space-y-4">
            <p className="muted text-[13px]">
              Model contains {report.graph.nodes.length} nodes. Node counts are
              not counts of confirmed attacks or distinct exploitable paths.
              Severity {report.summary.max_risk_score}/100 is a rule-based
              rating, not a probability.
            </p>
            <div
              role="group"
              aria-label="Expected outcome preview"
              className="flex flex-wrap gap-2"
            >
              <button
                type="button"
                className="control"
                aria-pressed={simulationMode === "naive_single_revoke"}
                onClick={() => onChangeSimulationMode("naive_single_revoke")}
              >
                Model one-provider cleanup
              </button>
              <button
                type="button"
                className="control"
                aria-pressed={simulationMode === "full_multi_issuer"}
                onClick={() => onChangeSimulationMode("full_multi_issuer")}
              >
                Preview expected outcome
              </button>
            </div>
            <p className="text-[#855306]">
              Simulation only. The full-plan preview assumes every required
              action and verification succeeds. No remediation has been
              performed or verified.
            </p>
            <DominoGraph
              report={report}
              simulationMode={simulationMode}
              onChangeSimulationMode={onChangeSimulationMode}
              hideHeaderToggle
            />
            {report.naive_containment.rfc7009_http_status_returned > 0 && (
              <p className="muted text-[13px]">
                RFC 7009 permits HTTP 200 for invalid tokens; related-token
                revocation depends on provider policy. Google documents
                project-token invalidation with possible propagation delay.
                Independent keys, sessions and copied data require separate
                review. Token lifetimes in this model are illustrative, not
                measured.
              </p>
            )}
          </div>
        )}
      </details>
      <div className="flex flex-wrap justify-between gap-3">
        <button type="button" className="control" onClick={onBack}>
          Back to input
        </button>
        <button
          type="button"
          className="control control-primary"
          onClick={onContinue}
        >
          Review recommended actions
        </button>
      </div>
    </div>
  );
}
