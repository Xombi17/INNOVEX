"use client";
import type { Analysis } from "@/lib/analysis";
import { EvidenceSummary } from "./EvidenceSummary";
import { AITriageCard } from "./AITriageCard";
export function Step1ScanVerdict({
  analysis,
  onContinue,
}: {
  analysis: Analysis;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-6">
      <EvidenceSummary analysis={analysis} />
      <AITriageCard report={analysis.report} />
      <div className="flex justify-end">
        <button
          className="control control-primary"
          type="button"
          onClick={onContinue}
        >
          Understand possible exposure
        </button>
      </div>
    </div>
  );
}
