"use client";
import React, { useEffect, useRef, useState } from "react";
import type { AuditReport, SimulationMode } from "@contracts/index";
import {
  getIncidentPresets,
  type IncidentPresetSummary,
} from "@/lib/auditAdapter";
import { analyzeInput, type Analysis } from "@/lib/analysis";
import { StepStepper, STEP_LABELS, type WorkflowStep } from "./StepStepper";
import { Step1ScanVerdict } from "./Step1ScanVerdict";
import { Step2AttackPath } from "./Step2AttackPath";
import { Step3FixBlocker } from "./Step3FixBlocker";
import { HowItWorksModal } from "./HowItWorksModal";
import { ScanInput } from "./ScanInput";
import { PresetStrip } from "./PresetStrip";

const presets = getIncidentPresets();
export function ScopeBombArena({
  initialReport,
}: {
  initialReport: AuditReport;
}) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [entry, setEntry] = useState<"welcome" | "input" | "sample">("welcome");
  const [step, setStep] = useState<WorkflowStep>(1);
  const [simulation, setSimulation] = useState<SimulationMode>(
    "naive_single_revoke",
  );
  const [helpOpen, setHelpOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [initialUrl, setInitialUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState(0);
  const main = useRef<HTMLElement>(null);
  const analysisRef = useRef<Analysis | null>(null);
  const navigating = useRef(false);
  analysisRef.current = analysis;
  const go = (next: WorkflowStep) => {
    if (next > 1 && !analysisRef.current) return;
    const address = new URL(window.location.href);
    address.searchParams.set("step", String(next));
    if (address.href !== window.location.href)
      window.history.pushState(null, "", address);
    navigating.current = true;
    setStep(next);
  };
  useEffect(() => {
    const address = new URL(window.location.href);
    const suppliedUrl = address.searchParams.get("oauth_url");
    if (suppliedUrl) {
      setInitialUrl(suppliedUrl);
      setEntry("input");
      try {
        const result = analyzeInput(
          {
            mode: "oauth_url",
            raw_payload: suppliedUrl,
            simulation_mode: "naive_single_revoke",
          },
          "Supplied permission link",
        );
        setAnalysis(result);
        setUrl(suppliedUrl);
      } catch {
        setNotice(
          "The supplied permission link could not be analyzed. Check it below and try again.",
        );
      }
      address.searchParams.delete("oauth_url");
    }
    address.searchParams.set("step", "1");
    window.history.replaceState(null, "", address);
    const back = () => {
      const requested = Number(
        new URLSearchParams(window.location.search).get("step"),
      );
      navigating.current = true;
      const next =
        analysisRef.current && (requested === 2 || requested === 3)
          ? requested
          : 1;
      setStep(next);
      if (requested !== next) {
        const address = new URL(window.location.href);
        address.searchParams.set("step", String(next));
        window.history.replaceState(null, "", address);
      }
    };
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, []);
  useEffect(() => {
    document.title = `ScopeBomb — ${entry === "welcome" ? "Check app access" : STEP_LABELS[step - 1]}`;
    if (navigating.current) {
      navigating.current = false;
      (entry === "welcome"
        ? main.current?.querySelector<HTMLElement>("h1")
        : main.current?.querySelector<HTMLElement>(`[data-step="${step}"] h1`)
      )?.focus();
      window.scrollTo({ top: 0 });
    }
  }, [step, entry]);
  const receive = (result: Analysis, oauthUrl?: string) => {
    setAnalysis(result);
    setUrl(oauthUrl ?? null);
    setSimulation("naive_single_revoke");
    setNotice("");
    setSession((previous) => previous + 1);
    go(1);
  };
  const sample = (preset: IncidentPresetSummary = presets[0]) => {
    if (!preset) return;
    setEntry("sample");
    setBusy(false);
    const result =
      preset.preset_id === initialReport.preset_id
        ? {
            report: initialReport,
            context: analyzeInput(
              {
                mode: "incident_preset",
                raw_payload: preset.sample_oauth_url,
                preset_id: preset.preset_id,
                simulation_mode: "naive_single_revoke",
              },
              preset.title,
              "sample",
            ).context,
          }
        : analyzeInput(
            {
              mode: "incident_preset",
              raw_payload: preset.sample_oauth_url,
              preset_id: preset.preset_id,
              simulation_mode: "naive_single_revoke",
            },
            preset.title,
            "sample",
          );
    receive(result, preset.sample_oauth_url);
    navigating.current = true;
  };
  const startInput = () => {
    setEntry("input");
    setAnalysis(null);
    setUrl(null);
    setInitialUrl(null);
    setNotice("");
    go(1);
    navigating.current = true;
  };
  const invalidate = () => {
    setAnalysis(null);
    setUrl(null);
    setNotice("");
  };
  return (
    <div className="min-h-screen bg-[#f9fbfc] p-3 text-[#131416] sm:p-6">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="mx-auto max-w-[1180px] overflow-hidden rounded-2xl border border-[#e8eaec] bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8eaec] px-5 py-4 sm:px-7">
          <a href="/" className="text-lg font-semibold tracking-tight">
            ScopeBomb
          </a>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="control"
              onClick={() => setHelpOpen(true)}
            >
              About this tool
            </button>
            {entry !== "welcome" && (
              <button
                type="button"
                className="control"
                onClick={() => {
                  setEntry("welcome");
                  invalidate();
                  setBusy(false);
                  go(1);
                  navigating.current = true;
                }}
              >
                Start over
              </button>
            )}
          </div>
        </header>
        {entry !== "welcome" && (
          <StepStepper
            activeStep={step}
            hasAnalysis={!!analysis && !busy}
            onChangeStep={go}
          />
        )}
        <main id="main-content" ref={main} tabIndex={-1}>
          {entry === "welcome" ? (
            <div className="px-5 py-10 sm:px-10 sm:py-16">
              <div className="max-w-[740px]">
                <p className="mb-4 text-sm font-medium text-[#1b6c80]">
                  App permissions and credential review
                </p>
                <h1
                  tabIndex={-1}
                  className="text-[32px] font-semibold leading-tight tracking-tight sm:text-[42px]"
                >
                  Understand what access you’re giving away.
                </h1>
                <p className="muted mt-5 max-w-[65ch] text-lg">
                  Check what access an app or exposed credential could provide,
                  and learn what to review. Start with an example or check your
                  own project configuration.
                </p>
              </div>
              <div className="mt-9 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[#a2cfd8] bg-[#f0f8fa] p-6">
                  <h2 className="text-lg font-semibold">See how it works</h2>
                  <p className="muted mb-5 mt-2">
                    Follow a sample app’s permissions through possible exposure
                    and a cleanup plan. No setup needed.
                  </p>
                  <button
                    className="control control-primary"
                    type="button"
                    onClick={() => sample()}
                  >
                    Try an example
                  </button>
                </div>
                <div className="rounded-xl border border-[#e8eaec] p-6">
                  <h2 className="text-lg font-semibold">Review your input</h2>
                  <p className="muted mb-5 mt-2">
                    Paste a configuration, inspect an app permission link, or
                    check selected files in a public repository.
                  </p>
                  <button
                    className="control"
                    type="button"
                    onClick={startInput}
                  >
                    Check my configuration
                  </button>
                </div>
              </div>
              <p className="muted mt-7 max-w-[78ch] text-[13px]">
                No sign-in required. ScopeBomb models possible exposure; it does
                not scan your accounts, prove compromise, or revoke access.
                Local configuration parsing stays in your browser.
              </p>
            </div>
          ) : (
            <>
              {analysis && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e8eaec] bg-[#f4f6f8] px-5 py-3 text-[13px] sm:px-7">
                  <span className="break-all">
                    <strong>
                      {analysis.context.kind === "sample"
                        ? "Sample simulation"
                        : "Your supplied input"}
                    </strong>{" "}
                    · {analysis.context.label}
                  </span>
                  <span>
                    {analysis.context.kind === "sample"
                      ? "Illustrative data; not your accounts"
                      : "Remediation not verified"}
                  </span>
                </div>
              )}
              <div
                role="status"
                className={notice ? "px-5 py-3 text-[#855306]" : "sr-only"}
              >
                {notice}
              </div>
              <section
                data-step="1"
                hidden={step !== 1}
                className="space-y-6 p-5 sm:p-7"
              >
                <div>
                  <h1 tabIndex={-1} className="text-2xl font-semibold">
                    {entry === "sample"
                      ? "Explore the sample input"
                      : "Check your input"}
                  </h1>
                  <p className="muted mt-2">
                    {entry === "sample"
                      ? "These scenarios illustrate possible exposure. They are not forensic reconstructions or findings about your accounts."
                      : "Choose one input. We’ll separate evidence in it from possible consequences."}
                  </p>
                </div>
                {entry === "input" ? (
                  <ScanInput
                    initialUrl={initialUrl}
                    onAnalyze={receive}
                    onInvalidate={invalidate}
                    onBusy={setBusy}
                  />
                ) : (
                  <>
                    <PresetStrip
                      presets={presets}
                      activePresetId={analysis?.report.preset_id ?? null}
                      onSelectPreset={sample}
                    />
                    <button
                      className="control"
                      type="button"
                      onClick={startInput}
                    >
                      Check my configuration instead
                    </button>
                  </>
                )}
                {analysis && (
                  <Step1ScanVerdict
                    key={session}
                    analysis={analysis}
                    onContinue={() => go(2)}
                  />
                )}
              </section>
              {analysis && (
                <>
                  <section
                    hidden={step !== 2}
                    data-step="2"
                    className="p-5 sm:p-7"
                  >
                    <Step2AttackPath
                      key={session}
                      report={analysis.report}
                      simulationMode={simulation}
                      onChangeSimulationMode={setSimulation}
                      onBack={() => go(1)}
                      onContinue={() => go(3)}
                    />
                  </section>
                  <section
                    hidden={step !== 3}
                    data-step="3"
                    className="p-5 sm:p-7"
                  >
                    <Step3FixBlocker
                      key={session}
                      report={analysis.report}
                      simulationMode={simulation}
                      activeOAuthUrl={url}
                      onChangeSimulationMode={setSimulation}
                      onInspectUrl={(next) => {
                        receive(
                          analyzeInput(
                            {
                              mode: "oauth_url",
                              raw_payload: next,
                              simulation_mode: "naive_single_revoke",
                            },
                            "Scope recommendation preview",
                            analysis.context.kind === "sample"
                              ? "sample"
                              : "custom",
                          ),
                          next,
                        );
                      }}
                      onBack={() => go(2)}
                    />
                  </section>
                </>
              )}
            </>
          )}
        </main>
        <footer className="flex flex-wrap justify-between gap-3 border-t border-[#e8eaec] px-5 py-4 text-[13px] text-[#5d5f60] sm:px-7">
          <span>
            Local parsing · Rule-based analysis · No live account changes
          </span>
          <a
            href="https://github.com/Xombi17/INNOVEX"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1b6c80] underline"
          >
            Source and setup instructions
          </a>
        </footer>
      </div>
      <HowItWorksModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        onOpenSimulator={() => sample()}
        onOpenPkceGuard={() => {
          sample();
          go(3);
        }}
        onLoadMcpSample={() => sample()}
      />
    </div>
  );
}
