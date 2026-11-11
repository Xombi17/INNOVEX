"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { AuditReport } from "@contracts/index";
import type { AITriageRequest, AITriageResponse } from "@/lib/aiTriageTypes";
import { deterministicTriage } from "@/lib/aiTriage";

export function AITriageCard({ report }: { report: AuditReport }) {
  const payload = useMemo<AITriageRequest>(() => ({
    inputMode: report.input_mode, maxRiskScore: report.summary.max_risk_score, maxHops: report.summary.max_hops,
    trustBoundaries: report.summary.trust_boundary_crossings, primaryProvider: report.parsed_oauth?.provider ?? "generic",
    detectedProviders: [...new Set(report.graph.nodes.map(node => node.provider))],
    naivePersistingCount: report.naive_containment.persisting_node_ids.length,
    naiveStoppedPct: Math.round(report.naive_containment.containment_ratio * 100), pkceProtected: report.pre_consent_guard.pkce_protected,
    rfc7009Status: report.naive_containment.rfc7009_http_status_returned,
  }), [report]);
  const [result, setResult] = useState<{ report: AuditReport; triage: AITriageResponse } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  useEffect(() => { generation.current += 1; controller.current?.abort(); setLoading(false); setError(""); return () => controller.current?.abort(); }, [report]);
  const triage = result?.report === report ? result.triage : deterministicTriage(payload);
  const requestAI = async () => {
    controller.current?.abort(); const abort = new AbortController(); controller.current = abort;
    const version = ++generation.current; setLoading(true); setError("");
    try {
      const response = await fetch("/api/ai-triage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: abort.signal });
      if (!response.ok) throw new Error();
      const data = await response.json() as AITriageResponse;
      if (generation.current === version && !abort.signal.aborted) setResult({ report, triage: data });
    } catch { if (!abort.signal.aborted && generation.current === version) setError("AI service unavailable. The local explanation remains below."); }
    finally { if (generation.current === version && !abort.signal.aborted) setLoading(false); }
  };
  return <section aria-label="Plain-English threat triage" className="space-y-4 border-t border-[#e8eaec] pt-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-[16px] font-semibold">Plain-English security brief</h2><p className="text-[13px] text-[#5d5f60]">{triage.modelBadge}</p></div><button type="button" className="control" disabled={loading} onClick={requestAI}>{loading ? "Requesting explanation…" : "Request AI explanation"}</button></div>
    <p className="text-[13px] text-[#5d5f60]">Optional AI sends only counts and recognized provider/boundary names. File contents, URLs, key names and credential values stay out of the request. Without a configured model, the server returns the local explanation.</p>
    {error && <p role="status" className="text-[13px] text-[#92400e]">{error}</p>}
    <div className="grid gap-4 md:grid-cols-3">{[["What an attacker could do", triage.attackerStory], ["Why one revoke may be insufficient", triage.whyRevokeFails], ["What to review first", triage.first60SecondsAction]].map(([title, text]) => <div key={title}><h3 className="font-semibold">{title}</h3><p className="mt-1 text-[14px] leading-normal text-[#5d5f60]">{text}</p></div>)}</div>
  </section>;
}
