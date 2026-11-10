---
phase: 4
plan: 1
title: "Guided 3-Step UX Restructure & Always-Visible Scanner"
goal: "Replace 4-tab sidebar with linear 3-step guided stepper, make scanner always-visible above the fold, extract How-it-Works into a header modal, and separate scenario presets into a compact horizontal strip. All within framed-sheet design system."
requires: []
files_modified:
  - apps/web/src/components/ScopeBombArena.tsx
  - apps/web/src/components/InputAndPresetBar.tsx
  - apps/web/src/components/StepStepper.tsx
  - apps/web/src/components/HowItWorksModal.tsx
  - apps/web/src/components/PresetStrip.tsx
  - apps/web/src/components/Step1ScanVerdict.tsx
  - apps/web/src/components/Step2AttackPath.tsx
  - apps/web/src/components/Step3FixBlocker.tsx
verify:
  automated: "cd /home/varad/Documents/hackathons/INNOVEX/apps/web && npm run typecheck 2>&1 | tail -30"
  manual: "Open http://localhost:3000 — scanner bar visible without click, 3 steps navigable, preset pills separate from stepper, How-it-Works opens as modal"
requirements: [UX-01, UX-02, UX-03, UX-04, UX-05]
---

<threat_model>
- T-04-01: Risk — Modifying ScopeBombArena.tsx breaks ?oauth_url= deep link routing. Mitigation: preserve useEffect hook, externalOAuthUrl state, and handleInspectUrl. Severity: medium.
- T-04-02: Risk — New components use nested cards or sub-13px text violating DESIGN.md. Mitigation: enforce framed-sheet tokens per UI-SPEC.md acceptance criteria. Reviewer audit: impeccable detect. Severity: low.
- T-04-03: Risk — Removing scannerOpen default-false breaks InputAndPresetBar rendering. Mitigation: remove scannerOpen prop dependency; scanner renders unconditionally. Severity: medium.
</threat_model>

## Tasks

### Task 1: Create StepStepper component
**Type:** create
**File:** `apps/web/src/components/StepStepper.tsx`
**Description:** Horizontal 3-step navigator with accessible tablist semantics. Steps: "1. Scan & Verdict", "2. Attack Path", "3. Fix Plan & Blocker".

```tsx
"use client";
import React from "react";

interface StepStepperProps {
  activeStep: 1 | 2 | 3;
  onChangeStep: (step: 1 | 2 | 3) => void;
}

const STEPS: { id: 1 | 2 | 3; label: string }[] = [
  { id: 1, label: "1. Scan & Verdict" },
  { id: 2, label: "2. Attack Path" },
  { id: 3, label: "3. Fix Plan & Blocker" },
];

export function StepStepper({ activeStep, onChangeStep }: StepStepperProps) {
  return (
    <div
      role="tablist"
      aria-label="Workflow steps"
      className="flex items-center gap-1 border-b border-[#e8eaec] px-5 py-2"
    >
      {STEPS.map((step, i) => {
        const active = activeStep === step.id;
        const completed = activeStep > step.id;
        return (
          <React.Fragment key={step.id}>
            <button
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onChangeStep(step.id)}
              className={`whitespace-nowrap rounded-[6px] px-3 py-1.5 text-[13px] transition ${
                active
                  ? "bg-[#ebedee] font-medium text-[#131416]"
                  : "text-[#5d5f60] hover:bg-[#f4f6f8] hover:text-[#131416]"
              }`}
            >
              {completed ? "✓ " : ""}
              {step.label}
            </button>
            {i < STEPS.length - 1 && (
              <span className="select-none text-[13px] text-[#cdced1]" aria-hidden="true">
                ›
              </span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
```

---

### Task 2: Create PresetStrip component
**Type:** create
**File:** `apps/web/src/components/PresetStrip.tsx`
**Description:** Horizontal scrollable pill selector for incident presets. Visually separated from workflow steps.

```tsx
"use client";
import React from "react";
import type { IncidentPresetSummary } from "@/lib/auditAdapter";

const PRESET_SHORT_NAMES: Record<string, string> = {
  rohan_mcp_oauth_trap: "Shadow-AI MCP + OAuth",
  midnight_blizzard_2024: "Midnight Blizzard",
  salesloft_drift_2025: "Salesloft Drift fan-out",
  context_ai_vercel_2026: "Context.ai Workspace",
  litellm_ci_2026: "LiteLLM CI key leak",
};

interface PresetStripProps {
  presets: IncidentPresetSummary[];
  activePresetId: string | null;
  onSelectPreset: (preset: IncidentPresetSummary) => void;
}

export function PresetStrip({ presets, activePresetId, onSelectPreset }: PresetStripProps) {
  return (
    <div className="border-b border-[#f0f1f2] px-5 py-3">
      <div className="mb-2 text-[13px] font-medium text-[#5d5f60]">Real incidents (2024–2026):</div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {presets.map((preset) => {
          const isActive = activePresetId === preset.preset_id;
          return (
            <button
              key={preset.preset_id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className={`h-7 shrink-0 rounded-[9999px] border px-3 text-[13px] whitespace-nowrap transition ${
                isActive
                  ? "border-[#131416] bg-[#131416] text-[#ffffff]"
                  : "border-[#e8eaec] bg-[#ffffff] text-[#5d5f60] hover:border-[#cdced1] hover:text-[#131416]"
              }`}
            >
              {PRESET_SHORT_NAMES[preset.preset_id] ?? preset.title} · {preset.year}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

---

### Task 3: Create HowItWorksModal component
**Type:** create
**File:** `apps/web/src/components/HowItWorksModal.tsx`
**Description:** Lightweight modal/drawer wrapping HowItWorksView content. Triggered from header link. Escape key + backdrop click closes.

```tsx
"use client";
import React, { useEffect } from "react";
import { X } from "@phosphor-icons/react";
import { HowItWorksView } from "./HowItWorksView";

interface HowItWorksModalProps {
  open: boolean;
  onClose: () => void;
  onOpenSimulator: () => void;
  onOpenPkceGuard: () => void;
  onLoadMcpSample: () => void;
}

export function HowItWorksModal({
  open,
  onClose,
  onOpenSimulator,
  onOpenPkceGuard,
  onLoadMcpSample,
}: HowItWorksModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#131416]/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="How 3 tools connect"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[80vh] w-full max-w-[560px] overflow-y-auto rounded-[16px] border border-[#e8eaec] bg-[#ffffff] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#131416]">How the 3 tools connect</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-[#5d5f60] hover:bg-[#ebedee] hover:text-[#131416]"
          >
            <X size={18} />
          </button>
        </div>
        <HowItWorksView
          onOpenSimulator={() => { onClose(); onOpenSimulator(); }}
          onOpenPkceGuard={() => { onClose(); onOpenPkceGuard(); }}
          onLoadMcpSample={() => { onClose(); onLoadMcpSample(); }}
        />
      </div>
    </div>
  );
}
```

---

### Task 4: Create Step1ScanVerdict component
**Type:** create
**File:** `apps/web/src/components/Step1ScanVerdict.tsx`
**Description:** Step 1 wrapper containing the always-visible scanner, preset strip, metric strip, blast summary, and AI triage placeholder. Includes "Continue to Attack Path →" navigation.

```tsx
"use client";
import React from "react";
import { ArrowRight } from "@phosphor-icons/react";
import type { AuditInput, AuditReport, SimulationMode } from "@contracts/index";
import type { IncidentPresetSummary } from "@/lib/auditAdapter";
import { PROVIDER_LABELS } from "./uiTokens";
import { InputAndPresetBar, DEMO_PKCE_TRAP_URL } from "./InputAndPresetBar";
import { PresetStrip } from "./PresetStrip";

interface Step1Props {
  report: AuditReport;
  simulationMode: SimulationMode;
  presets: IncidentPresetSummary[];
  inputError: string | null;
  externalOAuthUrl: string | null;
  interceptedBanner: boolean;
  onRunAudit: (input: AuditInput) => void;
  onClearError: () => void;
  onSelectPreset: (preset: IncidentPresetSummary) => void;
  onContinue: () => void;
}

export function Step1ScanVerdict({
  report,
  simulationMode,
  presets,
  inputError,
  externalOAuthUrl,
  interceptedBanner,
  onRunAudit,
  onClearError,
  onSelectPreset,
  onContinue,
}: Step1Props) {
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

  const headline =
    persistingCount > 0
      ? `Check what one AI login link or leaked .env key exposes — ${persistingCount} paths still open`
      : `Check what one AI login link or leaked .env key exposes — all paths contained`;

  return (
    <div className="space-y-0">
      {/* Plain-English Headline */}
      <div className="px-5 pb-4 pt-5">
        <h1 className="text-[22px] font-semibold leading-[1.35] tracking-[-0.015em] text-[#131416]">
          {headline}
        </h1>
        <p className="mt-1.5 text-[14px] leading-[1.5] text-[#5d5f60]">
          {report.summary.headline}
        </p>
      </div>

      {/* Intercepted link banner */}
      {interceptedBanner && (
        <div className="mx-5 mb-4 rounded-[6px] bg-[#e6f2f5] px-3 py-2 text-[13px] text-[#1b6c80]">
          Intercepted link passed from Chrome extension guard — pre-filled below
        </div>
      )}

      {/* Always-visible scanner */}
      <InputAndPresetBar
        presets={presets}
        activePresetId={report.preset_id ?? null}
        activeInputMode={report.input_mode}
        report={report}
        inputError={inputError}
        externalOAuthUrl={externalOAuthUrl}
        scannerOpen={true}
        onToggleScanner={() => {}}
        onClearError={onClearError}
        onRunAudit={onRunAudit}
      />

      {/* Preset Strip */}
      <PresetStrip
        presets={presets}
        activePresetId={report.preset_id ?? null}
        onSelectPreset={onSelectPreset}
      />

      {/* 4-Cell Metric Strip */}
      <div className="grid grid-cols-2 divide-y divide-[#f0f1f2] border-y border-[#e8eaec] md:grid-cols-4 md:divide-x md:divide-y-0 md:divide-[#e8eaec]">
        <div className="px-5 py-3.5">
          <div className="text-[13px] font-medium text-[#5d5f60]">Blast risk</div>
          <div className="mt-1 text-[28px] font-normal leading-[1.3] text-[#131416] tabular-nums">
            {report.summary.max_risk_score}
            <span className="ml-1 text-[14px] text-[#5d5f60]">/ 100</span>
          </div>
        </div>
        <div className="px-5 py-3.5">
          <div className="text-[13px] font-medium text-[#5d5f60]">Escalation depth</div>
          <div className="mt-1 text-[28px] font-normal leading-[1.3] text-[#131416] tabular-nums">
            {report.summary.max_hops}
            <span className="ml-1.5 text-[14px] text-[#5d5f60]">
              hops · {report.summary.trust_boundary_crossings.length}/5 zones
            </span>
          </div>
        </div>
        <div className="px-5 py-3.5">
          <div className="text-[13px] font-medium text-[#5d5f60]">Active containment</div>
          <div
            className="mt-1 text-[28px] font-normal leading-[1.3] tabular-nums"
            style={{ color: persistingCount > 0 ? "#831c1e" : "#04250e" }}
          >
            {containmentPct}%
            <span className="ml-1.5 text-[14px] text-[#5d5f60]">
              {simulationMode === "naive_single_revoke"
                ? `vs ${fullPct}% full`
                : `vs ${naivePct}% single`}
            </span>
          </div>
        </div>
        <div className="px-5 py-3.5">
          <div className="text-[13px] font-medium text-[#5d5f60]">Paths still open</div>
          <div
            className="mt-1 text-[28px] font-normal leading-[1.3] tabular-nums"
            style={{ color: persistingCount > 0 ? "#c4242a" : "#1e7b4f" }}
          >
            {persistingCount}
            <span className="ml-1.5 text-[14px] text-[#5d5f60]">
              {persistingCount > 0 ? "bypassed revoke" : "contained"}
            </span>
          </div>
        </div>
      </div>

      {/* AI Triage Slot (Phase 5 placeholder) */}
      <div className="mx-5 my-4 rounded-[8px] border border-dashed border-[#e8eaec] p-4">
        <div className="text-[13px] font-medium text-[#5d5f60]">AI Threat Brief</div>
        <p className="mt-1 text-[13px] text-[#5d5f60]">
          Plain-English attacker story and first-60-seconds action will appear here after scanning a URL or repo. Live AI triage wired in Phase 5.
        </p>
      </div>

      {/* Step Continue */}
      <div className="flex justify-end px-5 pb-5">
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[#131416] px-4 text-[13px] font-medium text-[#ffffff] transition hover:bg-[#2a2c30]"
        >
          Continue to Attack Path
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
```

---

### Task 5: Create Step2AttackPath component
**Type:** create
**File:** `apps/web/src/components/Step2AttackPath.tsx`
**Description:** Step 2 wrapper with DominoGraph, simulation segmented toggle, and collapsible Technical Forensics disclosure.

```tsx
"use client";
import React, { useState } from "react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import type { AuditReport, SimulationMode } from "@contracts/index";
import { DominoGraph } from "./DominoGraph";

interface Step2Props {
  report: AuditReport;
  simulationMode: SimulationMode;
  onChangeSimulationMode: (mode: SimulationMode) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function Step2AttackPath({
  report,
  simulationMode,
  onChangeSimulationMode,
  onBack,
  onContinue,
}: Step2Props) {
  const persistingCount =
    simulationMode === "naive_single_revoke"
      ? report.naive_containment.persisting_node_ids.length
      : report.full_containment.persisting_node_ids.length;
  const totalContained = report.full_containment.contained_node_ids.length;

  const headline =
    simulationMode === "naive_single_revoke"
      ? `Why clicking Revoke still leaves ${persistingCount} paths open`
      : `Full multi-account fix closes all ${totalContained} exposed paths`;

  return (
    <div className="space-y-0">
      {/* Plain-English Headline */}
      <div className="px-5 pb-4 pt-5">
        <h1 className="text-[22px] font-semibold leading-[1.35] tracking-[-0.015em] text-[#131416]">
          {headline}
        </h1>
        <p className="mt-1.5 text-[14px] leading-[1.5] text-[#5d5f60]">
          The domino map below shows how a single OAuth grant escalates across issuers and trust
          boundaries. Use the toggle to compare outcomes.
        </p>
      </div>

      {/* Simulation Segmented Toggle */}
      <div className="px-5 pb-4">
        <div className="inline-flex overflow-hidden rounded-[8px] border border-[#e8eaec]">
          <button
            type="button"
            onClick={() => onChangeSimulationMode("naive_single_revoke")}
            className={`px-4 py-1.5 text-[13px] transition ${
              simulationMode === "naive_single_revoke"
                ? "bg-[#131416] text-[#ffffff]"
                : "bg-[#ffffff] text-[#5d5f60] hover:bg-[#f4f6f8]"
            }`}
          >
            After 1-Click Revoke (Fails)
          </button>
          <button
            type="button"
            onClick={() => onChangeSimulationMode("full_multi_issuer")}
            className={`border-l border-[#e8eaec] px-4 py-1.5 text-[13px] transition ${
              simulationMode === "full_multi_issuer"
                ? "bg-[#131416] text-[#ffffff]"
                : "bg-[#ffffff] text-[#5d5f60] hover:bg-[#f4f6f8]"
            }`}
          >
            After Full Multi-Issuer Plan (Fixed)
          </button>
        </div>
      </div>

      {/* DominoGraph */}
      <div className="border-t border-[#e8eaec]">
        <DominoGraph
          report={report}
          simulationMode={simulationMode}
          onChangeSimulationMode={onChangeSimulationMode}
        />
      </div>

      {/* Technical Forensics Collapsible Disclosure */}
      <div className="border-t border-[#f0f1f2] px-5 py-4">
        <details>
          <summary className="cursor-pointer text-[13px] text-[#1b6c80] hover:underline">
            Technical forensics &amp; RFC 7009 proof
          </summary>
          <div className="mt-3 space-y-2 text-[13px] text-[#5d5f60]">
            <p>
              RFC 7009 §2.2: servers MUST respond with HTTP 200 even when the token was already
              invalid or expired — this response is NOT proof of revocation. Access tokens may
              remain valid until their natural TTL expires.
            </p>
            <p>
              <strong className="text-[#131416]">Scenario:</strong>{" "}
              {report.preset_id ?? report.input_mode} · Max hops: {report.summary.max_hops} ·
              Risk score: {report.summary.max_risk_score}/100
            </p>
            <p>
              <strong className="text-[#131416]">Trust boundaries crossed:</strong>{" "}
              {report.summary.trust_boundary_crossings.join(", ") || "none"}
            </p>
          </div>
        </details>
      </div>

      {/* Step Navigation */}
      <div className="flex items-center justify-between border-t border-[#f0f1f2] px-5 pb-5 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[#cdced1] bg-[#ffffff] px-4 text-[13px] text-[#131416] transition hover:bg-[#f4f6f8]"
        >
          <ArrowLeft size={14} />
          Scan &amp; Verdict
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[#131416] px-4 text-[13px] font-medium text-[#ffffff] transition hover:bg-[#2a2c30]"
        >
          View Fix Plan &amp; Blocker
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
```

---

### Task 6: Create Step3FixBlocker component
**Type:** create
**File:** `apps/web/src/components/Step3FixBlocker.tsx`
**Description:** Step 3 wrapper with ContainmentComparison, PreConsentPreview, and Phase 6 placeholder slots for CLI kill-switches and extension download.

```tsx
"use client";
import React from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import type { AuditReport, SimulationMode } from "@contracts/index";
import { ContainmentComparison } from "./ContainmentComparison";
import { PreConsentPreview } from "./PreConsentPreview";

interface Step3Props {
  report: AuditReport;
  simulationMode: SimulationMode;
  activeOAuthUrl: string | null;
  onChangeSimulationMode: (mode: SimulationMode) => void;
  onInspectUrl: (url: string) => void;
  onBack: () => void;
}

export function Step3FixBlocker({
  report,
  simulationMode,
  activeOAuthUrl,
  onChangeSimulationMode,
  onInspectUrl,
  onBack,
}: Step3Props) {
  return (
    <div className="space-y-0">
      {/* Plain-English Headline */}
      <div className="px-5 pb-4 pt-5">
        <h1 className="text-[22px] font-semibold leading-[1.35] tracking-[-0.015em] text-[#131416]">
          Follow these steps by provider &amp; block bad logins before clicking Allow
        </h1>
        <p className="mt-1.5 text-[14px] leading-[1.5] text-[#5d5f60]">
          The containment checklist below shows the exact ordered actions needed to close all
          exposed paths. The Chrome Extension guard stops over-scoped consent before it happens.
        </p>
      </div>

      {/* Containment Comparison */}
      <div className="border-t border-[#e8eaec]">
        <ContainmentComparison
          report={report}
          simulationMode={simulationMode}
          onChangeSimulationMode={onChangeSimulationMode}
          showFullTableByDefault
        />
      </div>

      {/* Provider Kill-Switch Slot (Phase 6) */}
      <div className="border-t border-[#f0f1f2] px-5 py-4">
        <div className="rounded-[8px] border border-dashed border-[#e8eaec] p-4">
          <div className="text-[13px] font-medium text-[#131416]">Provider kill-switch scripts</div>
          <p className="mt-1 text-[13px] text-[#5d5f60]">
            Copy-ready <code className="font-mono">curl</code> revocation commands, verification
            probes, and direct account links for each detected issuer. Coming in Phase 6.
          </p>
        </div>
      </div>

      {/* Pre-Consent Preview */}
      <div className="border-t border-[#e8eaec]">
        <PreConsentPreview
          report={report}
          activeOAuthUrl={activeOAuthUrl}
          onInspectUrl={onInspectUrl}
        />
      </div>

      {/* Extension Download Slot (Phase 6) */}
      <div className="border-t border-[#f0f1f2] px-5 py-4">
        <div className="rounded-[8px] border border-dashed border-[#e8eaec] p-4">
          <div className="text-[13px] font-medium text-[#131416]">Download Chrome Extension</div>
          <p className="mt-1 text-[13px] text-[#5d5f60]">
            One-click download of <code className="font-mono">scopebomb-mv3-extension.zip</code>{" "}
            with 3-step install instructions for <code className="font-mono">chrome://extensions</code>. Coming in Phase 6.
          </p>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex items-center border-t border-[#f0f1f2] px-5 pb-5 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[#cdced1] bg-[#ffffff] px-4 text-[13px] text-[#131416] transition hover:bg-[#f4f6f8]"
        >
          <ArrowLeft size={14} />
          Attack Path
        </button>
      </div>
    </div>
  );
}
```

---

### Task 7: Refactor ScopeBombArena.tsx — Replace 4-tab sidebar with 3-step guided layout
**Type:** modify
**File:** `apps/web/src/components/ScopeBombArena.tsx`
**Description:** Complete rewrite of ScopeBombArena to use activeStep 1|2|3 instead of WorkspaceView tabs. Remove sidebar. Keep all data handlers and ?oauth_url= logic. Add HowItWorksModal trigger in header.

Replace the entire file content (see implementation notes):
- State: `activeStep: 1|2|3`, `howItWorksOpen: boolean` — REMOVE `activeView`, `scannerOpen`, `mobileMenuOpen`
- Compose: StepStepper + (Step1ScanVerdict | Step2AttackPath | Step3FixBlocker) based on activeStep
- Header: show breadcrumb + "How 3 Tools Connect →" link + modal trigger; REMOVE "Custom URL / .mcp.json" toggle and simulation mode toggle from header
- Keep ALL: `handleRunAudit`, `handleInspectUrl`, `handleCopyCli`, `useEffect` for `?oauth_url=`, report/simulationMode/activeOAuthUrl state
- Keep: footer with CLI and GitHub links

---

### Task 8: Update InputAndPresetBar.tsx — Always visible, add GitHub Repo tab
**Type:** modify
**File:** `apps/web/src/components/InputAndPresetBar.tsx`
**Description:** Remove scannerOpen conditional rendering; scanner always renders. Add "GitHub Repo URL" as third tab with Phase 5 placeholder wiring.

Changes:
- Remove `if (!scannerOpen) return null;` or equivalent guard from render
- Add `github_repo` to `InputMode` type handling (use `"github_repo"` as a UI-only tab key, not sent to audit engine yet)
- Add GitHub URL input field in the new tab
- Add sample button "Try Xombi17/INNOVEX" with inline note "(Live scanning wired in Phase 5)"
- Keep `scannerOpen` and `onToggleScanner` props for backward compat (now ignored)

---

### Task 9: TypeScript verification
**Type:** verify
**Command:** `cd /home/varad/Documents/hackathons/INNOVEX/apps/web && npm run typecheck 2>&1 | tail -30`
**Expected:** Exit 0, no TypeScript errors

---

### Task 10: Frozen lane verification
**Type:** verify
**Command:** `git -C /home/varad/Documents/hackathons/INNOVEX diff -- packages/engine tests/engine contracts data/scope_catalog.json`
**Expected:** Empty output (zero changes to frozen lane files)

---

### Task 11: Commit Phase 4 UI changes
**Type:** commit
**Command:**
```bash
cd /home/varad/Documents/hackathons/INNOVEX
git add apps/web/src/components/StepStepper.tsx
git add apps/web/src/components/PresetStrip.tsx
git add apps/web/src/components/HowItWorksModal.tsx
git add apps/web/src/components/Step1ScanVerdict.tsx
git add apps/web/src/components/Step2AttackPath.tsx
git add apps/web/src/components/Step3FixBlocker.tsx
git add apps/web/src/components/ScopeBombArena.tsx
git add apps/web/src/components/InputAndPresetBar.tsx
git add .planning/phases/04-guided-ux-architecture/
git commit -m "feat(phase-4): 3-step guided UX, always-visible scanner, preset strip, how-it-works modal

- Replace 4-tab sidebar with linear Step 1→2→3 guided flow
- StepStepper, PresetStrip, HowItWorksModal, Step1ScanVerdict, Step2AttackPath, Step3FixBlocker
- Scanner bar always visible (no hidden toggle)
- Scenario presets separated into horizontal pill strip
- Plain-English headlines per CONTEXT.md D-05
- Technical forensics in collapsible <details> disclosure
- How it Works converted to compact header modal
- Phase 5/6 placeholder slots for AI triage, CLI kill-switches, extension download
- framed-sheet design tokens preserved throughout

Closes: UX-01, UX-02, UX-03, UX-04, UX-05"
```

---

## Verification

### Automated
```bash
cd /home/varad/Documents/hackathons/INNOVEX/apps/web && npm run typecheck 2>&1 | tail -30
git -C /home/varad/Documents/hackathons/INNOVEX diff -- packages/engine tests/engine contracts data/scope_catalog.json
```

### Manual Checklist (matches UI-SPEC AC-01 through AC-12)
- [ ] Scanner bar visible without any click on cold load
- [ ] Plain-English headline visible in Step 1
- [ ] Each step ≤ 1.5 viewports at 1280×800
- [ ] Preset pills visually separate from stepper
- [ ] Raw RFC/node IDs inside Technical Forensics `<details>` in Step 2
- [ ] "How 3 Tools Connect" opens modal without leaving step
- [ ] `?oauth_url=` pre-fills scanner and shows intercepted banner
- [ ] Switching steps preserves active report
- [ ] Zero nested bordered/shadowed cards
- [ ] All text ≥ 13px
- [ ] Mobile 390px: no horizontal scroll
