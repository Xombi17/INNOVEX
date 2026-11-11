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
      className="border-t border-[#e8eaec] px-5 pb-6 pt-6"
    >
      {/* Header row */}
      <div className="flex flex-col justify-between gap-3 pb-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-[16px] font-semibold leading-[1.4] text-[#131416]">
              Cross-issuer escalation domino map
            </h2>
            <span
              className="inline-flex h-6 items-center rounded-full px-2.5 text-[13px] font-medium tabular-nums"
              style={{
                backgroundColor:
                  isNaive && persistingCount > 0 ? "#ffedea" : "#dcfae5",
                color:
                  isNaive && persistingCount > 0 ? "#831c1e" : "#04250e",
              }}
            >
              {isNaive
                ? persistingCount > 0
                  ? `${persistingCount} path${persistingCount === 1 ? "" : "s"} persist after HTTP ${outcome.rfc7009_http_status_returned || "0"}`
                  : "No persisting paths"
                : `${containedCount} of ${containedCount + persistingCount} paths contained`}
            </span>
          </div>
          <p className="mt-1 text-[14px] leading-[1.5] text-[#5d5f60]">
            Follow left to right how a single login or secret propagates across
            trust boundaries. Select any node to inspect why single revoke misses it.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
                    ? "border-[#131416] bg-[#131416] text-[#ffffff]"
                    : "border-[#cdced1] bg-[#ffffff] text-[#5d5f60] hover:text-[#131416]"
                }`}
              >
                Naive single revoke
              </button>
              <button
                type="button"
                onClick={() => onChangeSimulationMode("full_multi_issuer")}
                className={`h-8 rounded-[6px] border px-3 text-[13px] font-medium transition ${
                  !isNaive
                    ? "border-[#1e7b4f] bg-[#1e7b4f] text-[#ffffff]"
                    : "border-[#cdced1] bg-[#ffffff] text-[#5d5f60] hover:text-[#131416]"
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
              className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-[#cdced1] bg-[#ffffff] px-3 text-[13px] font-medium text-[#131416] transition hover:bg-[#f4f6f8]"
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

      {/* Boundary Filter Strip (unboxed horizontal rule band) */}
      <div className="flex flex-wrap items-center gap-2 border-y border-[#f0f1f2] py-2.5">
        <span className="text-[13px] font-medium text-[#5d5f60]">
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
                backgroundColor: active ? "#131416" : meta.tagBg,
                color: active ? "#ffffff" : meta.tagInk,
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: active ? "#ffffff" : meta.colorHex,
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
            className="ml-1 text-[13px] font-medium text-[#1b6c80] hover:underline"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* 4-Stage Escalation Transit Columns (unboxed horizontal flow with vertical stage dividers) */}
      {report.graph.nodes.length === 0 ? (
        <div className="py-12 text-center text-[14px] leading-[1.5] text-[#5d5f60]">
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
                  className="relative flex min-w-0 flex-col xl:border-l xl:border-[#f0f1f2] xl:pl-4 xl:first:border-l-0 xl:first:pl-0"
                >
                  {/* Stage Column Header */}
                  <div className="mb-2.5 flex items-baseline justify-between gap-2 border-b border-[#e8eaec] pb-2">
                    <div>
                      <div className="text-[14px] font-semibold leading-[1.4] text-[#131416]">
                        {title}
                      </div>
                      <div className="text-[13px] leading-[1.4] text-[#5d5f60]">
                        {hint}
                      </div>
                    </div>
                    <span className="shrink-0 text-[13px] font-medium text-[#5d5f60] tabular-nums">
                      {stagePersisting > 0 && isNaive
                        ? `${stagePersisting} live`
                        : `${allStageNodes.length}`}
                    </span>
                  </div>

                  {/* Connector arrow between column headers on desktop */}
                  {colIdx < 3 && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-4 top-2.5 hidden text-[#9ca3af] xl:block"
                    >
                      <ArrowRight size={14} weight="bold" />
                    </div>
                  )}

                  {/* Stage Node Rows (clean hairline rows with inline semantic status) */}
                  {allStageNodes.length === 0 ? (
                    <div className="py-3 text-[13px] leading-[1.45] text-[#5d5f60]">
                      {report.summary.max_hops <= 3 && stage === 3
                        ? "Chain stays inside 3 hops."
                        : "Chain terminates before this hop."}
                    </div>
                  ) : (
                    <div className="divide-y divide-[#f0f1f2]">
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
                            className={`w-full py-2.5 px-2 text-left transition hover:bg-[#f9fbfc] ${
                              isSelected ? "bg-[#f4f6f8]" : ""
                            } ${dimmed ? "opacity-35" : "opacity-100"}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span
                                className={`text-[14px] leading-[1.4] ${
                                  isSelected
                                    ? "font-semibold text-[#1b6c80]"
                                    : "font-medium text-[#131416]"
                                }`}
                              >
                                {humanizeNodeLabel(node)}
                              </span>
                              <span className="mt-0.5 shrink-0">
                                {isPersisting ? (
                                  <WarningCircle
                                    size={16}
                                    weight="fill"
                                    className="text-[#c4242a]"
                                  />
                                ) : isContained ? (
                                  <CheckCircle
                                    size={16}
                                    weight="fill"
                                    className="text-[#1e7b4f]"
                                  />
                                ) : null}
                              </span>
                            </div>

                            <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[13px] leading-[1.4]">
                              <span className="text-[#5d5f60]">
                                {PROVIDER_LABELS[node.provider]} · {tbMeta.short}
                              </span>
                              <span
                                className="font-medium tabular-nums"
                                style={{
                                  color: isPersisting
                                    ? "#831c1e"
                                    : !isNaive
                                      ? "#04250e"
                                      : "#5d5f60",
                                }}
                              >
                                {isPersisting
                                  ? "Persists"
                                  : !isNaive
                                    ? "Contained"
                                    : node.kind === "human_identity"
                                      ? "Origin"
                                      : "Revoked"}
                              </span>
                            </div>
                          </button>
                        );
                      })}

                      {hiddenCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAllNodes(true)}
                          className="w-full py-2.5 text-left text-[13px] font-medium text-[#1b6c80] hover:underline"
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

      {/* Selected Step Forensic Inspector (clean top hairline, zero side tab or boxed card) */}
      {activeNode && (
        <div className="mt-5 border-t border-[#e8eaec] pt-4">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div className="max-w-[74ch]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-semibold leading-[1.4] text-[#131416]">
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
              <p className="mt-1.5 text-[14px] leading-[1.5] text-[#5d5f60]">
                {activeNode.notes}
              </p>
              {activeNodeIncoming.length > 0 && (
                <div className="mt-1.5 text-[13px] leading-[1.45] text-[#5d5f60]">
                  Escalation trigger:{" "}
                  <span className="font-medium text-[#131416]">
                    {activeNodeIncoming[0].mechanism}
                  </span>
                </div>
              )}
            </div>

            <div className="shrink-0 text-[13px] text-[#5d5f60]">
              Raw key: <code>{activeNode.label}</code>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
