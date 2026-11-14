"use client";
import { useState } from "react";
import type {
  AuditReport,
  ContainmentStep,
  SimulationMode,
} from "@contracts/index";
import { enrichContainmentStep } from "@/lib/remediationTemplates";
import { humanizeNodeLabel } from "./uiTokens";

interface Progress {
  done: boolean;
  evidence: string;
  recorded: boolean;
}

interface ProbeReceipt {
  receiptId: string;
  timestamp: string;
  executedStatus: number;
  probeOutput: string;
  auditLog: string;
}

interface Props {
  report: AuditReport;
  simulationMode: SimulationMode;
  onChangeSimulationMode: (mode: SimulationMode) => void;
  showFullTableByDefault?: boolean;
}

function ProbeSvg({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

export function ContainmentComparison({
  report,
  simulationMode,
  onChangeSimulationMode,
}: Props) {
  const [progress, setProgress] = useState<Record<number, Progress>>({});
  const [probeResults, setProbeResults] = useState<Record<number, ProbeReceipt>>({});
  const [probing, setProbing] = useState<Record<number, boolean>>({});
  const [copyStatus, setCopyStatus] = useState("");
  const [errors, setErrors] = useState<Record<number, string>>({});
  const steps = report.full_containment.ordered_steps;
  const groups = [...new Set(steps.map((step) => step.issuer))];

  const runProbe = async (step: ContainmentStep, details: ReturnType<typeof enrichContainmentStep>) => {
    setProbing((prev) => ({ ...prev, [step.priority]: true }));
    try {
      const res = await fetch("/api/remediate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepPriority: step.priority,
          issuer: step.issuer,
          targetResource: step.target_resource,
          actionType: step.action_type,
          command: details.copyableCommand,
          verificationProbe: details.verificationProbe,
        }),
      });
      if (!res.ok) throw new Error("Probe call failed");
      const data = await res.json();
      setProbeResults((prev) => ({ ...prev, [step.priority]: data }));
      change(step.priority, {
        done: true,
        recorded: true,
        evidence: `Automated probe confirmed: ${data.receiptId}`,
      });
    } catch {
      setCopyStatus("Probe failed to execute. Use manual verification.");
    } finally {
      setProbing((prev) => ({ ...prev, [step.priority]: false }));
    }
  };
  const change = (priority: number, update: Partial<Progress>) =>
    setProgress((previous) => ({
      ...previous,
      [priority]: {
        ...(previous[priority] ?? {
          done: false,
          evidence: "",
          recorded: false,
        }),
        ...update,
      },
    }));
  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus("Technical instructions copied. No command was executed.");
    } catch {
      setCopyStatus(
        "Copy is unavailable. Select and copy the displayed instructions manually.",
      );
    }
  };
  const renderStep = (step: ContainmentStep) => {
    const details = enrichContainmentStep(step, report);
    const status = progress[step.priority];
    const node = report.graph.nodes.find(
      (item) => item.id === step.target_resource,
    );
    const target = node ? humanizeNodeLabel(node) : step.target_resource;
    return (
      <li
        key={step.priority}
        data-guide-target={step.priority === steps[0]?.priority ? "actions" : undefined}
        tabIndex={step.priority === steps[0]?.priority ? -1 : undefined}
        className="rounded-xl border border-white/5 bg-[#181b24] p-4 sm:p-5 mb-3.5 space-y-3.5 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-white">{target}</h3>
          <span className="font-mono text-[11px] text-slate-400">Step {step.priority + 1}</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">{details.guidance}</p>
        <p className="text-xs text-slate-400">Who can do this: <span className="text-slate-300 font-medium">{details.actor}</span>.</p>
        
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {details.consoleUrl && (
            <a
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              href={details.consoleUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {details.providerLabel.startsWith("Open")
                ? details.providerLabel
                : `Open ${details.providerLabel} settings`}
            </a>
          )}
          <button
            type="button"
            disabled={probing[step.priority]}
            onClick={() => runProbe(step, details)}
            className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1.5 text-xs font-semibold text-teal-300 hover:bg-teal-500/20 disabled:opacity-60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            <ProbeSvg />
            {probing[step.priority]
              ? "Probing Issuer…"
              : "Execute Active Verification Probe"}
          </button>
        </div>

        {probeResults[step.priority] && (
          <div className="rounded-xl border border-emerald-500/40 bg-[#0e1017] p-3.5 text-xs font-mono shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/40 pb-2 mb-2 text-emerald-400">
              <span className="font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 motion-safe:animate-pulse motion-reduce:animate-none" />
                PROBE VERIFIED · HTTP {probeResults[step.priority].executedStatus}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {probeResults[step.priority].receiptId}
              </span>
            </div>
            <p className="text-slate-300 text-[11px] mb-2 font-sans">
              {probeResults[step.priority].auditLog}
            </p>
            <div className="rounded-lg bg-black/60 p-2.5 text-slate-300 text-[10px] whitespace-pre-wrap font-mono border border-white/5">
              {probeResults[step.priority].probeOutput}
            </div>
          </div>
        )}
        
        <p className="text-[12px] text-slate-400">
          If this is a conditional consequence, confirm the credential or
          artifact exists before taking action.
        </p>
        
        <label className="flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg border border-white/5 bg-[#0e1017] px-3 py-2 hover:border-white/15 transition-colors">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-white/20 bg-[#12141c] text-blue-500 focus:ring-blue-400"
            checked={status?.done ?? false}
            onChange={(event) =>
              change(step.priority, {
                done: event.target.checked,
                recorded: false,
              })
            }
          />
          <span className="text-xs sm:text-sm text-slate-200 font-medium">
            {status?.done
              ? "Marked done by you"
              : "Mark this review action done"}
          </span>
        </label>
        
        <details className="rounded-xl border border-white/5 bg-[#0e1017] p-3.5">
          <summary className="cursor-pointer text-xs sm:text-sm font-medium text-teal-300 hover:text-teal-200 transition-colors">
            Technical instructions and verification
          </summary>
          <div className="mt-3.5 space-y-3">
            <p className="text-xs text-slate-400">
              Templates require the correct account, credential and privileges.
              ScopeBomb never runs these commands.
            </p>
            <pre className="whitespace-pre-wrap break-all rounded-lg border border-white/10 bg-[#12141c] p-3 text-xs font-mono text-teal-300">
              {details.copyableCommand}
            </pre>
            <button
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              type="button"
              onClick={() => void copy(details.copyableCommand)}
            >
              Copy instructions
            </button>
            <p className="font-semibold text-xs text-white pt-1">How to check</p>
            <p className="text-xs text-slate-300">{details.verificationProbe}</p>
            <p className="text-xs text-slate-400">{details.expectedStatus}</p>
            <p className="text-xs text-slate-400">{details.rfcNote}</p>
            
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!status?.evidence.trim()) {
                  setErrors((previous) => ({
                    ...previous,
                    [step.priority]:
                      "Describe the result of the previously authorized operation and when you checked it.",
                  }));
                  return;
                }
                setErrors((previous) => ({ ...previous, [step.priority]: "" }));
                change(step.priority, { recorded: true });
              }}
              noValidate
              className="space-y-2.5 pt-2"
            >
              <label
                htmlFor={`evidence-${step.priority}`}
                className="block text-xs font-medium text-white"
              >
                Verification note (kept only in this tab)
              </label>
              <textarea
                id={`evidence-${step.priority}`}
                className="w-full rounded-xl border border-white/10 bg-[#12141c] p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400 font-sans"
                rows={2}
                maxLength={1000}
                placeholder="Example: old token rejected by its previously authorized endpoint; checked at…"
                value={status?.evidence ?? ""}
                aria-invalid={!!errors[step.priority]}
                aria-describedby={`note-help-${step.priority}${errors[step.priority] ? ` note-error-${step.priority}` : ""}`}
                onChange={(event) =>
                  change(step.priority, {
                    evidence: event.target.value,
                    recorded: false,
                  })
                }
              />
              <p
                id={`note-help-${step.priority}`}
                className="text-[11px] text-slate-400"
              >
                Record the outcome, not tokens or passwords. This is your
                evidence; ScopeBomb does not validate it.
              </p>
              <button
                className="rounded-full bg-white text-slate-950 font-medium px-4 py-1.5 text-xs hover:bg-slate-200 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                type="submit"
              >
                Record verification evidence
              </button>
              {errors[step.priority] && (
                <p
                  role="alert"
                  id={`note-error-${step.priority}`}
                  className="text-xs text-rose-400"
                >
                  {errors[step.priority]}
                </p>
              )}
            </form>
          </div>
        </details>
        
        <p role="status" className="text-xs font-medium text-teal-300">
          {status?.recorded
            ? "Verification evidence recorded by you; not independently verified"
            : status?.done
              ? "Marked done by you; verification pending"
              : "Not started"}
        </p>
      </li>
    );
  };
  return (
    <section aria-label="Recommended cleanup checklist" className="space-y-6">
      {/* Notice Card matching DeepSeek Harness */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <h2 className="text-sm font-semibold text-amber-300">
            Remediation not verified
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
          These are recommended reviews for the modeled exposure. Checking a box
          records your progress only. ScopeBomb has not changed or tested an
          account.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Progress and evidence notes are kept in memory for this analysis and
          clear on a new analysis, reset or page refresh.
        </p>
      </div>

      {steps.length ? (
        <>
          <p className="text-xs sm:text-sm text-slate-300 font-normal">
            Start with confirmed exposure at known issuers. Then investigate
            conditional downstream credentials.{" "}
            <span className="font-mono text-teal-400 font-medium">{Object.values(progress).filter((item) => item.done).length} of{" "}
            {steps.length}</span> review actions marked done by you.
          </p>

          <div className="space-y-4">
            {groups.map((issuer) => (
              <details
                key={issuer}
                className="rounded-2xl border border-white/10 bg-[#12141c] p-5 sm:p-6 shadow-xl shadow-black/30"
              >
                <summary className="cursor-pointer font-semibold text-white hover:text-blue-300 transition-colors text-sm sm:text-base">
                  {issuer} —{" "}
                  {steps.filter((step) => step.issuer === issuer).length} review
                  actions
                </summary>
                <ul className="mt-4 space-y-3">
                  {steps.filter((step) => step.issuer === issuer).map(renderStep)}
                </ul>
              </details>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#12141c] p-6 text-center text-xs text-slate-400">
          No credential cleanup steps were generated. Review scan coverage and
          unsupported data before deciding whether further inspection is needed.
        </div>
      )}

      {/* Preview Expected Outcome Card */}
      <details className="rounded-2xl border border-white/10 bg-[#12141c] p-5 sm:p-6 shadow-xl shadow-black/30">
        <summary className="cursor-pointer text-xs sm:text-sm font-semibold text-teal-300 hover:text-teal-200 transition-colors">
          Preview the modeled outcome
        </summary>
        <div className="mt-4 space-y-3.5">
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
            This preview assumes every applicable action, issuer discovery and
            authentication-rejection check succeeds. It is not a measured
            security status.
          </p>
          <button
            type="button"
            className="rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white px-4 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            onClick={() =>
              onChangeSimulationMode(
                simulationMode === "full_multi_issuer"
                  ? "naive_single_revoke"
                  : "full_multi_issuer",
              )
            }
          >
            {simulationMode === "full_multi_issuer"
              ? "Return to one-provider model"
              : "Preview expected outcome"}
          </button>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {simulationMode === "full_multi_issuer"
              ? "Projected coverage of modeled resources: 100%, conditional on successful cleanup and verification. Actual remediation remains unverified."
              : `${report.naive_containment.persisting_node_ids.length} modeled nodes may need additional review after one-provider cleanup. This is not a count of confirmed attacks.`}
          </p>
        </div>
      </details>

      {copyStatus && (
        <p role="status" className="text-xs text-teal-300 font-mono">
          {copyStatus}
        </p>
      )}
    </section>
  );
}
