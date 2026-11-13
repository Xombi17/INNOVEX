"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  CaretDown,
  CaretRight,
  CheckCircle,
  WarningCircle,
} from "@phosphor-icons/react";
import type {
  AuditReport,
  BlastEdge,
  BlastNode,
  SimulationMode,
  TrustBoundary,
} from "@contracts/index";
import {
  PROVIDER_LABELS,
  SEVERITY_META,
  TRUST_BOUNDARY_META,
  humanizeNodeLabel,
} from "./uiTokens";

interface DominoGraphProps {
  report: AuditReport;
  simulationMode: SimulationMode;
  onChangeSimulationMode: (mode: SimulationMode) => void;
  hideHeaderToggle?: boolean;
}

const STAGE_TITLES = [
  { stage: 0, title: "1. Entry grant", hint: "Initial app or local config" },
  {
    stage: 1,
    title: "2. Permissions & keys",
    hint: "Scopes approved or tokens leaked",
  },
  {
    stage: 2,
    title: "3. Direct blast",
    hint: "Exposed mailboxes, repos & persistence",
  },
  {
    stage: 3,
    title: "4. Downstream chain",
    hint: "Cross-issuer takeovers & APIs",
  },
] as const;

function computeStageIndex(
  node: BlastNode,
  edges: BlastEdge[],
): 0 | 1 | 2 | 3 {
  if (
    node.kind === "human_identity" ||
    node.kind === "oauth_app" ||
    node.kind === "shadow_ai_tool" ||
    node.kind === "mcp_server"
  ) {
    return 0;
  }
  if (
    node.kind === "scope" ||
    (node.id.startsWith("secret:") && !node.id.includes("resource"))
  ) {
    return 1;
  }
  const incoming = edges.filter((e) => e.target === node.id);
  const maxHop = incoming.reduce((acc, e) => Math.max(acc, e.hop), 0);
  if (
    maxHop >= 4 ||
    node.id.includes(":platform") ||
    node.id.includes(":session") ||
    node.id.includes(":copied_credential") ||
    node.id.includes(":secondary_secret")
  ) {
    return 3;
  }
  return 2;
}

export function DominoGraph({
  report,
  simulationMode,
  onChangeSimulationMode,
  hideHeaderToggle = false,
}: DominoGraphProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightedBoundary, setHighlightedBoundary] =
    useState<TrustBoundary | null>(null);
  const [showAllNodes, setShowAllNodes] = useState(false);
  const [detonating, setDetonating] = useState(false);
  const [detonationStage, setDetonationStage] = useState<number | null>(null);
  const [detonationDone, setDetonationDone] = useState(false);

  const outcome =
    simulationMode === "naive_single_revoke"
      ? report.naive_containment
      : report.full_containment;

  const persistingNodeSet = useMemo(
    () => new Set(outcome.persisting_node_ids),
    [outcome.persisting_node_ids],
  );
  const containedNodeSet = useMemo(
    () => new Set(outcome.contained_node_ids),
    [outcome.contained_node_ids],
  );

  const isNaive = simulationMode === "naive_single_revoke";
  const persistingCount = outcome.persisting_node_ids.length;
  const containedCount = outcome.contained_node_ids.length;

  const stageBuckets = useMemo(() => {
    const buckets: BlastNode[][] = [[], [], [], []];
    for (const node of report.graph.nodes) {
      const idx = computeStageIndex(node, report.graph.edges);
      buckets[idx].push(node);
    }
    for (const list of buckets) {
      list.sort((a, b) => {
        const aPersist = persistingNodeSet.has(a.id) ? 1 : 0;
        const bPersist = persistingNodeSet.has(b.id) ? 1 : 0;
        if (aPersist !== bPersist) return bPersist - aPersist;
        return b.risk_score - a.risk_score;
      });
    }
    return buckets;
  }, [report.graph.nodes, report.graph.edges, persistingNodeSet]);

  const detonateSimulation = () => {
    if (detonating) return;
    setDetonating(true);
    setDetonationDone(false);
    setSelectedNodeId(null);
    onChangeSimulationMode("naive_single_revoke");

    let current = 0;
    setDetonationStage(0);
    const firstNode = stageBuckets[0]?.[0];
    if (firstNode) setSelectedNodeId(firstNode.id);

    const interval = setInterval(() => {
      current += 1;
      if (current <= 3) {
        setDetonationStage(current);
        const node = stageBuckets[current]?.[0];
        if (node) setSelectedNodeId(node.id);
      } else {
        clearInterval(interval);
        setDetonating(false);
        setDetonationDone(true);
        setDetonationStage(null);
        const deepestPersisting =
          report.graph.nodes.find((n) => persistingNodeSet.has(n.id)) ??
          stageBuckets[3]?.[0];
        if (deepestPersisting) setSelectedNodeId(deepestPersisting.id);
      }
    }, 700);
  };

  const activeNode: BlastNode | null = useMemo(() => {
    if (selectedNodeId) {
      return (
        report.graph.nodes.find((n) => n.id === selectedNodeId) ??
        report.graph.nodes[0] ??
        null
      );
    }
    return (
      report.graph.nodes.find((n) => persistingNodeSet.has(n.id)) ??
      report.graph.nodes[0] ??
      null
    );
  }, [selectedNodeId, report.graph.nodes, persistingNodeSet]);

  const activeNodeIncoming = useMemo(() => {
    if (!activeNode) return [];
    return report.graph.edges.filter((e) => e.target === activeNode.id);
  }, [activeNode, report.graph.edges]);

  const VISIBLE_PER_STAGE = 5;

  return (
    <section
      aria-label="Blast-radius domino escalation map"
      className="border-t border-[#1e2636] px-5 pb-6 pt-6"
    >
      {/* Header row */}
      <div className="flex flex-col justify-between gap-3 pb-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-[16px] font-semibold leading-[1.4] text-white">
              Full conditional exposure model
            </h2>
            <span
              className="inline-flex h-6 items-center rounded-full px-2.5 text-[13px] font-medium tabular-nums"
              style={{
                backgroundColor:
                  isNaive && persistingCount > 0 ? "rgba(244, 63, 94, 0.18)" : "rgba(16, 185, 129, 0.18)",
                color:
                  isNaive && persistingCount > 0 ? "#fda4af" : "#6ee7b7",
              }}
            >
              {isNaive
                ? persistingCount > 0
                  ? `${persistingCount} modeled nodes may need review`
                  : "No downstream exposure modeled"
                : `${containedCount} modeled nodes: projected cleanup only`}
            </span>
          </div>
          <p className="mt-1 text-[14px] leading-[1.5] text-slate-400">
            Explore conditional consequences across
            trust boundaries. Select a node to inspect its assumptions. No account activity is measured.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={detonating}
            onClick={detonateSimulation}
            className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-rose-500/50 bg-rose-500/15 px-3 text-[13px] font-semibold text-rose-300 shadow-sm transition hover:bg-rose-500/25 hover:border-rose-400 disabled:opacity-60"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
            {detonating
              ? `Detonating Hop ${(detonationStage ?? 0) + 1}/4…`
              : "Detonate Attack Simulation"}
          </button>

          {!hideHeaderToggle && (
            <div
              className="inline-flex items-center gap-1.5"
              role="group"
              aria-label="Containment simulation toggle"
            >
              <button
                type="button"
                onClick={() => onChangeSimulationMode("naive_single_revoke")}
                className={`h-8 rounded-[6px] border px-3 text-[13px] font-medium transition ${
                  isNaive
                    ? "border-teal-500 bg-teal-500 text-[#03211b] font-semibold shadow-sm shadow-teal-500/20"
                    : "border-[#2b3548] bg-[#141924] text-slate-300 hover:text-white hover:border-slate-600"
                }`}
              >
                Naive single revoke
              </button>
              <button
                type="button"
                onClick={() => onChangeSimulationMode("full_multi_issuer")}
                className={`h-8 rounded-[6px] border px-3 text-[13px] font-medium transition ${
                  !isNaive
                    ? "border-emerald-500 bg-emerald-500 text-[#04250e] font-semibold shadow-sm shadow-emerald-500/20"
                    : "border-[#2b3548] bg-[#141924] text-slate-300 hover:text-white hover:border-slate-600"
                }`}
              >
                Full multi-issuer plan
              </button>
            </div>
          )}

          {report.graph.nodes.length > 14 && (
            <button
              type="button"
              onClick={() => setShowAllNodes((v) => !v)}
              className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-[#2b3548] bg-[#141924] px-3 text-[13px] font-medium text-slate-200 transition hover:bg-[#1b2332]"
            >
              {showAllNodes ? (
                <>
                  <CaretDown size={14} />
                  Compact view
                </>
              ) : (
                <>
                  <CaretRight size={14} />
                  Show all {report.graph.nodes.length} nodes
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Boundary Filter Strip */}
      <div className="flex flex-wrap items-center gap-2 border-y border-[#1e2636] py-2.5">
        <span className="text-[13px] font-medium text-slate-400">
          Trust boundaries crossed:
        </span>
        {report.summary.trust_boundary_crossings.map((tb) => {
          const meta = TRUST_BOUNDARY_META[tb];
          const active = highlightedBoundary === tb;
          return (
            <button
              key={tb}
              type="button"
              onClick={() => setHighlightedBoundary(active ? null : tb)}
              className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium transition"
              style={{
                backgroundColor: active ? "#ffffff" : meta.tagBg,
                color: active ? "#000000" : meta.tagInk,
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: active ? "#000000" : meta.colorHex,
                }}
              />
              {meta.label}
            </button>
          );
        })}
        {highlightedBoundary && (
          <button
            type="button"
            onClick={() => setHighlightedBoundary(null)}
            className="ml-1 text-[13px] font-medium text-teal-400 hover:underline"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* Detonation Banner */}
      {detonationDone && (
        <div className="my-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <span className="font-bold text-rose-400">💥 DETONATION COMPLETE:</span>
            <span>Attacker leaped trust boundaries from initial OAuth grant into cloud infrastructure in 4 hops.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-rose-300">
              Under standard disconnect: <strong>{persistingCount} tokens survive</strong>
            </span>
            <button
              type="button"
              onClick={() => onChangeSimulationMode("full_multi_issuer")}
              className="rounded bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/30"
            >
              Test Surgical Containment ➔
            </button>
          </div>
        </div>
      )}

      {/* 4-Stage Escalation Transit Columns */}
      {report.graph.nodes.length === 0 ? (
        <div className="py-12 text-center text-[14px] leading-[1.5] text-slate-400">
          No escalation chain built for this input. Choose an incident on the
          left or paste an OAuth authorize URL.
        </div>
      ) : (
        <div className="pt-5">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 xl:gap-5">
            {STAGE_TITLES.map(({ stage, title, hint }, colIdx) => {
              const allStageNodes = stageBuckets[stage] ?? [];
              const visibleNodes = showAllNodes
                ? allStageNodes
                : allStageNodes.slice(0, VISIBLE_PER_STAGE);
              const hiddenCount = Math.max(
                0,
                allStageNodes.length - visibleNodes.length,
              );
              const stagePersisting = allStageNodes.filter(
                (n) =>
                  isNaive &&
                  (persistingNodeSet.has(n.id) || n.survives_naive_revoke),
              ).length;

              return (
                <div
                  key={stage}
                  className={`relative flex min-w-0 flex-col rounded-lg p-2 transition-all duration-300 xl:border-l xl:border-[#1e2636] xl:pl-4 xl:first:border-l-0 xl:first:pl-0 ${
                    detonationStage === stage
                      ? "ring-2 ring-rose-500 bg-rose-500/[0.08] shadow-lg shadow-rose-500/20"
                      : ""
                  }`}
                >
                  {/* Stage Column Header */}
                  <div className="mb-2.5 flex items-baseline justify-between gap-2 border-b border-[#1e2636] pb-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-[14px] font-semibold leading-[1.4] text-white">
                        <span>{title}</span>
                        {detonationStage === stage && (
                          <span className="rounded bg-rose-500 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white animate-pulse">
                            BREACH
                          </span>
                        )}
                      </div>
                      <div className="text-[13px] leading-[1.4] text-slate-400">
                        {hint}
                      </div>
                    </div>
                    <span className="shrink-0 text-[13px] font-medium text-slate-400 tabular-nums">
                      {stagePersisting > 0 && isNaive
                        ? `${stagePersisting} modeled`
                        : `${allStageNodes.length}`}
                    </span>
                  </div>

                  {/* Connector arrow between column headers on desktop */}
                  {colIdx < 3 && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-4 top-2.5 hidden text-slate-600 xl:block"
                    >
                      <ArrowRight size={14} weight="bold" />
                    </div>
                  )}

                  {/* Stage Node Rows */}
                  {allStageNodes.length === 0 ? (
                    <div className="py-3 text-[13px] leading-[1.45] text-slate-400">
                      {report.summary.max_hops <= 3 && stage === 3
                        ? "Chain stays inside 3 hops."
                        : "Chain terminates before this hop."}
                    </div>
                  ) : (
                    <div className="divide-y divide-[#182030]">
                      {visibleNodes.map((node) => {
                        const isPersisting =
                          isNaive &&
                          (persistingNodeSet.has(node.id) ||
                            node.survives_naive_revoke);
                        const isContained =
                          !isNaive || containedNodeSet.has(node.id);
                        const isSelected = activeNode?.id === node.id;
                        const dimmed =
                          highlightedBoundary !== null &&
                          node.trust_boundary !== highlightedBoundary;
                        const tbMeta = TRUST_BOUNDARY_META[node.trust_boundary];

                        return (
                          <button
                            key={node.id}
                            type="button"
                            onClick={() => setSelectedNodeId(node.id)}
                            className={`w-full py-2.5 px-2 text-left transition hover:bg-[#141a28] rounded-md ${
                              isSelected ? "bg-[#162030] border-l-2 border-teal-400" : ""
                            } ${dimmed ? "opacity-30" : "opacity-100"}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span
                                className={`text-[14px] leading-[1.4] ${
                                  isSelected
                                    ? "font-semibold text-teal-300"
                                    : "font-medium text-slate-200"
                                }`}
                              >
                                {humanizeNodeLabel(node)}
                              </span>
                              <span className="mt-0.5 shrink-0">
                                {isPersisting ? (
                                  <WarningCircle
                                    size={16}
                                    weight="fill"
                                    className="text-rose-400"
                                  />
                                ) : isContained ? (
                                  <CheckCircle
                                    size={16}
                                    weight="fill"
                                    className="text-emerald-400"
                                  />
                                ) : null}
                              </span>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[13px] leading-[1.4]">
                              <span className="text-slate-400">
                                {PROVIDER_LABELS[node.provider]} · {tbMeta.short}
                              </span>
                              <span
                                className="font-medium tabular-nums"
                                style={{
                                  color: isPersisting
                                    ? "#fda4af"
                                    : !isNaive
                                      ? "#6ee7b7"
                                      : "#94a3b8",
                                }}
                              >
                                {isPersisting
                                  ? "Review needed"
                                  : !isNaive
                                    ? "Projected cleanup"
                                    : node.kind === "human_identity"
                                      ? "Origin"
                                      : "Modeled revoked"}
                              </span>
                            </div>
                          </button>
                        );
                      })}

                      {hiddenCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAllNodes(true)}
                          className="w-full py-2.5 text-left text-[13px] font-medium text-teal-400 hover:underline"
                        >
                          Show {hiddenCount} additional target
                          {hiddenCount === 1 ? "" : "s"} in stage {stage + 1}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Step Forensic Inspector */}
      {activeNode && (
        <div className="mt-5 border-t border-[#1e2636] pt-4">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div className="max-w-[74ch]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-semibold leading-[1.4] text-white">
                  Selected node: {humanizeNodeLabel(activeNode)}
                </span>
                <span
                  className="inline-flex h-6 items-center rounded-full px-2.5 text-[13px] font-medium"
                  style={{
                    backgroundColor: SEVERITY_META[activeNode.severity].bg,
                    color: SEVERITY_META[activeNode.severity].ink,
                  }}
                >
                  {SEVERITY_META[activeNode.severity].label} ({activeNode.risk_score}/100)
                </span>
                <span
                  className="inline-flex h-6 items-center rounded-full px-2.5 text-[13px] font-medium"
                  style={{
                    backgroundColor:
                      TRUST_BOUNDARY_META[activeNode.trust_boundary].tagBg,
                    color: TRUST_BOUNDARY_META[activeNode.trust_boundary].tagInk,
                  }}
                >
                  {TRUST_BOUNDARY_META[activeNode.trust_boundary].label}
                </span>
              </div>
              <p className="mt-1.5 text-[14px] leading-[1.5] text-slate-300">
                {activeNode.notes}
              </p>
              {activeNodeIncoming.length > 0 && (
                <div className="mt-1.5 text-[13px] leading-[1.45] text-slate-400">
                  Escalation trigger:{" "}
                  <span className="font-medium text-white">
                    {activeNodeIncoming[0].mechanism}
                  </span>
                </div>
              )}
            </div>

            <div className="shrink-0 font-mono text-[12px] text-slate-400">
              Raw key: <code className="rounded bg-[#141924] px-1.5 py-0.5 text-slate-300">{activeNode.label}</code>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
