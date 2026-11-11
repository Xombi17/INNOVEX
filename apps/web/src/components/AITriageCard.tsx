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
    <details className="border-t border-[#e8eaec] pt-3">
      <summary className="cursor-pointer font-medium">
        Plain-English review summary
      </summary>
      <section aria-label="Review summary" className="mt-4 space-y-4">
        <p className="muted text-[13px]">
          {summary.modelBadge}. This summary explains the supplied input; it is
          not an independent security diagnosis.
        </p>
        <div className="grid gap-5 md:grid-cols-3">
          {summary.items.map((item) => (
            <div key={item.title}>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="muted mt-2">{item.body}</p>
            </div>
          ))}
        </div>
        <details>
          <summary className="cursor-pointer text-[#1b6c80]">
            Optional AI prioritization
          </summary>
          <p className="muted my-3 text-[13px]">
            On request, provider names and counts go to our server and a
            configured AI provider. No input text, file contents, keys, URLs,
            scopes or evidence notes are sent. The model can reorder vetted
            facts, not add security claims.
          </p>
          <button
            type="button"
            className="control"
            disabled={loading}
            onClick={() => void requestOrdering()}
          >
            {loading ? "Prioritizing…" : "Ask AI to prioritize this summary"}
          </button>
        </details>
        <p role="status" className="muted text-[13px]">
          {status}
        </p>
      </section>
    </details>
  );
}
