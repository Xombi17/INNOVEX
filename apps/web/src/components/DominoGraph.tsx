"use client";

import React, { useMemo, useState } from "react";
import type {
  AuditReport,
  BlastEdge,
  BlastNode,
  SimulationMode,
  TrustBoundary,
} from "@contracts/index";
import { PROVIDER_LABELS, SEVERITY_META, TRUST_BOUNDARY_META } from "./uiTokens";

interface DominoGraphProps {
  report: AuditReport;
  simulationMode: SimulationMode;
  onChangeSimulationMode: (mode: SimulationMode) => void;
}

interface PositionedNode {
  node: BlastNode;
  col: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

function wrapLabel(text: string, maxCharsPerLine = 26): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxCharsPerLine) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === 2) break;
    }
  }
  if (current && lines.length < 2) {
    lines.push(current);
  }
  if (lines.length === 2 && words.join(" ").length > lines.join(" ").length) {
    lines[1] = `${lines[1].slice(0, Math.max(0, maxCharsPerLine - 3))}...`;
  }
  return lines;
}

export function DominoGraph({
  report,
  simulationMode,
  onChangeSimulationMode,
}: DominoGraphProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [highlightedBoundary, setHighlightedBoundary] =
    useState<TrustBoundary | null>(null);

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
  const persistingEdgeSet = useMemo(
    () => new Set(outcome.persisting_edge_ids),
    [outcome.persisting_edge_ids],
  );

  // Compute deterministic collision-free topological layout by Hop depth
  const layout = useMemo(() => {
    const nodes = report.graph.nodes;
    const edges = report.graph.edges;
    const depthMap = new Map<string, number>();
    const inDegree = new Map<string, number>();

    for (const n of nodes) {
      depthMap.set(n.id, 0);
      inDegree.set(n.id, 0);
    }
    for (const e of edges) {
      inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
    }

    // Relax edges up to nodes.length times (safe for arbitrary DAGs)
    for (let pass = 0; pass < nodes.length; pass++) {
      let changed = false;
      for (const e of edges) {
        const srcD = depthMap.get(e.source) ?? 0;
        const dstD = depthMap.get(e.target) ?? 0;
        const nextD = Math.max(srcD + 1, e.hop);
        if (nextD > dstD) {
          depthMap.set(e.target, Math.min(nextD, nodes.length + 1));
          changed = true;
        }
      }
      if (!changed) break;
    }

    const columns = new Map<number, BlastNode[]>();
    let maxCol = 0;
    for (const n of nodes) {
      const col = depthMap.get(n.id) ?? 0;
      maxCol = Math.max(maxCol, col);
      const list = columns.get(col) ?? [];
      list.push(n);
      columns.set(col, list);
    }

    const nodeW = 216;
    const nodeH = 96;
    const colGap = 68;
    const rowGap = 36;
    const padX = 28;
    const padY = 28;

    const maxRows = Math.max(
      1,
      ...Array.from(columns.values()).map((list) => list.length),
    );
    const totalCols = Math.max(1, maxCol + 1);
    const svgWidth = Math.max(
      980,
      padX * 2 + totalCols * nodeW + Math.max(0, totalCols - 1) * colGap,
    );
    const svgHeight = Math.max(
      270,
      padY * 2 + maxRows * nodeH + Math.max(0, maxRows - 1) * rowGap,
    );

    const positioned = new Map<string, PositionedNode>();
    const colSpan =
      totalCols > 1
        ? (svgWidth - padX * 2 - nodeW) / (totalCols - 1)
        : 0;

    for (const [col, list] of columns.entries()) {
      const colHeight =
        list.length * nodeH + Math.max(0, list.length - 1) * rowGap;
      const startY = (svgHeight - colHeight) / 2;
      const x =
        totalCols === 1 ? (svgWidth - nodeW) / 2 : padX + col * colSpan;

      list.forEach((node, idx) => {
        const y = startY + idx * (nodeH + rowGap);
        positioned.set(node.id, { node, col, x, y, w: nodeW, h: nodeH });
      });
    }

    return { positioned, svgWidth, svgHeight };
  }, [report.graph.nodes, report.graph.edges]);

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
      report.graph.nodes[report.graph.nodes.length - 1] ??
      null
    );
  }, [selectedNodeId, report.graph.nodes, persistingNodeSet]);

  const activeEdge: BlastEdge | null = useMemo(() => {
    if (!selectedEdgeId) return null;
    return report.graph.edges.find((e) => e.id === selectedEdgeId) ?? null;
  }, [selectedEdgeId, report.graph.edges]);

  const isNaive = simulationMode === "naive_single_revoke";
  const persistingCount = outcome.persisting_node_ids.length;
  const containedCount = outcome.contained_node_ids.length;

  return (
    <section
      aria-label="Interactive Blast-Radius Domino Graph"
      className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 shadow-lg"
    >
      {/* Header & Simulation Toggle */}
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              2. Interactive Blast-Radius Domino Graph
            </h2>
            <span
              className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold ${
                isNaive && persistingCount > 0
                  ? "border-rose-500/60 bg-rose-500/15 text-rose-300"
                  : "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
              }`}
            >
              {isNaive
                ? `NAIVE REVOKE: HTTP ${outcome.rfc7009_http_status_returned} · ${persistingCount} NODE(S) PERSISTING`
                : `FULL MULTI-ISSUER PLAN: ${containedCount}/${containedCount + persistingCount} CONTAINED`}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Click any node or transition arrow to inspect trust boundaries,
            mechanism, and why single-endpoint RFC 7009 revocation fails across
            issuers.
          </p>
        </div>

        {/* Toggle */}
        <div
          className="inline-flex max-w-full flex-wrap rounded-xl border border-slate-800 bg-slate-950 p-1 lg:shrink-0"
          role="group"
          aria-label="Containment Simulation Mode"
        >
          <button
            type="button"
            onClick={() => onChangeSimulationMode("naive_single_revoke")}
            className={`sm:whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              isNaive
                ? "bg-rose-600 text-white shadow-sm shadow-rose-900/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Simulate Naive Containment (RFC 7009)
          </button>
          <button
            type="button"
            onClick={() => onChangeSimulationMode("full_multi_issuer")}
            className={`sm:whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              !isNaive
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-900/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Full Multi-Issuer Containment Plan
          </button>
        </div>
      </div>

      {/* Trust Boundary Legend & Filter */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] font-medium text-slate-400">
          Trust Boundaries Crossed:
        </span>
        {report.summary.trust_boundary_crossings.map((tb) => {
          const meta = TRUST_BOUNDARY_META[tb];
          const active = highlightedBoundary === tb;
          return (
            <button
              key={tb}
              type="button"
              onClick={() =>
                setHighlightedBoundary(active ? null : tb)
              }
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${
                meta.badgeClass
              } ${active ? "ring-2 ring-white/50" : "opacity-85 hover:opacity-100"}`}
            >
              {meta.label} ({meta.short})
            </button>
          );
        })}
        {highlightedBoundary && (
          <button
            type="button"
            onClick={() => setHighlightedBoundary(null)}
            className="ml-1 text-[11px] text-slate-400 underline hover:text-slate-200"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Responsive SVG Domino Canvas */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/90 bg-[#070b14]">
        {report.graph.nodes.length === 0 ? (
          <div className="flex h-52 items-center justify-center text-xs text-slate-500">
            No blast graph nodes for this input. Try an Incident Preset or valid
            OAuth URL.
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${layout.svgWidth} ${layout.svgHeight}`}
            className="h-auto min-w-[760px] w-full select-none"
            role="img"
            aria-label="Blast-Radius Domino Graph"
          >
            <defs>
              <marker
                id="arrow-red"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
              </marker>
              <marker
                id="arrow-green"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
              </marker>
              <marker
                id="arrow-slate"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
              </marker>
            </defs>

            {/* Subtle dot-grid background */}
            <pattern
              id="sb-grid"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="1" fill="#1e293b" opacity="0.65" />
            </pattern>
            <rect
              width={layout.svgWidth}
              height={layout.svgHeight}
              fill="url(#sb-grid)"
            />

            {/* Edges */}
            {report.graph.edges.map((edge) => {
              const src = layout.positioned.get(edge.source);
              const dst = layout.positioned.get(edge.target);
              if (!src || !dst) return null;

              const x1 = src.x + src.w;
              const y1 = src.y + src.h / 2;
              const x2 = dst.x;
              const y2 = dst.y + dst.h / 2;
              const dx = Math.max(40, Math.abs(x2 - x1) * 0.48);
              const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

              const edgePersists =
                isNaive &&
                (persistingEdgeSet.has(edge.id) || edge.survives_naive_revoke);
              const stroke = !isNaive
                ? "#10b981"
                : edgePersists
                  ? "#f43f5e"
                  : "#64748b";
              const marker = !isNaive
                ? "url(#arrow-green)"
                : edgePersists
                  ? "url(#arrow-red)"
                  : "url(#arrow-slate)";
              const isSelected = selectedEdgeId === edge.id;

              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2 - 8;

              return (
                <g
                  key={edge.id}
                  onClick={() => {
                    setSelectedEdgeId(edge.id);
                    setSelectedNodeId(null);
                  }}
                  className="cursor-pointer"
                >
                  <path
                    d={pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={14}
                  />
                  <path
                    d={pathD}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={isSelected ? 3.5 : edgePersists ? 2.5 : 2}
                    markerEnd={marker}
                    className={edgePersists ? "edge-flow-red" : undefined}
                  />
                  <rect
                    x={midX - 28}
                    y={midY - 9}
                    width={56}
                    height={16}
                    rx={8}
                    fill="#0f172a"
                    stroke={stroke}
                    strokeWidth={1}
                  />
                  <text
                    x={midX}
                    y={midY + 2}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="700"
                    fill={edgePersists ? "#fda4af" : !isNaive ? "#6ee7b7" : "#cbd5e1"}
                  >
                    HOP {edge.hop}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {Array.from(layout.positioned.values()).map(
              ({ node, x, y, w, h }) => {
                const tbMeta = TRUST_BOUNDARY_META[node.trust_boundary];
                const isPersisting =
                  isNaive &&
                  (persistingNodeSet.has(node.id) ||
                    node.survives_naive_revoke);
                const isContained = containedNodeSet.has(node.id);
                const isSelected =
                  selectedNodeId === node.id ||
                  (!selectedNodeId && !selectedEdgeId && activeNode?.id === node.id);

                const dimmed =
                  highlightedBoundary !== null &&
                  node.trust_boundary !== highlightedBoundary;

                const borderColor = !isNaive
                  ? "#10b981"
                  : isPersisting
                    ? "#f43f5e"
                    : isContained
                      ? "#f59e0b"
                      : "#334155";

                const statusText = !isNaive
                  ? node.kind === "human_identity"
                    ? "ORIGIN"
                    : "CONTAINED"
                  : isPersisting
                    ? "PERSISTS"
                    : isContained
                      ? "REVOKED"
                      : "ORIGIN";

                const statusBg = !isNaive
                  ? node.kind === "human_identity"
                    ? "#1e293b"
                    : "#064e3b"
                  : isPersisting
                    ? "#881337"
                    : isContained
                      ? "#78350f"
                      : "#1e293b";

                const statusFg = !isNaive
                  ? node.kind === "human_identity"
                    ? "#cbd5e1"
                    : "#6ee7b7"
                  : isPersisting
                    ? "#fecdd3"
                    : isContained
                      ? "#fde68a"
                      : "#cbd5e1";

                const lines = wrapLabel(node.label, 25);

                return (
                  <g
                    key={node.id}
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      setSelectedEdgeId(null);
                    }}
                    opacity={dimmed ? 0.3 : 1}
                    className="cursor-pointer transition-opacity"
                  >
                    {isPersisting && (
                      <rect
                        x={x - 3}
                        y={y - 3}
                        width={w + 6}
                        height={h + 6}
                        rx={12}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth={1.5}
                        className="node-pulse-red"
                      />
                    )}
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      rx={10}
                      fill={isSelected ? "#162036" : "#0e1525"}
                      stroke={isSelected ? "#f8fafc" : borderColor}
                      strokeWidth={isSelected ? 2 : 1.5}
                    />
                    {/* Top Trust Boundary Accent Bar */}
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={4}
                      rx={2}
                      fill={tbMeta.colorHex}
                    />
                    {/* Boundary pill */}
                    <text
                      x={x + 10}
                      y={y + 20}
                      fontSize="9.5"
                      fontWeight="700"
                      fill={tbMeta.colorHex}
                    >
                      {tbMeta.short.toUpperCase()}
                    </text>
                    {/* Containment state pill */}
                    <rect
                      x={x + w - 74}
                      y={y + 10}
                      width={64}
                      height={15}
                      rx={7.5}
                      fill={statusBg}
                    />
                    <text
                      x={x + w - 42}
                      y={y + 20.5}
                      textAnchor="middle"
                      fontSize="8.5"
                      fontWeight="700"
                      fill={statusFg}
                    >
                      {statusText}
                    </text>

                    {/* Label lines */}
                    {lines.map((line, i) => (
                      <text
                        key={i}
                        x={x + 10}
                        y={y + 42 + i * 16}
                        fontSize="11.5"
                        fontWeight="600"
                        fill="#f1f5f9"
                      >
                        {line}
                      </text>
                    ))}

                    {/* Footer provider + risk */}
                    <text
                      x={x + 10}
                      y={y + h - 11}
                      fontSize="9.5"
                      fill="#94a3b8"
                    >
                      {PROVIDER_LABELS[node.provider]}
                    </text>
                    <text
                      x={x + w - 10}
                      y={y + h - 11}
                      textAnchor="end"
                      fontSize="10"
                      fontWeight="700"
                      fill={node.risk_score >= 85 ? "#fda4af" : "#94a3b8"}
                    >
                      Risk {node.risk_score}
                    </text>
                  </g>
                );
              },
            )}
          </svg>
        )}
      </div>

      {/* Forensic Node / Edge Inspector */}
      <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
        {activeEdge ? (
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-200">
                  HOP {activeEdge.hop} · {activeEdge.relation}
                </span>
                <span
                  className={`rounded px-2 py-0.5 font-mono text-[11px] font-semibold ${
                    isNaive && activeEdge.survives_naive_revoke
                      ? "bg-rose-500/20 text-rose-300"
                      : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {isNaive && activeEdge.survives_naive_revoke
                    ? "SURVIVES SINGLE RFC 7009 REVOKE"
                    : "CONTAINED"}
                </span>
              </div>
              <div className="mt-1.5 text-sm font-medium text-slate-100">
                {activeEdge.mechanism}
              </div>
            </div>
            <div className="font-mono text-[11px] text-slate-400">
              {activeEdge.source} → {activeEdge.target}
            </div>
          </div>
        ) : activeNode ? (
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-100">
                  {activeNode.label}
                </span>
                <span
                  className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                    TRUST_BOUNDARY_META[activeNode.trust_boundary].badgeClass
                  }`}
                >
                  {TRUST_BOUNDARY_META[activeNode.trust_boundary].label}
                </span>
                <span
                  className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                    SEVERITY_META[activeNode.severity].badgeClass
                  }`}
                >
                  {SEVERITY_META[activeNode.severity].label} ({activeNode.risk_score}
                  /100)
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-300">{activeNode.notes}</p>
            </div>
            <div className="shrink-0 font-mono text-[11px] text-slate-400">
              kind: {activeNode.kind}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
