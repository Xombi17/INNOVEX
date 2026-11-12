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
    navigating.current = true;
  };
  const startInput = () => {
    setWalkthrough("off");
    setEntry("input");
    setAnalysis(null);
    setUrl(null);
    setInitialUrl(null);
    setNotice("");
    go(1);
    navigating.current = true;
  };
  const invalidate = () => {
    setWalkthrough("off");
    setAnalysis(null);
    setUrl(null);
    setNotice("");
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
        // A guide reveals the actual content, including any closed disclosure ancestors.
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
            <div className="px-5 py-6 sm:px-10 sm:py-8">
              <div className="max-w-[780px]">
                <div className="mb-2.5 inline-flex items-center gap-2 rounded-full bg-[#e6f2f5] px-3 py-0.5 text-xs font-semibold text-[#155768]">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#1b6c80] animate-pulse" />
                  AI Security &amp; Non-Human Identity Firewall
                </div>
                <h1
                  tabIndex={-1}
                  className="text-[26px] font-bold leading-tight tracking-tight text-[#131416] sm:text-[32px]"
                >
                  One rogue AI permission can compromise your entire stack.
                </h1>
                <p className="mt-2.5 max-w-[68ch] text-[15px] leading-relaxed text-[#45474a]">
                  When you click <span className="font-semibold text-[#131416]">“Allow”</span> on an AI bot or paste an API token, you aren't just granting one permission. You could be opening a backdoor from Google Drive straight into GitHub repositories and production cloud infrastructure.
                </p>
              </div>

              {/* Visual Domino Chain Preview */}
              <div className="mt-5 rounded-lg border border-[#dce0e3] bg-[#f9fbfc] p-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5d5f60]">
                  The OAuth Domino Effect (How breaches cascade)
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-4 sm:items-center text-center">
                  <div className="rounded border border-[#e8eaec] bg-white p-2 shadow-sm">
                    <div className="text-base">🤖</div>
                    <div className="text-xs font-bold text-[#131416]">1. Rogue AI Bot</div>
                    <div className="text-[11px] text-[#5d5f60]">Requests Drive scope</div>
                  </div>
                  <div className="hidden sm:block text-xs font-bold text-[#8a8d91]">➔</div>
                  <div className="rounded border border-[#fcd34d] bg-[#fefce8] p-2 shadow-sm">
                    <div className="text-base">📂</div>
                    <div className="text-xs font-bold text-[#92400e]">2. Drive Search</div>
                    <div className="text-[11px] text-[#78350f]">Finds backup / .env key</div>
                  </div>
                  <div className="hidden sm:block text-xs font-bold text-[#8a8d91]">➔</div>
                  <div className="rounded border border-[#fca5a5] bg-[#fef2f2] p-2 shadow-sm">
                    <div className="text-base">🔑</div>
                    <div className="text-xs font-bold text-[#991b1b]">3. GitHub Token</div>
                    <div className="text-[11px] text-[#7f1d1d]">Accesses private repos</div>
                  </div>
                  <div className="hidden sm:block text-xs font-bold text-[#8a8d91]">➔</div>
                  <div className="rounded border border-[#f87171] bg-[#fee2e2] p-2 shadow-sm">
                    <div className="text-base">☁️</div>
                    <div className="text-xs font-bold text-[#b91c1c]">4. Cloud Host Takeover</div>
                    <div className="text-[11px] text-[#991b1b]">Deploys malicious code</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border-2 border-[#131416] bg-white p-4 sm:p-5 shadow-sm">
                  <div className="inline-block rounded bg-[#131416] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                    Fastest Start (30s)
                  </div>
                  <h2 className="mt-1.5 text-base font-bold text-[#131416]">Take an interactive tour</h2>
                  <p className="mb-4 mt-1 text-[13px] text-[#45474a] leading-normal">
                    Simulate a realistic AI app compromise in under 30 seconds. Watch the live domino effect unfold and learn why naive “disconnect” buttons fail to contain attackers.
                  </p>
                  <button
                    className="control control-primary w-full py-2 text-center text-sm font-semibold"
                    type="button"
                    onClick={() => sample()}
                  >
                    Start guided tour
                  </button>
                </div>
                <div className="rounded-lg border border-[#dce0e3] bg-white p-4 sm:p-5 shadow-sm">
                  <div className="inline-block rounded bg-[#e8eaec] px-2 py-0.5 text-[10px] font-bold text-[#5d5f60] uppercase tracking-wide">
                    Live Audit
                  </div>
                  <h2 className="mt-1.5 text-base font-bold text-[#131416]">Review your input</h2>
                  <p className="mb-4 mt-1 text-[13px] text-[#45474a] leading-normal">
                    Paste your own OAuth consent URL, drop an .mcp.json or .env config, or scan any public GitHub repository. Parsed 100% locally with zero secret leakage.
                  </p>
                  <button
                    className="control w-full py-2 text-center text-sm font-semibold"
                    type="button"
                    onClick={startInput}
                  >
                    Check my configuration
                  </button>
                </div>
              </div>
              <p className="muted mt-5 max-w-[78ch] text-[12px]">
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
                    <details open={walkthrough !== "active"} className="border-t border-[#e8eaec] pt-2">
                      <summary className="cursor-pointer font-medium">Choose a different scenario</summary>
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
        <footer className="flex flex-wrap justify-between gap-3 border-t border-[#e8eaec] px-5 py-4 text-[13px] text-[#5d5f60] sm:px-7">
          <span>
            v1.1 · Local parsing · Rule-based analysis · No live account changes
          </span>
          <a
            href="/downloads/scopebomb-mv3-extension.zip"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1b6c80] underline"
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
