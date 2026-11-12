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
import { GuidedWalkthrough } from "./GuidedWalkthrough";

const presets = getIncidentPresets();

function AgentChipSvg({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
    </svg>
  );
}

function FolderSearchSvg({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      <circle cx="12" cy="13" r="2" />
      <path d="m14 15 2 2" />
    </svg>
  );
}

function KeySvg({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6M15.5 7.5l3 3M18.5 4.5l3 3" />
    </svg>
  );
}

function CloudTakeoverSvg({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      <path d="M12 12v6M9 15l3-3 3 3" />
    </svg>
  );
}

function FlowArrowSvg({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function ScopeBombLogo({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" fill="#00d2b4" stroke="#00d2b4" />
      <path d="m4.93 4.93 4.24 4.24M14.83 14.83l4.24 4.24M14.83 9.17l4.24-4.24M4.93 19.07l4.24-4.24" />
    </svg>
  );
}

export function ScopeBombArena({
  initialReport,
}: {
  initialReport: AuditReport;
}) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [entry, setEntry] = useState<"welcome" | "input" | "sample">("welcome");
  const [walkthrough, setWalkthrough] = useState<"active" | "complete" | "off">("off");
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
  const clearGuideLink = () => {
    main.current
      ?.querySelectorAll('[aria-describedby="walkthrough-guide"]')
      .forEach((node) => node.removeAttribute("aria-describedby"));
  };
  const go = (next: WorkflowStep) => {
    if (next > 1 && !analysisRef.current) return;
    clearGuideLink();
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
      const panel = main.current?.querySelector<HTMLElement>(`[data-step="${step}"]`);
      panel?.getAnimations().forEach((animation) => animation.cancel());
      if (
        main.current?.closest("[data-input]")?.getAttribute("data-input") === "pointer" &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        panel?.animate(
          [{ opacity: 0.65, transform: "translateY(4px)" }, { opacity: 1, transform: "translateY(0)" }],
          { duration: 180, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        );
      }
    }
  }, [step, entry, walkthrough, session]);
  const receive = (result: Analysis, oauthUrl?: string) => {
    setWalkthrough("off");
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
    setWalkthrough("active");
  };
  const startInput = () => {
    setWalkthrough("off");
    setEntry("input");
    setAnalysis(null);
    setUrl(null);
    setNotice("");
    setBusy(false);
    go(1);
  };
  const invalidate = () => {
    clearGuideLink();
    setAnalysis(null);
    setUrl(null);
    setNotice("");
    if (step > 1) go(1);
  };
  const guidance = entry === "sample" && walkthrough !== "off" ? (
    <GuidedWalkthrough
      step={step}
      complete={walkthrough === "complete"}
      onStep={go}
      onFinish={() => {
        clearGuideLink();
        setWalkthrough("complete");
      }}
      onExit={() => {
        clearGuideLink();
        setWalkthrough("off");
        navigating.current = true;
      }}
      onStartInput={startInput}
      onReveal={(event) => {
        clearGuideLink();
        const target = main.current?.querySelector<HTMLElement>(
          `[data-step="${step}"] [data-guide-target="${["evidence", "exposure", "actions"][step - 1]}"]`,
        );
        if (!target) return;
        target.setAttribute("aria-describedby", "walkthrough-guide");
        for (let parent = target.parentElement; parent; parent = parent.parentElement) {
          if (parent instanceof HTMLDetailsElement) parent.open = true;
        }
        target.focus({ preventScroll: true });
        target.scrollIntoView({
          block: "start",
          behavior: event.detail > 0 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "instant",
        });
      }}
    />
  ) : null;
  return (
    <div
      className="workbench"
      data-input="keyboard"
      onPointerDownCapture={(event) => { event.currentTarget.dataset.input = "pointer"; }}
      onKeyDownCapture={(event) => { event.currentTarget.dataset.input = "keyboard"; }}
    >
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="workbench__surface">
        <header className="workbench__header">
          <a href="/" className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-white hover:text-teal-300 transition-colors">
            <ScopeBombLogo />
            <span>ScopeBomb</span>
          </a>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="control"
              onClick={() => setHelpOpen(true)}
            >
              About this tool
            </button>
            {entry === "sample" && walkthrough === "off" && (
              <button
                type="button"
                className="control"
                onClick={() => {
                  setWalkthrough("active");
                  go(1);
                }}
              >
                Resume walkthrough
              </button>
            )}
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
            <div className="px-5 py-5 sm:px-9 sm:py-6">
              <div className="max-w-[780px]">
                <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-teal-300">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
                  </span>
                  AI Security &amp; Non-Human Identity Firewall
                </div>
                <h1
                  tabIndex={-1}
                  className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-[30px]"
                >
                  One rogue AI permission can compromise your entire stack.
                </h1>
                <p className="mt-2 max-w-[68ch] text-[14.5px] leading-relaxed text-slate-300">
                  When you click <span className="font-semibold text-white">“Allow”</span> on an AI bot or paste an API token, you aren't just granting one permission. You could be opening a backdoor from Google Drive straight into GitHub repositories and production cloud infrastructure.
                </p>
              </div>

              {/* Visual Domino Chain Preview */}
              <div className="mt-4 rounded-xl border border-white/10 bg-[#090d14]/90 p-3 sm:p-3.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                    The OAuth Domino Effect · Cascading Non-Human Identity Exposure
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-mono text-rose-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                    Cascading Risk
                  </span>
                </div>
                <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center text-center">
                  <div className="rounded-lg border border-teal-500/30 bg-teal-950/20 p-2 shadow-sm transition hover:border-teal-500/50">
                    <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-md bg-teal-500/15 text-[#00d2b4]">
                      <AgentChipSvg />
                    </div>
                    <div className="mt-1 text-xs font-bold text-slate-200">1. Rogue AI Agent</div>
                    <div className="text-[11px] text-slate-400">Requests Drive scope</div>
                  </div>
                  <div className="hidden sm:flex justify-center text-slate-500">
                    <FlowArrowSvg className="text-teal-400/60" />
                  </div>
                  <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-2 shadow-sm transition hover:border-amber-500/50">
                    <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/15 text-amber-400">
                      <FolderSearchSvg />
                    </div>
                    <div className="mt-1 text-xs font-bold text-amber-200">2. Drive Search</div>
                    <div className="text-[11px] text-amber-300/70">Finds backup / .env key</div>
                  </div>
                  <div className="hidden sm:flex justify-center text-slate-500">
                    <FlowArrowSvg className="text-amber-400/60" />
                  </div>
                  <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-2 shadow-sm transition hover:border-rose-500/50">
                    <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-md bg-rose-500/15 text-rose-400">
                      <KeySvg />
                    </div>
                    <div className="mt-1 text-xs font-bold text-rose-200">3. GitHub Token</div>
                    <div className="text-[11px] text-rose-300/70">Accesses private repos</div>
                  </div>
                  <div className="hidden sm:flex justify-center text-slate-500">
                    <FlowArrowSvg className="text-rose-400/60" />
                  </div>
                  <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-2 shadow-sm transition hover:border-red-500/60">
                    <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-md bg-red-500/20 text-red-400">
                      <CloudTakeoverSvg />
                    </div>
                    <div className="mt-1 text-xs font-bold text-red-200">4. Cloud Takeover</div>
                    <div className="text-[11px] text-red-300/70">Deploys malicious code</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                <div className="rounded-xl border border-teal-500/40 bg-gradient-to-b from-[#141926] to-[#0e121a] p-4 sm:p-5 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-[0_0_24px_rgba(0,210,180,0.15)]">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-teal-300">
                    Fastest Start (30s)
                  </div>
                  <h2 className="mt-2 text-base font-bold text-white">Take an interactive tour</h2>
                  <p className="mb-4 mt-1 text-[13px] leading-relaxed text-slate-300">
                    Simulate a realistic AI app compromise in under 30 seconds. Watch the live domino effect unfold and learn why naive “disconnect” buttons fail to contain attackers.
                  </p>
                  <button
                    className="control control-primary w-full py-2.5 text-center text-sm font-semibold"
                    type="button"
                    onClick={() => sample()}
                  >
                    Start guided tour
                  </button>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#111520] p-4 sm:p-5 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-slate-300">
                    Live Audit
                  </div>
                  <h2 className="mt-2 text-base font-bold text-white">Review your input</h2>
                  <p className="mb-4 mt-1 text-[13px] leading-relaxed text-slate-300">
                    Paste your own OAuth consent URL, drop an .mcp.json or .env config, or scan any public GitHub repository. Parsed 100% locally with zero secret leakage.
                  </p>
                  <button
                    className="control w-full py-2.5 text-center text-sm font-semibold"
                    type="button"
                    onClick={startInput}
                  >
                    Check my configuration
                  </button>
                </div>
              </div>
              <p className="muted mt-4 max-w-[78ch] text-[12px]">
                No sign-in required. ScopeBomb models possible exposure; it does
                not scan your accounts, prove compromise, or revoke access.
                Local configuration parsing stays in your browser.
              </p>
            </div>
          ) : (
            <>
              {analysis && (
                <div className="analysis-context">
                  <span className="break-all">
                    <strong className="text-white">
                      {analysis.context.kind === "sample"
                        ? "Sample simulation"
                        : "Your supplied input"}
                    </strong>{" "}
                    · {analysis.context.label}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    {analysis.context.kind === "sample"
                      ? "Illustrative data; not your accounts"
                      : "Remediation not verified"}
                  </span>
                </div>
              )}
              <div
                role="status"
                className={notice ? "px-5 py-3 text-amber-300 bg-amber-950/30 border-b border-amber-900/50" : "sr-only"}
              >
                {notice}
              </div>
              <section
                data-step="1"
                hidden={step !== 1}
                className="space-y-6 p-5 sm:p-7"
              >
                <div>
                  <h1 tabIndex={-1} className="text-2xl font-semibold text-white">
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
                {step === 1 && guidance}
                {entry === "input" ? (
                  <ScanInput
                    initialUrl={initialUrl}
                    onAnalyze={receive}
                    onInvalidate={invalidate}
                    onBusy={setBusy}
                  />
                ) : (
                  <>
                    <details open={walkthrough !== "active"} className="border-t border-[#1f2838] pt-2">
                      <summary className="cursor-pointer font-medium text-white hover:text-teal-300 transition-colors">Choose a different scenario</summary>
                      <div className="mt-3">
                        <PresetStrip
                          presets={presets}
                          activePresetId={analysis?.report.preset_id ?? null}
                          onSelectPreset={sample}
                        />
                      </div>
                    </details>
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
                      guidance={step === 2 ? guidance : null}
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
                      guidance={step === 3 ? guidance : null}
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
        <footer className="flex flex-wrap justify-between gap-3 border-t border-[#1e2636] px-5 py-4 text-[13px] text-slate-400 sm:px-7">
          <span>
            v1.1 · Local parsing · Rule-based analysis · No live account changes
          </span>
          <a
            href="/downloads/scopebomb-mv3-extension.zip"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-400 hover:text-teal-300 underline"
          >
            Download Chrome extension
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
