"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, Check, Copy } from "@phosphor-icons/react";
import type { AuditReport, SimulationMode } from "@contracts/index";
import { getIncidentPresets, type IncidentPresetSummary } from "@/lib/auditAdapter";
import { analyzeInput, type Analysis } from "@/lib/analysis";
import { InputAndPresetBar, DEMO_PKCE_TRAP_URL } from "./InputAndPresetBar";
import { PresetStrip } from "./PresetStrip";
import { StepStepper, type WorkflowStep } from "./StepStepper";
import { Step1ScanVerdict } from "./Step1ScanVerdict";
import { Step2AttackPath } from "./Step2AttackPath";
import { Step3FixBlocker } from "./Step3FixBlocker";
import { HowItWorksModal } from "./HowItWorksModal";

const presets = getIncidentPresets();

export function ScopeBombArena({ initialReport }: { initialReport: AuditReport }) {
  const [analysis, setAnalysis] = useState<Analysis>({ report: initialReport, context: { kind: "sample", label: "Illustrative Shadow-AI MCP + OAuth scenario", evidence: [
    ...(initialReport.parsed_oauth?.requested_scopes ?? []).map(scope => ({ source: "Sample preset", subject: scope, kind: "permission" as const, detail: "Illustrative requested permission from the preset, not observed access." })),
    ...initialReport.shadow_secrets.map(finding => ({ source: "Sample preset", subject: finding.key_name, kind: "credential" as const, detail: "Illustrative redacted credential from the preset; not a finding in your files." })),
  ], warnings: ["Sample scenario, not a scan of your accounts. Select another scenario or check your own input above."] } });
  const [simulationMode, setSimulationMode] = useState<SimulationMode>("naive_single_revoke");
  const [activeStep, setActiveStep] = useState<WorkflowStep>(1);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [activeOAuthUrl, setActiveOAuthUrl] = useState<string | null>(presets[0]?.sample_oauth_url ?? null);
  const [initialUrl, setInitialUrl] = useState<string | null>(null);
  const [inputEpoch, setInputEpoch] = useState(0);
  const [draftChanged, setDraftChanged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [error, setError] = useState("");

  const acceptAnalysis = (next: Analysis, url?: string) => {
    setAnalysis(next); setActiveOAuthUrl(url ?? null); setDraftChanged(false); setError(""); setSimulationMode("naive_single_revoke");
  };
  const inspectUrl = (url: string) => {
    try { acceptAnalysis(analyzeInput({ mode: "oauth_url", raw_payload: url, simulation_mode: "naive_single_revoke" }, "Supplied permission link"), url); }
    catch { setError("This authorization URL is unsupported or malformed. The last completed result is retained."); }
  };
  const selectPreset = (preset: IncidentPresetSummary) => {
    const next = analyzeInput({ mode: "incident_preset", raw_payload: "", preset_id: preset.preset_id, simulation_mode: "naive_single_revoke" }, preset.title, "sample");
    next.context.warnings.push("Illustrative incident scenario. The modeled resources are not observed compromise in your accounts.");
    acceptAnalysis(next, preset.sample_oauth_url); setInitialUrl(null); setInputEpoch(value => value + 1); setBusy(false); setActiveStep(1);
  };
  const changeStep = (step: WorkflowStep) => { setActiveStep(step); window.scrollTo({ top: 0 }); };
  useEffect(() => {
    const url = new URLSearchParams(window.location.search).get("oauth_url");
    if (!url) return;
    setInitialUrl(url); setInputEpoch(value => value + 1); inspectUrl(url);
    // The extension handoff is read only once; subsequent edits remain local.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="min-h-screen bg-[#f9fbfc] p-3 text-[#131416] sm:p-5 lg:p-7"><div className="mx-auto max-w-[1440px] rounded-[16px] border border-[#e8eaec] bg-white">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8eaec] px-5 py-4">
      <div><strong className="text-[16px]">ScopeBomb</strong><p className="text-[13px] text-[#5d5f60]">Understand what app permissions and exposed credentials could reach.</p></div>
      <div className="flex flex-wrap gap-2"><button type="button" className="control" onClick={() => setHowItWorksOpen(true)}>How 3 tools connect <ArrowRight size={14} /></button><button type="button" aria-label="Copy local CLI command" className="control" onClick={async () => { try { await navigator.clipboard.writeText("node packages/engine/cli.ts . --json"); setCopiedCli(true); } catch { setError("Clipboard unavailable. CLI: node packages/engine/cli.ts . --json"); } }}>{copiedCli ? <Check size={14} /> : <Copy size={14} />}<span className="hidden sm:inline">Copy local CLI command</span></button></div>
    </header>
    <StepStepper activeStep={activeStep} onChangeStep={changeStep} />
    <main>
      {error && <p role="alert" className="px-5 py-3 text-[#831c1e]">{error}</p>}
      <section hidden={activeStep !== 1} className="space-y-5 p-5 sm:p-7">
        <div><h1 className="text-[22px] font-semibold">Check app permissions or developer credentials</h1><p className="mt-1 text-[#5d5f60]">See the evidence, possible exposure and actions to review.</p></div>
        <InputAndPresetBar key={inputEpoch} initialUrl={initialUrl} onAnalyze={acceptAnalysis} onInvalidate={() => setDraftChanged(true)} onBusy={setBusy} />
        <PresetStrip presets={presets} activePresetId={analysis.report.preset_id ?? null} onSelectPreset={selectPreset} />
        {(draftChanged || busy) && <p role="status" className="text-[#92400e]">Showing the last completed result for {analysis.context.label}. {busy ? "The new repository check is running." : "Edited input has not produced a new result."}</p>}
        <p className="break-words text-[13px] text-[#5d5f60]">Result source: {analysis.context.kind === "sample" ? "Sample simulation" : analysis.context.kind === "repository" ? "Selected public repository files" : "Your supplied input"} — {analysis.context.label}</p>
        {activeStep === 1 && <Step1ScanVerdict analysis={analysis} onContinue={() => changeStep(2)} />}
      </section>
      {activeStep === 2 && <Step2AttackPath report={analysis.report} simulationMode={simulationMode} onChangeSimulationMode={setSimulationMode} onBack={() => changeStep(1)} onContinue={() => changeStep(3)} />}
      {activeStep === 3 && <Step3FixBlocker key={JSON.stringify(analysis.report)} report={analysis.report} simulationMode={simulationMode} activeOAuthUrl={activeOAuthUrl} onChangeSimulationMode={setSimulationMode} onInspectUrl={inspectUrl} onBack={() => changeStep(2)} />}
    </main>
    <footer className="border-t border-[#e8eaec] px-5 py-4 text-[13px] text-[#5d5f60]">ScopeBomb · INNOVEX 2026 · Potential exposure only. No live account changes or verification probes are executed.</footer>
    <HowItWorksModal open={howItWorksOpen} onClose={() => setHowItWorksOpen(false)} onOpenSimulator={() => changeStep(2)} onOpenPkceGuard={() => { inspectUrl(DEMO_PKCE_TRAP_URL); changeStep(3); }} onLoadMcpSample={() => { const preset = presets[0]; if (preset) selectPreset(preset); }} />
  </div></div>;
}
