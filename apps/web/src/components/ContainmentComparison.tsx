"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowSquareOut,
  CaretDown,
  CaretRight,
  Check,
  Copy,
} from "@phosphor-icons/react";
import type { AuditReport, BlastNode, SimulationMode } from "@contracts/index";
import { PROVIDER_LABELS, humanizeNodeLabel } from "./uiTokens";
import { enrichContainmentStep } from "@/lib/remediationTemplates";

interface ContainmentComparisonProps {
  report: AuditReport;
  simulationMode: SimulationMode;
  onChangeSimulationMode: (mode: SimulationMode) => void;
  showFullTableByDefault?: boolean;
}

export function ContainmentComparison({
  report,
  simulationMode,
  onChangeSimulationMode,
  showFullTableByDefault = false,
}: ContainmentComparisonProps) {
  const [copiedCmdKey, setCopiedCmdKey] = useState<string | null>(null);
  const [showAllSurviving, setShowAllSurviving] = useState(false);
  const [showAllSteps, setShowAllSteps] = useState(showFullTableByDefault);

  const naive = report.naive_containment;
  const full = report.full_containment;

  const nodeMap = useMemo(
    () => new Map(report.graph.nodes.map((n) => [n.id, n])),
    [report.graph.nodes],
  );

  const naivePct = Math.round(naive.containment_ratio * 100);
  const fullPct = Math.round(full.containment_ratio * 100);
  const isNaive = simulationMode === "naive_single_revoke";

  const survivingByProvider = useMemo(() => {
    const groups = new Map<string, BlastNode[]>();
    for (const id of naive.persisting_node_ids) {
      const node = nodeMap.get(id);
      const label = node ? PROVIDER_LABELS[node.provider] : "Other";
      const list = groups.get(label) ?? [];
      if (node) list.push(node);
      groups.set(label, list);
    }
    return Array.from(groups.entries()).sort(
      (a, b) => b[1].length - a[1].length,
    );
  }, [naive.persisting_node_ids, nodeMap]);

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCmdKey(key);
      setTimeout(() => {
        setCopiedCmdKey((prev) => (prev === key ? null : prev));
      }, 1500);
    } catch {
      // Clipboard optional in headless sessions
    }
  };

  const visibleSteps = showAllSteps
    ? full.ordered_steps
    : full.ordered_steps.slice(0, 6);
  const hiddenStepsCount = Math.max(
    0,
    full.ordered_steps.length - visibleSteps.length,
  );

  return (
    <section
      aria-label="Naive RFC 7009 revoke vs full multi-issuer containment"
      className="space-y-6 border-t border-[#e8eaec] pt-6"
    >
      {/* Top Unboxed 2-Column Split Separated by Vertical Hairline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        {/* LEFT: NAIVE RFC 7009 TRAP */}
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-[54ch]">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[16px] font-semibold leading-[1.4] text-[#131416]">
                  Naive single revoke (RFC 7009 trap)
                </h2>
                <span
                  className="inline-flex h-6 items-center rounded-full px-2.5 text-[13px] font-medium tabular-nums"
                  style={{ backgroundColor: "#fffbeb", color: "#92400e" }}
                >
                  {naive.rfc7009_http_status_returned > 0
                    ? `Returns HTTP ${naive.rfc7009_http_status_returned}`
                    : "Single-issuer only"}
                </span>
              </div>
              <p className="mt-1 text-[14px] leading-[1.5] text-[#5d5f60]">
                Revoking one token gives an affirmative confirmation while
                leaving other providers and credentials open.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onChangeSimulationMode("naive_single_revoke")}
              className={`h-8 shrink-0 rounded-[6px] px-3 text-[13px] font-medium transition ${
                isNaive
                  ? "bg-[#131416] text-[#ffffff]"
                  : "border border-[#cdced1] bg-[#ffffff] text-[#131416] hover:bg-[#f4f6f8]"
              }`}
            >
              {isNaive ? "Active on graph" : "Simulate naive"}
            </button>
          </div>

          {/* 3 Tabular Numbers (unboxed hairline rule band) */}
          <div className="mt-4 grid grid-cols-3 border-y border-[#e8eaec] py-3">
            <div className="pr-3">
              <div className="text-[13px] text-[#5d5f60]">Stopped</div>
              <div className="mt-0.5 text-[22px] font-normal leading-[1.35] text-[#831c1e] tabular-nums">
                {naivePct}%
              </div>
            </div>
            <div className="border-l border-[#f0f1f2] px-3">
              <div className="text-[13px] text-[#5d5f60]">Surviving</div>
              <div className="mt-0.5 text-[22px] font-normal leading-[1.35] text-[#131416] tabular-nums">
                {naive.persisting_node_ids.length}
              </div>
            </div>
            <div className="border-l border-[#f0f1f2] pl-3">
              <div className="text-[13px] text-[#5d5f60]">Residual JWT</div>
              <div className="mt-0.5 text-[22px] font-normal leading-[1.35] text-[#92400e] tabular-nums">
                {naive.jwt_residual_ttl_seconds}s
              </div>
            </div>
          </div>

          <p className="mt-4 border-b border-[#f0c8ca] pb-3.5 text-[14px] leading-[1.5] text-[#831c1e]">
            {naive.rfc7009_trap_warning}
          </p>

          {/* Grouped Surviving Exposure by Provider */}
          <div className="mt-4">
            <div className="flex items-center justify-between gap-2 border-b border-[#f0f1f2] pb-2">
              <span className="text-[14px] font-medium text-[#131416]">
                Surviving attacker paths by provider (
                <span className="tabular-nums">
                  {naive.persisting_node_ids.length}
                </span>
                )
              </span>
              {naive.persisting_node_ids.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllSurviving((v) => !v)}
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-[#1b6c80] hover:underline"
                >
                  {showAllSurviving ? (
                    <>
                      <CaretDown size={14} />
                      Group summary
                    </>
                  ) : (
                    <>
                      <CaretRight size={14} />
                      Expand paths
                    </>
                  )}
                </button>
              )}
            </div>

            {naive.persisting_node_ids.length === 0 ? (
              <p className="py-3 text-[14px] leading-[1.5] text-[#1e7b4f]">
                No surviving paths detected for this minimal grant.
              </p>
            ) : showAllSurviving ? (
              <div className="divide-y divide-[#f0f1f2]">
                {naive.persisting_node_ids.map((id) => {
                  const node = nodeMap.get(id);
                  return (
                    <div
                      key={id}
                      className="flex items-start justify-between gap-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <div className="text-[14px] font-medium leading-[1.45] text-[#131416]">
                          {node ? humanizeNodeLabel(node) : id}
                        </div>
                        {node?.notes && (
                          <div className="mt-0.5 text-[13px] leading-[1.45] text-[#5d5f60]">
                            {node.notes}
                          </div>
                        )}
                      </div>
                      <span className="shrink-0 text-[13px] font-medium text-[#831c1e]">
                        {node ? PROVIDER_LABELS[node.provider] : "External"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="divide-y divide-[#f0f1f2]">
                {survivingByProvider.map(([providerName, items]) => (
                  <div
                    key={providerName}
                    className="flex items-center justify-between gap-3 py-2.5 text-[14px] leading-[1.45]"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-[#131416]">
                        {providerName}
                      </span>
                      <span className="ml-2 text-[13px] text-[#5d5f60]">
                        {items
                          .slice(0, 2)
                          .map((item) => humanizeNodeLabel(item))
                          .join(", ")}
                        {items.length > 2 ? ` + ${items.length - 2} more` : ""}
                      </span>
                    </div>
                    <span className="shrink-0 font-medium text-[#831c1e] tabular-nums">
                      {items.length} open
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: FULL MULTI-ISSUER PLAN SUMMARY */}
        <div className="lg:border-l lg:border-[#e8eaec] lg:pl-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-[54ch]">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[16px] font-semibold leading-[1.4] text-[#131416]">
                  Full multi-issuer containment plan
                </h2>
                <span
                  className="inline-flex h-6 items-center rounded-full px-2.5 text-[13px] font-medium tabular-nums"
                  style={{ backgroundColor: "#dcfae5", color: "#04250e" }}
                >
                  {fullPct}% contained
                </span>
              </div>
              <p className="mt-1 text-[14px] leading-[1.5] text-[#5d5f60]">
                Priority-ordered revocations and rotations at each real issuer
                with API rejection verification probes beyond HTTP 200.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onChangeSimulationMode("full_multi_issuer")}
              className={`h-8 shrink-0 rounded-[6px] px-3 text-[13px] font-medium transition ${
                !isNaive
                  ? "bg-[#1e7b4f] text-[#ffffff]"
                  : "border border-[#cdced1] bg-[#ffffff] text-[#131416] hover:bg-[#f4f6f8]"
              }`}
            >
              {!isNaive ? "Active on graph" : "Apply full plan"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 border-y border-[#e8eaec] py-3">
            <div className="pr-3">
              <div className="text-[13px] text-[#5d5f60]">Contained</div>
              <div className="mt-0.5 text-[22px] font-normal leading-[1.35] text-[#04250e] tabular-nums">
                {fullPct}%
              </div>
            </div>
            <div className="border-l border-[#f0f1f2] px-3">
              <div className="text-[13px] text-[#5d5f60]">Issuer steps</div>
              <div className="mt-0.5 text-[22px] font-normal leading-[1.35] text-[#131416] tabular-nums">
                {full.ordered_steps.length}
              </div>
            </div>
            <div className="border-l border-[#f0f1f2] pl-3">
              <div className="text-[13px] text-[#5d5f60]">Still open</div>
              <div className="mt-0.5 text-[22px] font-normal leading-[1.35] text-[#04250e] tabular-nums">
                {full.persisting_node_ids.length}
              </div>
            </div>
          </div>

          {/* Single Action Attempted in Naive Mode */}
          {naive.ordered_steps[0] && (
            <div className="mt-4 border-b border-[#f0f1f2] pb-3.5">
              <div className="text-[13px] font-medium text-[#5d5f60]">
                What a single revoke alone actually called
              </div>
              <code className="mt-1.5 block break-words [overflow-wrap:anywhere] text-[13px] leading-[1.45] text-[#131416]">
                {naive.ordered_steps[0].command_or_endpoint}
              </code>
              <p className="mt-1.5 text-[13px] leading-[1.45] text-[#92400e]">
                Gap left open: {naive.ordered_steps[0].why_naive_fails}
              </p>
            </div>
          )}

          {/* Safety Assurance Note */}
          <p className="mt-4 border-t border-[#f0f1f2] pt-3 text-[14px] leading-[1.5] text-[#5d5f60]">
            Dry-run verification only: all commands below are copy-ready templates
            that never execute destructive calls against your live accounts.
          </p>
        </div>
      </div>

      {/* Priority-Ordered Multi-Issuer Remediation Checklist Table (flat on white sheet) */}
      <div className="border-t border-[#e8eaec] pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div>
            <h3 className="text-[16px] font-semibold leading-[1.4] text-[#131416]">
              Ordered containment checklist ({full.ordered_steps.length} steps)
            </h3>
            <p className="mt-0.5 text-[14px] leading-[1.5] text-[#5d5f60]">
              Execute steps across every issuing provider, then confirm rejection
              with each verification probe.
            </p>
          </div>

          {full.ordered_steps.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAllSteps((v) => !v)}
              className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-[#cdced1] bg-[#ffffff] px-3 text-[13px] font-medium text-[#131416] transition hover:bg-[#f4f6f8]"
            >
              {showAllSteps
                ? "Show top 6 priority steps"
                : `Show all ${full.ordered_steps.length} steps`}
            </button>
          )}
        </div>

        {/* Mobile Stacked Hairline List (< md) so narrow screens never clip table columns */}
        <div className="divide-y divide-[#f0f1f2] border-t border-[#e8eaec] md:hidden">
          {visibleSteps.map((step) => {
            const copyKey = `step-${step.priority}-${step.issuer}`;
            const copied = copiedCmdKey === copyKey;
            const targetNode = nodeMap.get(step.target_resource);
            const readableTarget = targetNode
              ? humanizeNodeLabel(targetNode)
              : step.target_resource;
            const enriched = enrichContainmentStep(step as any, report);
            const consoleTarget = step.console_url || enriched.consoleUrl;

            return (
              <div key={`m-${copyKey}`} className="space-y-2.5 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[14px]">
                      <span className="font-semibold text-[#131416] tabular-nums">
                        P{step.priority}
                      </span>
                      <span className="font-medium text-[#131416]">
                        {step.issuer}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[13px] text-[#5d5f60]">
                      Target: {readableTarget}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(copyKey, enriched.copyableCommand)
                      }
                      className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-[#cdced1] bg-[#ffffff] px-2.5 text-[13px] font-medium text-[#131416] transition hover:bg-[#f4f6f8]"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    {consoleTarget && (
                      <a
                        href={consoleTarget}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-[#cdced1] bg-[#ffffff] px-2.5 text-[13px] font-medium text-[#1b6c80] transition hover:bg-[#f4f6f8]"
                      >
                        Console
                        <ArrowSquareOut size={14} />
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-[13px] font-medium text-[#5d5f60]">
                    Endpoint or rotation command
                  </div>
                  <code className="block break-words [overflow-wrap:anywhere] rounded-[6px] bg-[#f4f6f8] px-2.5 py-2 text-[13px] leading-[1.45] text-[#131416]">
                    {enriched.copyableCommand}
                  </code>
                  {enriched.rfcNote && (
                    <div className="mt-1 text-[11px] text-[#855306]">
                      {enriched.rfcNote}
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-1 text-[13px] font-medium text-[#5d5f60]">
                    Post-revoke check
                  </div>
                  <code className="block break-words [overflow-wrap:anywhere] text-[13px] leading-[1.45] text-[#1e7b4f]">
                    {enriched.verificationProbe}
                  </code>
                  <div className="mt-0.5 text-[11px] text-[#5d5f60]">
                    Expected: {enriched.expectedStatus}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop & Tablet Table (md+) */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-y border-[#e8eaec] text-[13px] font-medium text-[#5d5f60]">
                <th className="py-2.5 pr-3">Step</th>
                <th className="px-3 py-2.5">Issuer &amp; target</th>
                <th className="px-3 py-2.5">Endpoint or rotation command</th>
                <th className="px-3 py-2.5">Post-revoke check</th>
                <th className="py-2.5 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f1f2] text-[14px] leading-[1.45]">
              {visibleSteps.map((step) => {
                const copyKey = `step-${step.priority}-${step.issuer}`;
                const copied = copiedCmdKey === copyKey;
                const targetNode = nodeMap.get(step.target_resource);
                const readableTarget = targetNode
                  ? humanizeNodeLabel(targetNode)
                  : step.target_resource;

                const enriched = enrichContainmentStep(step as any, report);
                const consoleTarget = step.console_url || enriched.consoleUrl;

                return (
                  <tr key={copyKey} className="align-top">
                    <td className="py-3.5 pr-3 text-[14px] font-semibold text-[#131416] tabular-nums whitespace-nowrap">
                      P{step.priority}
                    </td>
                    <td className="min-w-[180px] px-3 py-3.5">
                      <div className="font-medium text-[#131416]">
                        {step.issuer}
                      </div>
                      <div className="mt-0.5 text-[13px] text-[#5d5f60]">
                        Target: {readableTarget}
                      </div>
                      <div className="mt-1">
                        <code className="rounded-[4px] bg-[#f4f6f8] px-1.5 py-0.5 text-[13px] text-[#5d5f60]">
                          {step.action_type}
                        </code>
                      </div>
                    </td>
                    <td className="min-w-[230px] max-w-[360px] px-3 py-3.5">
                      <code className="block break-words [overflow-wrap:anywhere] rounded-[6px] bg-[#f4f6f8] px-2.5 py-2 text-[13px] leading-[1.45] text-[#131416]">
                        {enriched.copyableCommand}
                      </code>
                      {enriched.rfcNote && (
                        <div className="mt-1 text-[11px] text-[#855306]">
                          {enriched.rfcNote}
                        </div>
                      )}
                    </td>
                    <td className="min-w-[200px] max-w-[300px] px-3 py-3.5">
                      <code className="block break-words [overflow-wrap:anywhere] text-[13px] leading-[1.45] text-[#1e7b4f]">
                        {enriched.verificationProbe}
                      </code>
                      <div className="mt-0.5 text-[11px] text-[#5d5f60]">
                        Expected: {enriched.expectedStatus}
                      </div>
                    </td>
                    <td className="py-3.5 pl-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(copyKey, enriched.copyableCommand)
                          }
                          className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-[#cdced1] bg-[#ffffff] px-2.5 text-[13px] font-medium text-[#131416] transition hover:bg-[#f4f6f8]"
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                          {copied ? "Copied" : "Copy"}
                        </button>
                        {consoleTarget && (
                          <a
                            href={consoleTarget}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-[#cdced1] bg-[#ffffff] px-2.5 text-[13px] font-medium text-[#1b6c80] transition hover:bg-[#f4f6f8]"
                          >
                            Console
                            <ArrowSquareOut size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {hiddenStepsCount > 0 && (
          <div className="border-t border-[#f0f1f2] pt-3">
            <button
              type="button"
              onClick={() => setShowAllSteps(true)}
              className="text-[13px] font-medium text-[#1b6c80] hover:underline"
            >
              View remaining {hiddenStepsCount} remediation steps
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
