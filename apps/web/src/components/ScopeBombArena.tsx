"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowSquareOut,
  Check,
  Copy,
  TerminalWindow,
} from "@phosphor-icons/react";
import type { AuditInput, AuditReport, SimulationMode } from "@contracts/index";
import {
  getIncidentPresets,
  type IncidentPresetSummary,
  tryRunScopeBombAudit,
} from "@/lib/auditAdapter";
import { StepStepper } from "./StepStepper";
import { Step1ScanVerdict } from "./Step1ScanVerdict";
import { Step2AttackPath } from "./Step2AttackPath";
import { Step3FixBlocker } from "./Step3FixBlocker";
import { HowItWorksModal } from "./HowItWorksModal";
import { DEMO_PKCE_TRAP_URL } from "./InputAndPresetBar";

interface ScopeBombArenaProps {
  initialReport: AuditReport;
}

const presets = getIncidentPresets();

const PRESET_SHORT_NAMES: Record<string, string> = {
  rohan_mcp_oauth_trap: "Shadow-AI MCP + OAuth",
  midnight_blizzard_2024: "Midnight Blizzard",
  salesloft_drift_2025: "Salesloft Drift fan-out",
  context_ai_vercel_2026: "Context.ai Workspace",
  litellm_ci_2026: "LiteLLM CI key leak",
};

export function ScopeBombArena({ initialReport }: ScopeBombArenaProps) {
  const [report, setReport] = useState<AuditReport>(initialReport);
  const [simulationMode, setSimulationMode] = useState<SimulationMode>(
    "naive_single_revoke",
  );
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [externalOAuthUrl, setExternalOAuthUrl] = useState<string | null>(null);
  const [activeOAuthUrl, setActiveOAuthUrl] = useState<string | null>(
    presets[0]?.sample_oauth_url ?? null,
  );
  const [copiedCli, setCopiedCli] = useState(false);
  const [interceptedBanner, setInterceptedBanner] = useState(false);

  const handleRunAudit = (input: AuditInput) => {
    const result = tryRunScopeBombAudit(input);
    if (!result.ok) {
      setInputError(result.error);
      return;
    }

    setInputError(null);
    setReport(result.report);
    setSimulationMode(input.simulation_mode);

    if (input.mode === "oauth_url") {
      setActiveOAuthUrl(input.raw_payload);
    } else if (input.mode === "incident_preset") {
      const preset = presets.find(
        (p) => p.preset_id === (input.preset_id ?? result.report.preset_id),
      );
      setActiveOAuthUrl(preset?.sample_oauth_url ?? null);
    } else {
      setActiveOAuthUrl(null);
    }
  };

  const handleInspectUrl = (url: string) => {
    setExternalOAuthUrl(url);
    handleRunAudit({
      mode: "oauth_url",
      raw_payload: url,
      preset_id: null,
      simulation_mode: simulationMode,
    });
  };

  const handleSelectPreset = (preset: IncidentPresetSummary) => {
    setInputError(null);
    handleRunAudit({
      mode: "incident_preset",
      raw_payload: preset.sample_oauth_url,
      preset_id: preset.preset_id,
      simulation_mode: "naive_single_revoke",
    });
  };

  const handleCopyCli = async () => {
    try {
      await navigator.clipboard.writeText("node packages/engine/cli.ts . --json");
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(false), 1600);
    } catch {
      // Clipboard optional in headless/restricted environments
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramUrl = params.get("oauth_url");
    if (paramUrl && paramUrl.trim()) {
      setExternalOAuthUrl(paramUrl);
      setInterceptedBanner(true);
      const result = tryRunScopeBombAudit({
        mode: "oauth_url",
        raw_payload: paramUrl,
        preset_id: null,
        simulation_mode: "naive_single_revoke",
      });
      if (result.ok) {
        setInputError(null);
        setReport(result.report);
        setActiveOAuthUrl(paramUrl);
      } else {
        setInputError(result.error);
      }
    }
  }, []);

  const activePreset = presets.find((p) => p.preset_id === report.preset_id);
  const scenarioBreadcrumb = activePreset
    ? `${PRESET_SHORT_NAMES[activePreset.preset_id] ?? activePreset.title} (${activePreset.year})`
    : report.input_mode === "oauth_url"
      ? "Custom OAuth URL scan"
      : report.input_mode === "mcp_config"
        ? "Local config scan"
        : "Google Takeout audit";

  return (
    <div className="min-h-screen bg-[#f9fbfc] text-[#131416] antialiased">
      <div className="mx-auto max-w-[1440px] p-3 sm:p-5 lg:p-7">
        <div className="rounded-[16px] border border-[#e8eaec] bg-[#ffffff] shadow-sm">
          {/* Header Bar */}
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8eaec] px-5 py-3.5">
            <div className="flex flex-wrap items-center gap-2 text-[14px]">
              <span className="font-semibold tracking-tight text-[#131416]">
                ScopeBomb
              </span>
              <span className="text-[#cdced1]">/</span>
              <span className="text-[13px] text-[#5d5f60]">
                {scenarioBreadcrumb}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setHowItWorksOpen(true)}
                className="text-[13px] font-medium text-[#1b6c80] hover:underline"
              >
                How 3 Tools Connect →
              </button>
              <button
                type="button"
                onClick={handleCopyCli}
                className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[#e8eaec] bg-[#ffffff] px-2.5 text-[13px] font-medium text-[#131416] transition hover:bg-[#f4f6f8]"
              >
                <TerminalWindow size={14} className="text-[#5d5f60]" />
                <span className="hidden sm:inline">CLI Command</span>
                {copiedCli ? (
                  <Check size={14} className="text-[#1e7b4f]" />
                ) : (
                  <Copy size={14} className="text-[#5d5f60]" />
                )}
              </button>
            </div>
          </header>

          {/* 3-Step Stepper Navigation */}
          <StepStepper
            activeStep={activeStep}
            onChangeStep={(step) => setActiveStep(step)}
          />

          {/* Active Step Content */}
          <main>
            {activeStep === 1 && (
              <Step1ScanVerdict
                report={report}
                simulationMode={simulationMode}
                presets={presets}
                inputError={inputError}
                externalOAuthUrl={externalOAuthUrl}
                interceptedBanner={interceptedBanner}
                onRunAudit={handleRunAudit}
                onClearError={() => setInputError(null)}
                onSelectPreset={handleSelectPreset}
                onContinue={() => setActiveStep(2)}
              />
            )}

            {activeStep === 2 && (
              <Step2AttackPath
                report={report}
                simulationMode={simulationMode}
                onChangeSimulationMode={setSimulationMode}
                onBack={() => setActiveStep(1)}
                onContinue={() => setActiveStep(3)}
              />
            )}

            {activeStep === 3 && (
              <Step3FixBlocker
                report={report}
                simulationMode={simulationMode}
                activeOAuthUrl={activeOAuthUrl}
                onChangeSimulationMode={setSimulationMode}
                onInspectUrl={handleInspectUrl}
                onBack={() => setActiveStep(2)}
              />
            )}
          </main>

          {/* Minimal Workbench Footer */}
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e8eaec] px-5 py-4 text-[13px] leading-[1.45] text-[#5d5f60]">
            <span>
              ScopeBomb · INNOVEX 2026 (PS 05) · Deterministic local-first simulation
              (zero live account changes)
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <span>
                CLI: <code>node packages/engine/cli.ts . --json</code>
              </span>
              <a
                href="https://github.com/Xombi17/INNOVEX"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-[#1b6c80] hover:underline"
              >
                GitHub &amp; Extension Source
                <ArrowSquareOut size={13} />
              </a>
            </div>
          </footer>
        </div>
      </div>

      {/* How it Works Modal */}
      <HowItWorksModal
        open={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
        onOpenSimulator={() => {
          setActiveStep(2);
        }}
        onOpenPkceGuard={() => {
          handleInspectUrl(DEMO_PKCE_TRAP_URL);
          setActiveStep(3);
        }}
        onLoadMcpSample={() => {
          const mcp = presets[0]?.sample_mcp_config;
          if (mcp) {
            handleRunAudit({
              mode: "mcp_config",
              raw_payload: mcp,
              preset_id: null,
              simulation_mode: "naive_single_revoke",
            });
          }
          setActiveStep(1);
        }}
      />
    </div>
  );
}
