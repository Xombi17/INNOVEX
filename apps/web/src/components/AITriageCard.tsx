"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AuditReport } from "@contracts/index";
import type { AITriageResponse } from "@/lib/aiTriageTypes";
import { localTriage, triageRequest } from "@/lib/triage";

export function AITriageCard({ report }: { report: AuditReport }) {
  const payload = useMemo(() => triageRequest(report), [report]);
  const local = useMemo(() => localTriage(payload), [payload]);
  const [remote, setRemote] = useState<AITriageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    setRemote(null);
    setLoading(false);
    setStatus("");
    return () => controller.current?.abort();
  }, [report]);
  const requestOrdering = async () => {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setLoading(true);
    setStatus("Requesting optional summary ordering…");
    try {
      const response = await fetch("/api/ai-triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: abort.signal,
      });
      if (!response.ok) throw new Error();
      const result = (await response.json()) as AITriageResponse;
      if (abort.signal.aborted) return;
      setRemote(result);
      setStatus(
        result.fallbackUsed
          ? "Live AI was unavailable or unconfigured. The local rule-based summary is shown."
          : "Summary prioritized by AI using the same rule-based facts. No new findings were generated.",
      );
    } catch {
      if (!abort.signal.aborted)
        setStatus(
          "AI summary is unavailable. Your local analysis remains available below.",
        );
    } finally {
      if (!abort.signal.aborted) setLoading(false);
    }
  };
  const summary = remote ?? local;
  return (
    <details className="rounded-2xl border border-white/10 bg-[#12141c] p-5 sm:p-6 shadow-xl shadow-black/30">
      <summary className="cursor-pointer font-semibold text-white hover:text-blue-300 transition-colors text-sm sm:text-base">
        Plain-English review summary
      </summary>
      <section aria-label="Review summary" className="mt-5 space-y-4">
        <p className="text-xs text-slate-400">
          <span className="font-mono text-teal-400 font-medium">{summary.modelBadge}</span>. This summary explains the supplied input; it is
          not an independent security diagnosis.
        </p>
        <div className="grid gap-3.5 md:grid-cols-3">
          {summary.items.map((item) => (
            <div key={item.title} className="rounded-xl border border-white/5 bg-[#181b24] p-4 shadow-sm">
              <h3 className="text-xs sm:text-sm font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed font-normal">{item.body}</p>
            </div>
          ))}
        </div>
        <details className="rounded-xl border border-white/5 bg-[#0e1017] p-4">
          <summary className="cursor-pointer text-xs sm:text-sm font-semibold text-teal-300 hover:text-teal-200 transition-colors">
            Optional AI prioritization
          </summary>
          <p className="my-3 text-xs text-slate-400 leading-relaxed font-normal">
            On request, provider names and counts go to our server and a
            configured AI provider. No input text, file contents, keys, URLs,
            scopes or evidence notes are sent. The model can reorder vetted
            facts, not add security claims.
          </p>
          <button
            type="button"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50"
            disabled={loading}
            onClick={() => void requestOrdering()}
          >
            {loading ? "Prioritizing…" : "Ask AI to prioritize this summary"}
          </button>
        </details>
        {status && (
          <p role="status" className="text-xs text-teal-300 font-mono">
            {status}
          </p>
        )}
      </section>
    </details>
  );
}
