"use client";

import React, { useEffect, useState } from "react";
import { ArrowsClockwise, ShieldWarning, Sparkle } from "@phosphor-icons/react";
import type { AuditReport } from "@contracts/index";
import type { AITriageRequest, AITriageResponse } from "@/lib/aiTriageTypes";
import { PROVIDER_LABELS } from "./uiTokens";

interface AITriageCardProps {
  report: AuditReport;
}

export function AITriageCard({ report }: AITriageCardProps) {
  const [triage, setTriage] = useState<AITriageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTriage = async () => {
    setLoading(true);
    setError(null);

    const primaryProvider = report.parsed_oauth?.provider
      ? PROVIDER_LABELS[report.parsed_oauth.provider]
      : "Detected Credentials";

    const topLabels = report.naive_containment.persisting_node_ids
      .slice(0, 5)
      .map((id) => {
        const node = report.graph.nodes.find((n) => n.id === id);
        return node?.label ?? id;
      });

    const payload: AITriageRequest = {
      inputMode: report.input_mode,
      presetId: report.preset_id,
      headline: report.summary.headline,
      maxRiskScore: report.summary.max_risk_score,
      maxHops: report.summary.max_hops,
      trustBoundaries: report.summary.trust_boundary_crossings,
      primaryProvider,
      requestedScopes: report.parsed_oauth?.requested_scopes ?? [],
      detectedKeyNames: report.shadow_secrets.map((s) => s.key_name),
      naivePersistingCount: report.naive_containment.persisting_node_ids.length,
      naiveStoppedPct: Math.round(
        report.naive_containment.containment_ratio * 100,
      ),
      topPersistingLabels: topLabels,
      pkceProtected: report.parsed_oauth?.has_pkce ?? false,
    };

    try {
      const res = await fetch("/api/ai-triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as AITriageResponse;
      setTriage(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Triage request failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTriage();
  }, [
    report.preset_id,
    report.input_mode,
    report.summary.max_risk_score,
    report.naive_containment.persisting_node_ids.length,
  ]);

  return (
    <div className="mx-5 my-4 rounded-[12px] border border-[#e8eaec] bg-[#ffffff] p-5 shadow-xs">
      {/* Header with attribution badge */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f1f2] pb-3">
        <div className="flex items-center gap-2">
          <ShieldWarning size={18} className="text-[#1b6c80]" />
          <h2 className="text-[14px] font-semibold text-[#131416]">
            Plain-English AI Threat Triage
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {triage && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${
                triage.fallbackUsed
                  ? "border border-[#e8eaec] bg-[#f4f6f8] text-[#5d5f60]"
                  : "border border-[#a2cfd8] bg-[#e6f2f5] text-[#1b6c80]"
              }`}
            >
              <Sparkle size={12} />
              {triage.modelBadge}
            </span>
          )}

          <button
            type="button"
            onClick={fetchTriage}
            disabled={loading}
            className="inline-flex h-7 items-center gap-1 rounded-[4px] border border-[#e8eaec] px-2 text-[12px] text-[#5d5f60] transition hover:bg-[#f4f6f8] hover:text-[#131416] disabled:opacity-50"
            title="Refresh AI Triage"
          >
            <ArrowsClockwise
              size={12}
              className={loading ? "animate-spin" : ""}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {loading && !triage ? (
        <div className="space-y-3 py-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-[#f4f6f8]" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-[#f4f6f8]" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-[#f4f6f8]" />
        </div>
      ) : error && !triage ? (
        <div className="text-[13px] text-[#831c1e]">
          Triage generation error: {error}
        </div>
      ) : triage ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:divide-x md:divide-[#f0f1f2]">
          <div className="space-y-1.5">
            <div className="text-[13px] font-semibold text-[#131416]">
              1. What an attacker could do
            </div>
            <p className="text-[13px] leading-[1.5] text-[#5d5f60]">
              {triage.attackerStory}
            </p>
          </div>

          <div className="space-y-1.5 md:pl-5">
            <div className="text-[13px] font-semibold text-[#131416]">
              2. Why 1-click Revoke fails
            </div>
            <p className="text-[13px] leading-[1.5] text-[#5d5f60]">
              {triage.whyRevokeFails}
            </p>
          </div>

          <div className="space-y-1.5 md:pl-5">
            <div className="text-[13px] font-semibold text-[#131416]">
              3. Your first 60 seconds move
            </div>
            <p className="text-[13px] leading-[1.5] text-[#5d5f60]">
              {triage.first60SecondsAction}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
