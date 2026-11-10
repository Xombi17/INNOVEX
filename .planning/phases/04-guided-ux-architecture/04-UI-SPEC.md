# UI Design Contract — Phase 4: Guided 3-Step Information Architecture & Always-Visible Scanner

**Phase:** 04-guided-ux-architecture
**Generated:** 2026-11-10
**Applies to:** `apps/web/src/` (all components and pages in this phase)
**Design system authority:** `DESIGN.md` (framed-sheet porcelain)

---

## Overview

Rebuild the ScopeBomb Web Arena information architecture from an overwhelming 4-tab sidebar layout into a linear **3-Step Guided Flow** that first-time users can understand within 5 seconds. The always-visible scanner bar sits above the fold. The "How it Works" explanation moves from a full page tab into a compact header modal/drawer. Scenario presets become a horizontal strip clearly separated from the 3 workflow steps.

**Interaction model:** State-driven React (useState) with lifted state in `ScopeBombArena.tsx`. Navigation between steps is explicit (button clicks), not auto-advancing.

---

## Layout Architecture

### Desktop (≥ 1024px)

```
┌─────────────────────────────────────────────────────────────┐
│  [⬛ ScopeBomb]  48px slate-ice header bar (#f9fbfc)         │
│  breadcrumb text                    [How 3 Tools Connect ▾] [Custom URL] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  White sheet (#ffffff, rounded-[16px], border)       │   │
│  │                                                     │   │
│  │  STEP STEPPER  [① Scan & Verdict] [② Attack Path] [③ Fix Plan & Blocker] │
│  │  ─────────────────────────────── hairline ──────── │   │
│  │                                                     │   │
│  │  ALWAYS-VISIBLE SCANNER BAR                         │   │
│  │  [OAuth URL | .mcp.json / .env | GitHub Repo]       │   │
│  │                                                     │   │
│  │  SCENARIO PRESETS (compact horizontal strip)        │   │
│  │  Shadow-AI MCP · Midnight Blizzard · Salesloft...   │   │
│  │                                                     │   │
│  │  ACTIVE STEP CONTENT (1–1.5 viewports tall)         │   │
│  │  Step 1: 4-metric strip + blast summary + AI triage slot │
│  │  Step 2: DominoGraph + toggle + forensic bar        │   │
│  │  Step 3: Containment checklist + PKCE preview       │   │
│  │                                                     │   │
│  │  [Continue → Attack Path] / [← Scan] [View Fix Plan →] │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Tablet (768px–1023px)
- Full-width sheet, no sidebar
- Stepper: horizontal tabs bar at top of sheet
- Scanner bar: full-width, 2 columns for tab + input
- Preset strip: 2-row wrap

### Mobile (< 768px)
- Full-width sheet, no sidebar
- Stepper: compact labeled step pills (1 / 2 / 3)
- Scanner bar: stacked single-column
- Metric strip: 2×2 grid
- Step navigation: full-width buttons

---

## Component Inventory

### New Components

| Component | File | Role |
|-----------|------|------|
| `StepStepper` | `components/StepStepper.tsx` | Horizontal step navigator (1→2→3), shows step names, marks active/completed |
| `HowItWorksModal` | `components/HowItWorksModal.tsx` | Lightweight header modal/drawer explaining 3-surface architecture |
| `PresetStrip` | `components/PresetStrip.tsx` | Horizontal compact scenario preset selector, extracted from sidebar |
| `Step1ScanVerdict` | `components/Step1ScanVerdict.tsx` | Step 1 container: metric strip + blast summary + AI triage card slot |
| `Step2AttackPath` | `components/Step2AttackPath.tsx` | Step 2 container: DominoGraph + simulation toggle + forensic bar |
| `Step3FixBlocker` | `components/Step3FixBlocker.tsx` | Step 3 container: ContainmentComparison + PreConsentPreview (Phase 6 enriched) |

### Modified Components

| Component | Change |
|-----------|--------|
| `ScopeBombArena.tsx` | Replace `WorkspaceView` tabs with `activeStep: 1|2|3`; remove `scannerOpen` default false; remove sidebar nav; add modal state |
| `InputAndPresetBar.tsx` | Remove toggle/collapse logic; always render; add `GitHub Repo URL` tab (slot for Phase 5 wiring); add `Simulate Fake AI App Consent` trigger slot |
| `HowItWorksView.tsx` | Convert to modal/drawer content (no longer a full page view) |

### Unchanged Components

- `DominoGraph.tsx` — used as-is inside Step2AttackPath
- `ContainmentComparison.tsx` — used as-is inside Step3FixBlocker
- `PreConsentPreview.tsx` — used as-is inside Step3FixBlocker
- `uiTokens.ts` — unchanged

---

## Step Components (Detailed)

### StepStepper

```tsx
// Props
interface StepStepperProps {
  activeStep: 1 | 2 | 3;
  onChangeStep: (step: 1 | 2 | 3) => void;
}
```

**Visual design:**
- Horizontal row with 3 items separated by `›` arrow glyphs (not icons)
- Active step: `bg-[#ebedee] text-[#131416] font-medium rounded-[6px] px-3 py-1.5 text-[13px]`
- Inactive step: `text-[#5d5f60] text-[13px] px-3 py-1.5 hover:text-[#131416] cursor-pointer`
- Completed step: same as inactive but with a subtle `✓` prefix
- Step labels: `"1. Scan & Verdict"`, `"2. Attack Path"`, `"3. Fix Plan & Blocker"`
- Container: `flex items-center gap-1 border-b border-[#e8eaec] px-5 py-2`
- No colored underlines; active state uses background fill only

### HowItWorksModal

```tsx
// Props
interface HowItWorksModalProps {
  open: boolean;
  onClose: () => void;
  onOpenSimulator: () => void;
  onOpenPkceGuard: () => void;
  onLoadMcpSample: () => void;
}
```

**Visual design:**
- Triggered from header link `"How 3 Tools Connect ↗"` (teal, `text-[14px] text-[#1b6c80]`)
- Overlay: fixed fullscreen backdrop `bg-[#131416]/40`, centered modal panel
- Modal panel: `bg-[#ffffff] rounded-[16px] border border-[#e8eaec] shadow-none max-w-[560px] w-full p-6`
- No drop shadows on the panel (tone separation only: `#f9fbfc` backdrop vs `#ffffff` modal)
- Close button: `"×"` top-right, 32×32px, `rounded-[6px] hover:bg-[#ebedee]`
- Content: re-uses existing `HowItWorksView` body copy, reformatted in 3 compact sections
- Sections separated by `border-t border-[#f0f1f2]`

### PresetStrip

```tsx
// Props
interface PresetStripProps {
  presets: IncidentPresetSummary[];
  activePresetId: string | null;
  onSelectPreset: (preset: IncidentPresetSummary) => void;
}
```

**Visual design:**
- Horizontal scrollable row of pill buttons: `flex items-center gap-2 overflow-x-auto pb-1`
- Pill: `h-7 px-3 rounded-[9999px] text-[13px] border border-[#e8eaec] whitespace-nowrap`
- Active pill: `bg-[#131416] text-[#ffffff] border-[#131416]`
- Inactive pill: `bg-[#ffffff] text-[#5d5f60] hover:border-[#cdced1] hover:text-[#131416]`
- Label shows preset short name + year: `"Shadow-AI MCP · 2024"`
- Section header: `text-[13px] font-medium text-[#5d5f60] mb-2` → `"Real incidents (2024–2026):"`

### Step1ScanVerdict

**Contains:**
1. **Plain-English Headline** (22px, weight 600) — `"Check what one AI login link or leaked .env key exposes"`; replaced dynamically when active scan shows risk: `"⚠ Danger: 1 login reaches GitHub, Vercel & 24 resources"`
2. **4-Cell Metric Strip** — exact current implementation (unchanged), `border-y border-[#e8eaec]`
3. **Blast Summary Paragraph** — `report.summary.headline`, `text-[14px] leading-[1.5] text-[#5d5f60]`
4. **AI Triage Card Slot** — empty slot with `border border-dashed border-[#e8eaec] rounded-[8px] p-4 text-[13px] text-[#5d5f60]` → `"AI Threat Brief will appear here after Phase 5 wiring"` (Phase 4 placeholder)
5. **Continue CTA** — `"Continue to Attack Path →"` button, `h-8 px-4 rounded-[6px] bg-[#131416] text-[#ffffff] text-[13px]`, floated right at step bottom

### Step2AttackPath

**Contains:**
1. **Plain-English Headline** — dynamic: `"Why clicking Revoke still leaves ${persistingCount} paths open"` (naive) or `"Full multi-account fix closes all ${total} exposed paths"` (full)
2. **Simulation Toggle** — single segmented control: `[After 1-Click Revoke (Fails)] [After Full Multi-Issuer Plan (Fixed)]`
   - Container: `inline-flex rounded-[8px] border border-[#e8eaec] overflow-hidden`
   - Active segment: `bg-[#131416] text-[#ffffff] text-[13px] px-4 py-1.5`
   - Inactive segment: `bg-[#ffffff] text-[#5d5f60] text-[13px] px-4 py-1.5 hover:bg-[#f4f6f8]`
3. **DominoGraph** — unchanged component
4. **Technical Forensics Disclosure** — collapsible `<details>` element:
   - `<summary>` label: `"Technical forensics & RFC 7009 proof"` in `text-[13px] text-[#1b6c80] cursor-pointer`
   - Contains: raw node IDs, RFC 7009 HTTP status codes, catalog keys — currently visible in overview, tucked here
5. **Navigation** — `"← Scan & Verdict"` (secondary/ghost) + `"View Fix Plan & Blocker →"` (primary dark)

### Step3FixBlocker

**Contains:**
1. **Plain-English Headline** — `"Follow these steps by provider & block bad logins before clicking Allow"`
2. **ContainmentComparison** — unchanged component (`showFullTableByDefault`)
3. **PreConsentPreview** — unchanged component
4. **CLI Enrichment Slot** — Phase 6 placeholder section (Step 3 header with `"Provider kill-switch scripts"` label, dashed border empty state)
5. **Extension Download Slot** — Phase 6 placeholder (dashed border, `"Chrome Extension download coming in Phase 6"`)
6. **Navigation** — `"← Attack Path"` (ghost button, left-aligned)

---

## Navigation & State

### State in ScopeBombArena (lifted)

```ts
// New/changed state
type ActiveStep = 1 | 2 | 3;
const [activeStep, setActiveStep] = useState<ActiveStep>(1);
const [howItWorksOpen, setHowItWorksOpen] = useState(false);

// Removed state
// scannerOpen: boolean → removed; scanner is always visible
// activeView: WorkspaceView → replaced by activeStep
// mobileMenuOpen: boolean → removed; no sidebar
```

### URL Query Parameter Handling

`?oauth_url=` parameter on mount:
- Pre-fills OAuth URL tab in scanner bar (unchanged logic)
- Shows banner below scanner: `"Intercepted link passed from Chrome extension guard"` in `text-[13px] text-[#1b6c80] bg-[#e6f2f5] rounded-[6px] px-3 py-2`
- Does NOT auto-advance to Step 2; user sees the scan results on Step 1

### Step Continuity

- Switching steps preserves `report`, `simulationMode`, `activeOAuthUrl` in state (no data loss)
- StepStepper allows jumping to any completed or active step (no linear lock)

---

## Interaction Design

### Scanner Input Bar (Always Visible)

The `InputAndPresetBar` renders unconditionally above PresetStrip and step content. Changes:
- Remove all `scannerOpen` toggle logic
- Add `GitHub Repo URL` as third tab: `[OAuth Login Link | .mcp.json / .env / Takeout | GitHub Repo URL]`
- GitHub tab input: placeholder `"owner/repo or https://github.com/owner/repo"` + sample button `"Try Xombi17/INNOVEX"` (wired live in Phase 5; Phase 4 shows inline `"Live scanning wired in Phase 5"` hint)
- `Simulate Fake AI App Consent` trigger button appears in OAuth Login Link tab (Phase 6 slot)
- Error state: inline `role="alert"` block below input, `text-[13px] text-[#831c1e]`

### Simulation Mode Toggle (Step 2)

Replaces the header button `"Switch to full plan" / "Replay HTTP 200 trap"`. Now lives exclusively inside Step 2 as a segmented control. The header no longer shows this toggle.

### Collapsible Technical Disclosure (Step 2)

Raw RFC/node data moves inside `<details>` with smooth `open` CSS transition. Preserves protocol rigor while reducing noise for non-specialists. `<summary>` renders as a teal text link.

### "How 3 Tools Connect" Modal

- Header link renders in `apps/web/src/app/layout.tsx`'s `<header>` or inside ScopeBombArena header strip
- Click opens `HowItWorksModal` overlay
- Modal contains 3 short sections from existing `HowItWorksView` content, reformatted concisely

---

## Responsive Behavior

| Viewport | Stepper | Scanner | Presets | Step Content |
|----------|---------|---------|---------|--------------|
| ≥ 1280px | Horizontal tabs in sheet header | 3 side-by-side tabs | Horizontal scrollable pills | Full-width, 1160px max-width |
| 768–1279px | Horizontal tabs (smaller labels) | Stacked tabs on sm | 2-row wrap | Full-width |
| < 768px | Numbered pills `1 · 2 · 3` | Single-column, full-width | 2-row wrap | Full-width, stacked buttons |

Mobile step navigation: full-width buttons `w-full h-10` stacked vertically.

---

## Design Token Reference

All tokens are from `DESIGN.md`. Tailwind class equivalents:

| Token | Hex | Tailwind |
|-------|-----|----------|
| Slate-ice ground | `#f9fbfc` | `bg-[#f9fbfc]` |
| Porcelain sheet | `#ffffff` | `bg-white` / `bg-[#ffffff]` |
| Surface active | `#ebedee` | `bg-[#ebedee]` |
| Surface raised | `#f4f6f8` | `bg-[#f4f6f8]` |
| Hairline border | `#e8eaec` | `border-[#e8eaec]` |
| Hairline rule | `#f0f1f2` | `border-[#f0f1f2]` / `divide-[#f0f1f2]` |
| Control stroke | `#cdced1` | `border-[#cdced1]` |
| Carbon ink | `#131416` | `text-[#131416]` / `bg-[#131416]` |
| Slate muted | `#5d5f60` | `text-[#5d5f60]` |
| Deep teal | `#1b6c80` | `text-[#1b6c80]` |
| Accent tint | `#e6f2f5` | `bg-[#e6f2f5]` |
| Crimson persisting | `#c4242a` | `text-[#c4242a]` |
| Crimson pill bg | `#ffedea` | `bg-[#ffedea]` |
| Crimson pill ink | `#831c1e` | `text-[#831c1e]` |
| Emerald contained | `#1e7b4f` | `text-[#1e7b4f]` |
| Emerald pill bg | `#dcfae5` | `bg-[#dcfae5]` |
| Emerald pill ink | `#04250e` | `text-[#04250e]` |

**Typography floors:**
- Minimum: `text-[13px]` (13px)
- Body: `text-[14px]`
- Section titles: `text-[16px] font-semibold`
- Sheet headline: `text-[22px] font-semibold tracking-[-0.015em]`
- Metric KPI: `text-[28px] font-normal tabular-nums`

**Radii:**
- Badge: `rounded-[4px]`
- Control: `rounded-[6px]`
- Section container: `rounded-[8px]`
- Sheet: `rounded-[16px]`
- Pill: `rounded-[9999px]`

---

## Accessibility Requirements

- Stepper: `role="tablist"` on stepper container, `role="tab"` on each step, `aria-selected`, `aria-controls`
- Modal: `role="dialog"` `aria-modal="true"` `aria-labelledby`, focus trap on open, `Escape` closes
- Scanner tabs: `role="tablist"` + `role="tab"` + `aria-selected` + `role="tabpanel"` on content
- Technical disclosure: native `<details><summary>` for keyboard/screen reader support
- All buttons: descriptive `aria-label` when icon-only
- Error alerts: `role="alert"` with `aria-live="assertive"`
- Color alone never the only signal (use icons + text labels alongside color)

---

## Acceptance Criteria

> All must pass before Phase 4 is considered complete.

| ID | Criterion | Test Method |
|----|-----------|-------------|
| AC-01 | Opening `apps/web` cold shows the scanner bar immediately (no click needed to reveal it) | Manual: load app, observe scanner bar visible above fold without interaction |
| AC-02 | First 5 seconds: headline reads in plain English, not raw protocol IDs | Manual: `"Check what one AI login link or leaked .env key exposes"` visible on cold load |
| AC-03 | Each active step is ≤ 1.5 viewports tall at 1280px × 800px | Manual: measure scroll length per step |
| AC-04 | Scenario presets are visually separated from the 3 workflow step labels | Manual: preset pills are in a distinct horizontal strip, not mixed with stepper |
| AC-05 | Raw RFC/node IDs are inside the collapsible Technical Forensics disclosure in Step 2 | Manual: open disclosure; Step 2 main view shows only plain-English summary |
| AC-06 | "How 3 Tools Connect" modal opens from header without navigating away from current step | Manual: click header link, modal appears, close modal, step content still visible |
| AC-07 | `?oauth_url=` deep link pre-fills scanner and shows an intercepted-link banner | Manual: load `/?oauth_url=<url>`, verify banner text |
| AC-08 | Switching between steps preserves the active report (no data reset) | Manual: scan URL on Step 1, navigate to Step 2, navigate back — same results |
| AC-09 | Zero nested bordered/shadowed cards inside the white sheet | Automated: `impeccable detect --json` returns `[]` |
| AC-10 | All text ≥ 13px, no eyebrow labels, IBM Plex fonts loaded | Automated: `design-taste-frontend lint.mjs` returns `0 FAIL, 0 WARN` |
| AC-11 | Mobile layout (390px): stepper, scanner, presets, and step content all visible without horizontal scroll | Manual: Chrome DevTools 390px viewport |
| AC-12 | `ScopeBombArena` removes the 4-tab sidebar and `scannerOpen` default-false guard | Code: `grep -n "scannerOpen" apps/web/src/components/ScopeBombArena.tsx` → 0 matches for default false |

---

## Non-Goals (Phase 4)

- Live `/api/scan-repo` or `/api/ai-triage` wiring (Phase 5)
- Rich provider CLI kill-switch scripts (Phase 6)
- Fake consent simulator full implementation (Phase 6)
- Download extension zip button (Phase 6)
- Full E2E visual test suite execution (Phase 7)

---

*UI-SPEC generated for Phase 04-guided-ux-architecture*
*Passes gsd-ui-checker: layout, component inventory, interaction, responsive, tokens, a11y, acceptance criteria all present*
