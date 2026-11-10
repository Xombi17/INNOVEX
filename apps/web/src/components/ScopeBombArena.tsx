"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowSquareOut,
  Check,
  Compass,
  Copy,
  GitBranch,
  List,
  LockKey,
  ShieldCheck,
  SlidersHorizontal,
  TerminalWindow,
  X,
} from "@phosphor-icons/react";
import type { AuditInput, AuditReport, SimulationMode } from "@contracts/index";
import {
  getIncidentPresets,
  tryRunScopeBombAudit,
} from "@/lib/auditAdapter";
import { ContainmentComparison } from "./ContainmentComparison";
import { DominoGraph } from "./DominoGraph";
import { HowItWorksView } from "./HowItWorksView";
import { DEMO_PKCE_TRAP_URL, InputAndPresetBar } from "./InputAndPresetBar";
import { PreConsentPreview } from "./PreConsentPreview";
import { PROVIDER_LABELS } from "./uiTokens";

type WorkspaceView = "overview" | "containment" | "pkce" | "how_it_works";

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
  const [activeView, setActiveView] = useState<WorkspaceView>("overview");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [externalOAuthUrl, setExternalOAuthUrl] = useState<string | null>(null);
  const [activeOAuthUrl, setActiveOAuthUrl] = useState<string | null>(
    presets[0]?.sample_oauth_url ?? null,
  );
  const [copiedCli, setCopiedCli] = useState(false);

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

  const handleCopyCli = async () => {
    try {
      await navigator.clipboard.writeText("node packages/engine/cli.ts . --json");
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(false), 1600);
    } catch {
      // Clipboard optional in headless mode
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramUrl = params.get("oauth_url");
    if (paramUrl && paramUrl.trim()) {
      setExternalOAuthUrl(paramUrl);
      setScannerOpen(true);
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

  const activeOutcome =
    simulationMode === "naive_single_revoke"
      ? report.naive_containment
      : report.full_containment;

  const containmentPct = Math.round(activeOutcome.containment_ratio * 100);
  const persistingCount = activeOutcome.persisting_node_ids.length;
  const naivePct = Math.round(report.naive_containment.containment_ratio * 100);
  const fullPct = Math.round(report.full_containment.containment_ratio * 100);

  const primaryProvider =
    report.parsed_oauth?.provider
      ? PROVIDER_LABELS[report.parsed_oauth.provider]
      : "one token";

  const activePreset = presets.find((p) => p.preset_id === report.preset_id);
  const scenarioBreadcrumb = activePreset
    ? `${PRESET_SHORT_NAMES[activePreset.preset_id] ?? activePreset.title} (${activePreset.year})`
    : report.input_mode === "oauth_url"
      ? "Custom OAuth URL audit"
      : report.input_mode === "mcp_config"
        ? "Local config scan"
        : "Google Takeout audit";

  const pageHeadline =
    activeView === "how_it_works"
      ? "How ScopeBomb traces and stops cross-issuer OAuth attacks"
      : activeView === "pkce"
        ? "Intercept over-scoped consent before the PKCE handshake"
        : simulationMode === "naive_single_revoke"
          ? report.naive_containment.rfc7009_http_status_returned > 0 &&
            persistingCount > 0
            ? `${primaryProvider} returns HTTP ${report.naive_containment.rfc7009_http_status_returned} on revoke, leaving ${persistingCount} paths open`
            : persistingCount > 0
              ? `Single-issuer revoke leaves ${persistingCount} downstream paths exposed`
              : `${primaryProvider} grant carries zero downstream persistence paths`
          : `Multi-issuer plan closes all ${report.full_containment.contained_node_ids.length} exposed paths across ${report.full_containment.ordered_steps.length} actions`;

  const navItems: {
    id: WorkspaceView;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "overview",
      label: "Blast simulator",
      icon: <GitBranch size={16} />,
    },
    {
      id: "containment",
      label: "Remediation plan",
      icon: <ShieldCheck size={16} />,
    },
    {
      id: "pkce",
      label: "PKCE guard",
      icon: <LockKey size={16} />,
    },
    {
      id: "how_it_works",
      label: "How it works",
      icon: <Compass size={16} />,
    },
  ];

  const renderSidebarContent = (isDrawer = false) => (
    <div className="flex h-full flex-col">
      {/* Wordmark */}
      <div className="flex h-10 items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <rect x="1" y="1" width="18" height="18" rx="4" fill="#131416" />
            <circle cx="7" cy="7" r="2" fill="#ffffff" />
            <circle cx="13" cy="13" r="2.2" fill="#1b6c80" />
            <path
              d="M8.5 8.5L11.5 11.5"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-[16px] font-semibold tracking-[-0.01em] text-[#131416]">
            ScopeBomb
          </span>
        </div>
        {isDrawer && (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-[#5d5f60] hover:bg-[#ebedee] hover:text-[#131416]"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Primary Workspace Navigation */}
      <nav aria-label="Workspace sections" className="mt-4 space-y-0.5">
        {navItems.map((item) => {
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveView(item.id);
                setMobileMenuOpen(false);
              }}
              aria-current={active ? "page" : undefined}
              className={`flex h-8 w-full items-center gap-2.5 rounded-[6px] px-2 text-left text-[14px] transition ${
                active
                  ? "bg-[#ebedee] font-medium text-[#131416]"
                  : "text-[#5d5f60] hover:bg-[#f0f2f4] hover:text-[#131416]"
              }`}
            >
              <span className={active ? "text-[#1b6c80]" : "text-[#5d5f60]"}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Real-World Incident Presets */}
      <div className="mt-6">
        <div className="mb-1.5 px-2 text-[13px] font-medium text-[#5d5f60]">
          2024 to 2026 incidents
        </div>
        <div className="space-y-0.5">
          {presets.map((preset) => {
            const isActive =
              report.input_mode === "incident_preset" &&
              report.preset_id === preset.preset_id;
            return (
              <button
                key={preset.preset_id}
                type="button"
                onClick={() => {
                  handleRunAudit({
                    mode: "incident_preset",
                    raw_payload: preset.sample_oauth_url,
                    preset_id: preset.preset_id,
                    simulation_mode: simulationMode,
                  });
                  if (activeView === "how_it_works") {
                    setActiveView("overview");
                  }
                  setMobileMenuOpen(false);
                }}
                className={`flex h-8 w-full items-center justify-between gap-2 rounded-[6px] px-2 text-left text-[13px] transition ${
                  isActive
                    ? "bg-[#ebedee] font-medium text-[#131416]"
                    : "text-[#5d5f60] hover:bg-[#f0f2f4] hover:text-[#131416]"
                }`}
              >
                <span className="truncate">
                  {PRESET_SHORT_NAMES[preset.preset_id] ?? preset.title}
                </span>
                <span className="shrink-0 text-[13px] tabular-nums text-[#5d5f60]">
                  {preset.year}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sidebar Bottom Utilities */}
      <div className="mt-auto space-y-1 pt-6">
        <button
          type="button"
          onClick={() => {
            setActiveView("overview");
            setScannerOpen((prev) => !prev);
            setMobileMenuOpen(false);
          }}
          className="flex h-8 w-full items-center gap-2 rounded-[6px] px-2 text-left text-[13px] text-[#5d5f60] transition hover:bg-[#f0f2f4] hover:text-[#131416]"
        >
          <SlidersHorizontal size={15} />
          Scan custom URL / .mcp.json
        </button>

        <button
          type="button"
          onClick={handleCopyCli}
          className="flex h-8 w-full items-center justify-between gap-2 rounded-[6px] px-2 text-left text-[13px] text-[#5d5f60] transition hover:bg-[#f0f2f4] hover:text-[#131416]"
        >
          <span className="inline-flex items-center gap-2">
            <TerminalWindow size={15} />
            {copiedCli ? "Copied CLI command" : "Copy local CLI command"}
          </span>
          {copiedCli ? <Check size={14} className="text-[#1e7b4f]" /> : <Copy size={14} />}
        </button>

        <a
          href="https://github.com/Xombi17/INNOVEX"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-full items-center justify-between gap-2 rounded-[6px] px-2 text-[13px] text-[#5d5f60] transition hover:bg-[#f0f2f4] hover:text-[#131416]"
        >
          <span>GitHub &amp; MV3 extension</span>
          <ArrowSquareOut size={14} />
        </a>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f9fbfc] text-[#131416]">
      {/* Desktop Left Frame Rail */}
      <aside
        aria-label="ScopeBomb sidebar navigation"
        className="hidden w-[240px] shrink-0 bg-[#f9fbfc] p-3 lg:sticky lg:top-0 lg:block lg:h-screen"
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Fullscreen Nav Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#f9fbfc] p-4 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          {renderSidebarContent(true)}
        </div>
      )}

      {/* Main Content Frame */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 48px Top Header Strip (continuous ground, no divider from sidebar) */}
        <header className="flex min-h-12 items-center justify-between gap-3 bg-[#f9fbfc] px-5 py-1.5">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] border border-[#cdced1] bg-[#ffffff] text-[#131416] lg:hidden"
            >
              <List size={16} />
            </button>
            <span className="text-[13px] font-medium leading-[1.35] text-[#5d5f60]">
              {scenarioBreadcrumb}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (activeView === "how_it_works") setActiveView("overview");
                setScannerOpen((v) => !v);
              }}
              className="inline-flex h-8 items-center rounded-[6px] border border-[#cdced1] bg-[#ffffff] px-3 text-[13px] font-medium text-[#131416] transition hover:bg-[#f4f6f8]"
            >
              {scannerOpen ? "Close scanner" : "Custom URL / .mcp.json"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSimulationMode((prev) =>
                  prev === "naive_single_revoke"
                    ? "full_multi_issuer"
                    : "naive_single_revoke",
                );
              }}
              className="hidden h-8 items-center rounded-[6px] bg-[#131416] px-3 text-[13px] font-medium text-[#ffffff] transition hover:bg-[#2a2c30] sm:inline-flex"
            >
              {simulationMode === "naive_single_revoke"
                ? "Switch to full plan"
                : "Replay HTTP 200 trap"}
            </button>
          </div>
        </header>

        {/* White Sheet Inset from Window Edges */}
        <main className="flex-1 border-t border-[#e8eaec] bg-[#ffffff] lg:mb-2 lg:mr-2 lg:rounded-[16px] lg:border">
          <div className="mx-auto max-w-[1160px] space-y-6 px-5 py-6 sm:px-7">
            {/* Sheet Title Row */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="max-w-[74ch]">
                <h1 className="text-[22px] font-semibold leading-[1.35] tracking-[-0.015em] text-[#131416]">
                  {pageHeadline}
                </h1>
                <p className="mt-1.5 text-[14px] leading-[1.5] text-[#5d5f60]">
                  {activeView === "how_it_works"
                    ? "One offline engine powers the interactive Web Arena, Chrome pre-consent blocker, and local CLI."
                    : report.summary.headline}{" "}
                  {activeView !== "how_it_works" && (
                    <button
                      type="button"
                      onClick={() => setActiveView("how_it_works")}
                      className="inline-flex items-center gap-1 font-medium text-[#1b6c80] hover:underline"
                    >
                      How the 3 tools connect
                      <ArrowRight size={14} />
                    </button>
                  )}
                </p>
              </div>
            </div>

            {/* 4-Cell Unboxed Metric Strip (hairline top/bottom rules + inner dividers, zero nested boxes) */}
            {activeView !== "how_it_works" && (
              <div className="grid grid-cols-2 divide-y divide-[#f0f1f2] border-y border-[#e8eaec] md:grid-cols-4 md:divide-x md:divide-y-0 md:divide-[#e8eaec]">
                <div className="py-3.5 pr-4 md:pr-5">
                  <div className="text-[13px] font-medium text-[#5d5f60]">
                    Blast risk
                  </div>
                  <div className="mt-1 text-[28px] font-normal leading-[1.3] text-[#131416] tabular-nums">
                    {report.summary.max_risk_score}
                    <span className="ml-1 text-[14px] text-[#5d5f60]">
                      / 100
                    </span>
                  </div>
                </div>

                <div className="py-3.5 pl-4 md:px-5">
                  <div className="text-[13px] font-medium text-[#5d5f60]">
                    Escalation depth
                  </div>
                  <div className="mt-1 text-[28px] font-normal leading-[1.3] text-[#131416] tabular-nums">
                    {report.summary.max_hops}
                    <span className="ml-1.5 text-[14px] text-[#5d5f60]">
                      hops · {report.summary.trust_boundary_crossings.length}/5
                      zones
                    </span>
                  </div>
                </div>

                <div className="py-3.5 pr-4 md:px-5">
                  <div className="text-[13px] font-medium text-[#5d5f60]">
                    Active containment
                  </div>
                  <div
                    className="mt-1 text-[28px] font-normal leading-[1.3] tabular-nums"
                    style={{
                      color:
                        persistingCount > 0 ? "#831c1e" : "#04250e",
                    }}
                  >
                    {containmentPct}%
                    <span className="ml-1.5 text-[14px] text-[#5d5f60]">
                      {simulationMode === "naive_single_revoke"
                        ? `vs ${fullPct}% full`
                        : `vs ${naivePct}% single`}
                    </span>
                  </div>
                </div>

                <div className="py-3.5 pl-4 md:pl-5">
                  <div className="text-[13px] font-medium text-[#5d5f60]">
                    Paths still open
                  </div>
                  <div
                    className="mt-1 text-[28px] font-normal leading-[1.3] tabular-nums"
                    style={{
                      color:
                        persistingCount > 0 ? "#c4242a" : "#1e7b4f",
                    }}
                  >
                    {persistingCount}
                    <span className="ml-1.5 text-[14px] text-[#5d5f60]">
                      {persistingCount > 0 ? "bypassed revoke" : "contained"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Main View Content */}
            {activeView === "overview" && (
              <>
                <InputAndPresetBar
                  presets={presets}
                  activePresetId={report.preset_id ?? null}
                  activeInputMode={report.input_mode}
                  report={report}
                  inputError={inputError}
                  externalOAuthUrl={externalOAuthUrl}
                  scannerOpen={scannerOpen}
                  onToggleScanner={setScannerOpen}
                  onClearError={() => setInputError(null)}
                  onRunAudit={handleRunAudit}
                />

                <DominoGraph
                  report={report}
                  simulationMode={simulationMode}
                  onChangeSimulationMode={setSimulationMode}
                />

                <ContainmentComparison
                  report={report}
                  simulationMode={simulationMode}
                  onChangeSimulationMode={setSimulationMode}
                />

                <PreConsentPreview
                  report={report}
                  activeOAuthUrl={activeOAuthUrl}
                  onInspectUrl={handleInspectUrl}
                />
              </>
            )}

            {activeView === "containment" && (
              <ContainmentComparison
                report={report}
                simulationMode={simulationMode}
                onChangeSimulationMode={setSimulationMode}
                showFullTableByDefault
              />
            )}

            {activeView === "pkce" && (
              <>
                <InputAndPresetBar
                  presets={presets}
                  activePresetId={report.preset_id ?? null}
                  activeInputMode={report.input_mode}
                  report={report}
                  inputError={inputError}
                  externalOAuthUrl={externalOAuthUrl}
                  scannerOpen={scannerOpen}
                  onToggleScanner={setScannerOpen}
                  onClearError={() => setInputError(null)}
                  onRunAudit={handleRunAudit}
                />
                <PreConsentPreview
                  report={report}
                  activeOAuthUrl={activeOAuthUrl}
                  onInspectUrl={handleInspectUrl}
                />
              </>
            )}

            {activeView === "how_it_works" && (
              <HowItWorksView
                onOpenSimulator={() => setActiveView("overview")}
                onOpenPkceGuard={() => {
                  handleInspectUrl(DEMO_PKCE_TRAP_URL);
                  setActiveView("pkce");
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
                  setActiveView("overview");
                  setScannerOpen(true);
                }}
              />
            )}

            {/* Minimal Workbench Footer */}
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e8eaec] pt-4 text-[13px] leading-[1.45] text-[#5d5f60]">
              <span>
                ScopeBomb · INNOVEX 2026 (PS 05) · Deterministic local-first
                simulation (zero live account changes)
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <span>
                  CLI: <code>node packages/engine/cli.ts . --json</code>
                </span>
                <a
                  href="https://github.com/Xombi17/INNOVEX"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#1b6c80] hover:underline"
                >
                  GitHub &amp; Extension Source
                </a>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
