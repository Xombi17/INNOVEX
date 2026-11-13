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
import { LandingPage } from "./LandingPage";
import { ToolsCenter } from "./ToolsCenter";
import { AgentSwarmCenter } from "./AgentSwarmCenter";
import { ContainmentComparison } from "./ContainmentComparison";

export type AppTab = "overview" | "arena" | "swarm" | "remediation" | "tools";

const presets = getIncidentPresets();

function AgentChipSvg({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
    </svg>
  );
}

function FolderSearchSvg({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
      <circle cx="12" cy="13" r="2" />
      <path d="m14 15 2 2" />
    </svg>
  );
}

function KeySvg({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6M15.5 7.5l3 3M18.5 4.5l3 3" />
    </svg>
  );
}

function CloudTakeoverSvg({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      <path d="M12 12v6M9 15l3-3 3 3" />
    </svg>
  );
}

function ScopeBombLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  const [activeTab, setActiveTab] = useState<AppTab>("overview");
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

  const currentReport = analysis?.report ?? initialReport;

  const setTab = (newTab: AppTab) => {
    setActiveTab(newTab);
    const address = new URL(window.location.href);
    address.searchParams.set("tab", newTab);
    if (address.href !== window.location.href) {
      window.history.pushState(null, "", address);
    }
  };

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
    const tabParam = address.searchParams.get("tab") as AppTab | null;
    if (tabParam && ["overview", "arena", "swarm", "remediation", "tools"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTab("overview")}
              className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-white hover:text-blue-400 transition-colors"
            >
              <ScopeBombLogo />
              <span>ScopeBomb</span>
            </button>
            <span className="hidden sm:inline-block h-3.5 w-px bg-white/10" />
            <span className="hidden lg:inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              Non-Human Identity Firewall
            </span>
          </div>

          {/* DeepSeek & Harness Style Multi-Tab Navigation Bar */}
          <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto text-xs font-medium">
            <button
              type="button"
              onClick={() => setTab("overview")}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                activeTab === "overview"
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm shadow-blue-500/10 font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => {
                if (!analysis) sample();
                setTab("arena");
              }}
              className={`rounded-lg px-3 py-1.5 transition-all flex items-center gap-1.5 ${
                activeTab === "arena"
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm shadow-blue-500/10 font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <span>Threat Cockpit</span>
              <span className="rounded bg-rose-500/20 px-1 py-0.2 text-[9px] font-mono text-rose-300">Live</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!analysis) sample();
                setTab("swarm");
              }}
              className={`rounded-lg px-3 py-1.5 transition-all flex items-center gap-1.5 ${
                activeTab === "swarm"
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm shadow-blue-500/10 font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <span>4-Agent SOC</span>
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (!analysis) sample();
                setTab("remediation");
              }}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                activeTab === "remediation"
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm shadow-blue-500/10 font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              Containment
            </button>
            <button
              type="button"
              onClick={() => setTab("tools")}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                activeTab === "tools"
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm shadow-blue-500/10 font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              CLI & Extension
            </button>
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                sample();
                setTab("arena");
                go(2);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition active:scale-95"
            >
              <span>💥 Detonate</span>
            </button>
            <button
              type="button"
              className="control"
              onClick={() => setHelpOpen(true)}
            >
              About
            </button>
            {activeTab === "arena" && entry === "sample" && walkthrough === "off" && (
              <button
                type="button"
                className="control"
                onClick={() => {
                  setWalkthrough("active");
                  go(1);
                }}
              >
                Walkthrough
              </button>
            )}
            {activeTab === "arena" && entry !== "welcome" && (
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
                Reset
              </button>
            )}
          </div>
        </header>

        {activeTab === "arena" && entry !== "welcome" && (
          <StepStepper
            activeStep={step}
            hasAnalysis={!!analysis && !busy}
            onChangeStep={go}
          />
        )}

        <main id="main-content" ref={main} tabIndex={-1} className="flex-1">
          {activeTab === "overview" && (
            <LandingPage
              onLaunchCockpit={() => {
                if (!analysis) sample();
                setTab("arena");
              }}
              onDetonateSimulation={() => {
                sample();
                setTab("arena");
                go(2);
              }}
              onOpenSwarm={() => {
                if (!analysis) sample();
                setTab("swarm");
              }}
              onOpenRemediation={() => {
                if (!analysis) sample();
                setTab("remediation");
              }}
              onOpenTools={() => {
                setTab("tools");
              }}
            />
          )}

          {activeTab === "swarm" && (
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
              <div className="mb-6 flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-0.5 text-xs font-medium text-blue-400">
                  <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                  <span>Gemini 3.x Flash Defense Swarm</span>
                  <span className="font-mono text-[10px] text-blue-300">Live SOC Mesh</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      Autonomous Defensive Agent Swarm SOC
                    </h1>
                    <p className="mt-1 text-xs text-slate-400 max-w-2xl">
                      Four autonomous agents deliberate in parallel across IAM scope risks, MITRE tactics, RFC 7009 cascade validity, and incident synthesis.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sample();
                      setTab("arena");
                      go(2);
                    }}
                    className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition active:scale-95"
                  >
                    💥 Detonate Blast Attack
                  </button>
                </div>
              </div>
              <AgentSwarmCenter report={currentReport} />
            </div>
          )}

          {activeTab === "remediation" && (
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
              <div className="mb-6 flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-0.5 text-xs font-medium text-teal-400">
                  <span className="h-2 w-2 rounded-full bg-teal-400" />
                  <span>RFC 7009 Multi-Cloud Containment Engine</span>
                  <span className="font-mono text-[10px] text-teal-300">Tamper-Proof Receipts</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      Downstream Token Destruction & Active Verification Probes
                    </h1>
                    <p className="mt-1 text-xs text-slate-400 max-w-2xl">
                      Revoking initial OAuth returns HTTP 200 OK without cascading. Execute true downstream invalidation across AWS and GitHub, and run live verification probes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!analysis) sample();
                      setTab("arena");
                    }}
                    className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-500/20 transition"
                  >
                    View Threat Cockpit →
                  </button>
                </div>
              </div>
              <ContainmentComparison
                report={currentReport}
                simulationMode={simulation}
                onChangeSimulationMode={setSimulation}
              />
            </div>
          )}

          {activeTab === "tools" && (
            <ToolsCenter />
          )}

          {activeTab === "arena" && (
            <>
              {entry === "welcome" ? (
            <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
              {/* Hero */}
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-rose-300 mb-3">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                  </span>
                  RFC 7009 Security Blindspot · Zero Downstream Containment
                </div>
                <h1
                  tabIndex={-1}
                  className="text-2xl font-bold tracking-tight text-white sm:text-3xl sm:leading-tight"
                >
                  One rogue AI permission can compromise your entire cloud stack.
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-[15px]">
                  When you click <span className="font-semibold text-white">“Allow”</span> on an AI bot or paste an API token, permissions cascade across trust boundaries into repositories and production infrastructure. Standard “Disconnect” buttons only revoke the front door—leaving stolen cloud keys 100% active.
                </p>
              </div>

              {/* The Domino Pipeline (Open Architectural Bus) */}
              <div className="my-6 border-y border-white/[0.08] py-5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-mono font-medium uppercase tracking-wider text-slate-400">
                    The OAuth Domino Effect · Cascading Non-Human Identity Exposure
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[10px] text-rose-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                    Cascading Risk
                  </span>
                </div>

                <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-4 items-center">
                  <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-teal-500/10 text-teal-400">
                      <AgentChipSvg />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white">1. Rogue AI Agent</div>
                      <div className="truncate text-[11px] text-slate-400">Requests Drive scope</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-amber-500/10 text-amber-400">
                      <FolderSearchSvg />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white">2. Drive Search</div>
                      <div className="truncate text-[11px] text-slate-400">Finds backup / .env key</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-rose-500/10 text-rose-400">
                      <KeySvg />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white">3. GitHub Token</div>
                      <div className="truncate text-[11px] text-slate-400">Accesses private repos</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-red-500/10 text-red-400">
                      <CloudTakeoverSvg />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white">4. Cloud Takeover</div>
                      <div className="truncate text-[11px] text-slate-400">Deploys malicious code</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Start Options */}
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/[0.02] p-4 sm:p-5 transition hover:border-rose-500/60 shadow-lg shadow-rose-500/5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white sm:text-base">Detonate Attack Simulation</h2>
                    <span className="rounded bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 font-mono text-[10px] text-rose-300 font-semibold">Live Exploit Demo</span>
                  </div>
                  <p className="my-3 text-xs leading-relaxed text-slate-400 sm:text-[13px]">
                    Watch a rogue AI agent escalate from an innocent Google Drive grant into an AWS production takeover in under 5 seconds. See why clicking “Disconnect” fails to contain the attacker.
                  </p>
                  <button
                    className="control control-primary w-full py-2.5 text-center text-xs font-semibold sm:text-sm bg-gradient-to-r from-teal-500 to-emerald-500 text-black shadow-lg shadow-teal-500/20"
                    type="button"
                    onClick={() => {
                      sample();
                      go(2);
                    }}
                  >
                    💥 Detonate Attack Simulation
                  </button>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5 transition hover:border-white/[0.18]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white sm:text-base">Review your input</h2>
                    <span className="rounded bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 font-mono text-[10px] text-slate-400">Live Audit</span>
                  </div>
                  <p className="my-3 text-xs leading-relaxed text-slate-400 sm:text-[13px]">
                    Paste your own OAuth consent URL, drop an .mcp.json or .env config, or scan any public GitHub repository. Parsed 100% locally with zero secret leakage.
                  </p>
                  <button
                    className="control w-full py-2.5 text-center text-xs font-semibold sm:text-sm"
                    type="button"
                    onClick={startInput}
                  >
                    Check my configuration
                  </button>
                </div>
              </div>

              <p className="muted mt-4 text-[12px] text-slate-500">
                No sign-in required. ScopeBomb models possible exposure; it does
                not scan your accounts, prove compromise, or revoke access.
                Local configuration parsing stays in your browser.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl px-5 py-6 sm:px-8">
              {analysis && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3 text-xs">
                  <span className="break-all text-slate-300">
                    <strong className="text-white">
                      {analysis.context.kind === "sample"
                        ? "Sample simulation"
                        : "Your supplied input"}
                    </strong>{" "}
                    · {analysis.context.label}
                  </span>
                  <span className="font-mono text-slate-500">
                    {analysis.context.kind === "sample"
                      ? "Illustrative data; not your accounts"
                      : "Remediation not verified"}
                  </span>
                </div>
              )}

              <div
                role="status"
                className={notice ? "mb-4 rounded-md border border-amber-900/40 bg-amber-950/20 px-4 py-2.5 text-xs text-amber-300" : "sr-only"}
              >
                {notice}
              </div>

              <section
                data-step="1"
                hidden={step !== 1}
                className="space-y-6"
              >
                <div>
                  <h1 tabIndex={-1} className="text-xl font-bold text-white sm:text-2xl">
                    {entry === "sample"
                      ? "Explore the sample input"
                      : "Check your input"}
                  </h1>
                  <p className="muted mt-1 text-xs text-slate-400 sm:text-sm">
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
                    <details open={walkthrough !== "active"} className="border-t border-white/[0.08] pt-2">
                      <summary className="cursor-pointer text-xs font-medium text-slate-300 hover:text-white">Choose a different scenario</summary>
                      <div className="mt-2">
                        <PresetStrip
                          presets={presets}
                          activePresetId={analysis?.report.preset_id ?? null}
                          onSelectPreset={sample}
                        />
                      </div>
                    </details>
                    <button
                      className="control mt-2"
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
                    className="space-y-6"
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
                    className="space-y-6"
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
            </div>
          )}
            </>
          )}
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] px-6 py-4 text-xs text-slate-400 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-medium text-slate-300">ScopeBomb v1.2 Enterprise</span>
            <span>·</span>
            <span className="font-mono text-[11px] text-slate-500">RFC 7009 Strict · Zero Secret Leakage · Pure Zero-Dependency Core</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setTab("tools")}
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
            >
              CLI & Actions
            </button>
            <a
              href="/downloads/scopebomb-mv3-extension.zip"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300 underline underline-offset-2"
            >
              Download MV3 Extension
            </a>
          </div>
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
