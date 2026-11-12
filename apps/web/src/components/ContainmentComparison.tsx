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
interface Props {
  report: AuditReport;
  simulationMode: SimulationMode;
  onChangeSimulationMode: (mode: SimulationMode) => void;
  showFullTableByDefault?: boolean;
}

export function ContainmentComparison({
  report,
  simulationMode,
  onChangeSimulationMode,
}: Props) {
  const [progress, setProgress] = useState<Record<number, Progress>>({});
  const [copyStatus, setCopyStatus] = useState("");
  const [errors, setErrors] = useState<Record<number, string>>({});
  const steps = report.full_containment.ordered_steps;
  const groups = [...new Set(steps.map((step) => step.issuer))];
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
        className="space-y-3 border-t border-[#1e2636] py-4"
      >
        <h3 className="font-semibold text-white">{target}</h3>
        <p className="text-slate-300">{details.guidance}</p>
        <p className="muted text-[13px] text-slate-400">Who can do this: {details.actor}.</p>
        {details.consoleUrl && (
          <a
            className="control"
            href={details.consoleUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open {details.providerLabel} settings
          </a>
        )}
        <p className="muted text-[13px] text-slate-400">
          If this is a conditional consequence, confirm the credential or
          artifact exists before taking action.
        </p>
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-[#2b3548] bg-[#0c1018] text-teal-400 focus:ring-teal-400"
            checked={status?.done ?? false}
            onChange={(event) =>
              change(step.priority, {
                done: event.target.checked,
                recorded: false,
              })
            }
          />
          <span className="text-slate-200">
            {status?.done
              ? "Marked done by you"
              : "Mark this review action done"}
          </span>
        </label>
        <details>
          <summary className="cursor-pointer text-teal-400 hover:text-teal-300">
            Technical instructions and verification
          </summary>
          <div className="mt-3 space-y-3">
            <p className="muted text-[13px] text-slate-400">
              Templates require the correct account, credential and privileges.
              ScopeBomb never runs these commands.
            </p>
            <pre className="whitespace-pre-wrap break-all rounded-md border border-[#1e2636] bg-[#090c13] p-3 text-[13px] font-mono text-teal-300">
              {details.copyableCommand}
            </pre>
            <button
              className="control"
              type="button"
              onClick={() => void copy(details.copyableCommand)}
            >
              Copy instructions
            </button>
            <p className="font-medium text-white">How to check</p>
            <p className="muted text-slate-300">{details.verificationProbe}</p>
            <p className="muted text-[13px] text-slate-400">{details.expectedStatus}</p>
            <p className="muted text-[13px] text-slate-400">{details.rfcNote}</p>
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
              className="space-y-2"
            >
              <label
                htmlFor={`evidence-${step.priority}`}
                className="block font-medium text-white"
              >
                Verification note (kept only in this tab)
              </label>
              <textarea
                id={`evidence-${step.priority}`}
                className="field"
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
                className="muted text-[13px] text-slate-400"
              >
                Record the outcome, not tokens or passwords. This is your
                evidence; ScopeBomb does not validate it.
              </p>
              <button className="control" type="submit">
                Record verification evidence
              </button>
              {errors[step.priority] && (
                <p
                  role="alert"
                  id={`note-error-${step.priority}`}
                  className="text-rose-400"
                >
                  {errors[step.priority]}
                </p>
              )}
            </form>
          </div>
        </details>
        <p role="status" className="text-[13px] font-medium text-teal-300">
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
    <section aria-label="Recommended cleanup checklist" className="space-y-5">
      <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-4">
        <h2 className="font-semibold text-amber-300">
          Remediation not verified
        </h2>
        <p className="mt-2 text-slate-200">
          These are recommended reviews for the modeled exposure. Checking a box
          records your progress only. ScopeBomb has not changed or tested an
          account.
        </p>
        <p className="muted mt-2 text-[13px] text-slate-400">
          Progress and evidence notes are kept in memory for this analysis and
          clear on a new analysis, reset or page refresh.
        </p>
      </div>
      {steps.length ? (
        <>
          <p className="muted text-slate-300">
            Start with confirmed exposure at known issuers. Then investigate
            conditional downstream credentials.{" "}
            <span className="font-mono text-teal-400">{Object.values(progress).filter((item) => item.done).length} of{" "}
            {steps.length}</span> review actions marked done by you.
          </p>
          {groups.map((issuer) => (
            <details
              key={issuer}
              className="border-t border-[#1e2636]"
            >
              <summary className="cursor-pointer py-4 font-semibold text-white hover:text-teal-300 transition-colors">
                {issuer} —{" "}
                {steps.filter((step) => step.issuer === issuer).length} review
                actions
              </summary>
              <ul>
                {steps.filter((step) => step.issuer === issuer).map(renderStep)}
              </ul>
            </details>
          ))}
        </>
      ) : (
        <p className="muted text-slate-400">
          No credential cleanup steps were generated. Review scan coverage and
          unsupported data before deciding whether further inspection is needed.
        </p>
      )}
      <details className="border-t border-[#1e2636] pt-2">
        <summary className="cursor-pointer text-teal-400 hover:text-teal-300">
          Preview the modeled outcome
        </summary>
        <div className="mt-3 space-y-3">
          <p className="muted text-slate-400">
            This preview assumes every applicable action, issuer discovery and
            authentication-rejection check succeeds. It is not a measured
            security status.
          </p>
          <button
            type="button"
            className="control"
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
          <p className="text-slate-300">
            {simulationMode === "full_multi_issuer"
              ? "Projected coverage of modeled resources: 100%, conditional on successful cleanup and verification. Actual remediation remains unverified."
              : `${report.naive_containment.persisting_node_ids.length} modeled nodes may need additional review after one-provider cleanup. This is not a count of confirmed attacks.`}
          </p>
        </div>
      </details>
      <p role="status" className="muted text-[13px] text-teal-300">
        {copyStatus}
      </p>
    </section>
  );
}
