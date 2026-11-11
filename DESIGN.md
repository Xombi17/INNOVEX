---
name: ScopeBomb
description: Deterministic OAuth and shadow-AI blast-radius simulator rendered as a calm, porcelain-framed forensic workbench.
colors:
  slate-ice-ground: "#f9fbfc"
  porcelain-sheet: "#ffffff"
  surface-raised: "#f4f6f8"
  surface-active: "#ebedee"
  hairline-border: "#e8eaec"
  hairline-rule: "#f0f1f2"
  control-stroke: "#cdced1"
  carbon-ink: "#131416"
  slate-muted: "#5d5f60"
  deep-teal-accent: "#1b6c80"
  accent-tint: "#e6f2f5"
  emerald-contained: "#1e7b4f"
  emerald-pill-bg: "#dcfae5"
  emerald-pill-ink: "#04250e"
  crimson-persisting: "#c4242a"
  crimson-pill-bg: "#ffedea"
  crimson-pill-ink: "#831c1e"
  amber-warning: "#92400e"
  amber-pill-bg: "#fffbeb"
  neutral-pill-ink: "#353736"
typography:
  display:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  headline:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.015em"
  title:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "normal"
rounded:
  badge: "4px"
  control: "6px"
  card: "8px"
  sheet: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.carbon-ink}"
    textColor: "{colors.porcelain-sheet}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "32px"
  button-secondary:
    backgroundColor: "{colors.porcelain-sheet}"
    textColor: "{colors.carbon-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "32px"
  button-accent:
    backgroundColor: "{colors.deep-teal-accent}"
    textColor: "{colors.porcelain-sheet}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "32px"
  work-sheet:
    backgroundColor: "{colors.porcelain-sheet}"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.sheet}"
    padding: "24px 28px"
  text-input:
    backgroundColor: "{colors.porcelain-sheet}"
    textColor: "{colors.carbon-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  nav-item:
    backgroundColor: "{colors.slate-ice-ground}"
    textColor: "{colors.slate-muted}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 8px"
    height: "32px"
  nav-item-active:
    backgroundColor: "{colors.surface-active}"
    textColor: "{colors.carbon-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 8px"
    height: "32px"
  chip-danger:
    backgroundColor: "{colors.crimson-pill-bg}"
    textColor: "{colors.crimson-pill-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  chip-safe:
    backgroundColor: "{colors.emerald-pill-bg}"
    textColor: "{colors.emerald-pill-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
---

# Design System: ScopeBomb

## Overview

**Creative North Star: "The Forensic Transit Sheet"**

ScopeBomb treats OAuth and shadow-AI blast-radius triage with the calm authority of an engineering transit diagram printed on crisp porcelain paper. Rather than dark-mode security theater filled with glowing gauges, nested widgets, and stacked cards, the workspace pairs a single cool slate-ice L-frame (left rail plus compact top bar) with an inset white sheet delimited exclusively by 1px hairlines.

Every surface decision exists to speed comprehension across all three tools — the interactive Web Arena, the Chrome MV3 Pre-Consent Guard, and the local CLI — so a first-time reviewer can tell in seconds why a nominal `HTTP 200 OK` revoke leaves downstream providers exposed and verify how a multi-issuer plan or PKCE-safe scope downgrade resolves the chain.

**Key Characteristics:**
- Porcelain L-frame chrome (`#f9fbfc`) enclosing a crisp white inset work sheet (`#ffffff`) with subtle 1px hairline structure and zero resting shadows.
- Tabular numeric hierarchy (`IBM Plex Sans`) reserved strictly for prose, headlines, and counts, paired with disciplined `IBM Plex Mono` inside code and token primitives only.
- Quarantined color grammar where status chroma (`#c4242a` persisting breach, `#1e7b4f` contained path, `#92400e` RFC 7009 caveat) signals execution outcomes while interactive navigation accents stay restrained under deep teal (`#1b6c80`).

## Colors

A quiet, high-contrast porcelain light palette keeps long security chains legible across daylight workspaces, dedicating chromatic saturated hues solely to containment outcomes and a single brand action teal.

### Primary
- **Deep Teal Accent** (`#1b6c80`): Used sparingly for active tab underlines, focus outlines, inline navigation CTAs, and PKCE integrity explanations, supported by subtle accent tint (`#e6f2f5`) on personal trust-boundary pills and drag-over states.

### Neutral & Semantic Surfaces
- **Slate-Ice Ground** (`#f9fbfc`): Continuous structural background behind the desktop left sidebar, ruleless 48px top strip, and Chrome MV3 extension frame.
- **Porcelain Sheet** (`#ffffff`): Elevated-by-tone primary working plane for simulations, remediation steps, and pre-consent interstitials.
- **Surface Raised / Active** (`#f4f6f8` / `#ebedee`): Soft recessed fills for code snippets, selected domino items, and active left-rail navigation rows.
- **Hairline Border & Inner Rule** (`#e8eaec` / `#f0f1f2`): Structural separators dividing sections, metrics, and table rows without heavy shadows.
- **Carbon Ink & Slate Muted** (`#131416` / `#5d5f60`): Primary headings, body copy, and secondary captions engineered for ≥4.5:1 text contrast.
- **Containment Outcomes** (`#1e7b4f` / `#dcfae5` / `#04250e` Contained; `#c4242a` / `#ffedea` / `#831c1e` Persisting; `#92400e` / `#fffbeb` RFC 7009 Caveat): Strictly semantic signal pairs for blast survival, verification probes, and least-privilege downgrades.

### Named Rules
**The Quarantined Signal Rule.** Saturated red, amber, and green belong strictly to simulation truth (persisting compromise, HTTP 200 traps, verified containment). Chrome, wrappers, and passive labels remain anchored in `#f9fbfc`–`#131416` neutrals with `#1b6c80` for focus and primary exploration links.

## Typography

**Display Font:** `IBM Plex Sans` (with `system-ui, -apple-system, sans-serif` fallback)  
**Body Font:** `IBM Plex Sans` (with `system-ui, -apple-system, sans-serif` fallback)  
**Label/Mono Font:** `IBM Plex Mono` (with `ui-monospace, SFMono-Regular, monospace` fallback — strictly for OAuth scopes, secrets keys, endpoints, and CLI strings)

**Character:** Precision technical sans-serif geometry pairs crisp readability at `13px–14px` prose weights with tabular figures (`font-variant-numeric: tabular-nums`) so numeric blast metrics align cleanly when flipping simulation modes.

### Hierarchy
- **Display KPI** (Weight 400, `28px`, line-height `1.3`, `tabular-nums`): Used exclusively for the 4 headline metrics (`Blast risk`, `Escalation depth`, `Active containment`, `Paths still open`). Normal weight (`400`) keeps numbers calm rather than loud.
- **Headline** (Weight 600, `22px`, line-height `1.35`, letter-spacing `-0.015em`): Sheet H1 summarizing the active scenario or containment outcome in 1–2 lines.
- **Title** (Weight 600, `16px`, line-height `1.4`): Section headings (`Cross-issuer escalation domino map`, `Ordered containment checklist`, `Pre-consent browser guard`).
- **Body** (Weight 400–500, `14px`, line-height `1.5`, measure `65ch–74ch`): Explanations, forensic node notes, and 3-step educational walkthrough copy.
- **Label & Mono Data** (Weight 500, `13px`, line-height `1.45`): Control buttons, status badges, hairline headers, and monospace technical keys.

### Named Rules
**The Zero-Eyebrow, Zero-Sub-13px Rule.** Web UI copy maintains a `13px` typographic floor (`13 / 14 / 16 / 22 / 28px`) with no uppercase category kickers above headings and zero prose rendered in monospace.

## Layout

Desktop viewports (`>= 1024px`, `lg`) anchor a sticky `240px` left rail (`#f9fbfc`) beside a full-height main column headed by a compact `48px` ruleless bar and an inset `#ffffff` sheet (`border-radius: 16px`, `margin-right/bottom: 8px`). Inside the sheet, content locks to a centered `1160px` container separated vertically by `24px` (`space-y-6`) and 1px section rules. Narrow tablets (`768px`) and mobile (`390px`) collapse the left rail into an on-demand fullscreen drawer (`aria-modal="true"`), switch the preset selector to a native labeled control, and replace wide data tables with full-width stacked hairline items so zero columns clip horizontally.

## Elevation & Depth

Depth in ScopeBomb comes purely from **single-step tonal shift plus 1px hairline strokes (`#e8eaec`)** — never drop shadows. The `#f9fbfc` outer chrome sits slightly behind the crisp `#ffffff` work sheet, while recessed code blocks (`#f4f6f8`) drop slightly inward. Subtle motion (`cubic-bezier(0.22, 1, 0.36, 1)`) only animates lightweight hover and active indicator transitions and respects `prefers-reduced-motion`.

### Named Rules
**The Flat-By-Default Rule.** Resting containers use zero `box-shadow` and zero nested card wrappers. Hairline horizontal rules (`border-[#e8eaec]`) and vertical column dividers establish hierarchy without stacked rectangular boxes.

## Shapes

Controlled, functional radii scale strictly with container scale: small monospace tags use `4px`, interactive buttons and form inputs use `6px`, secondary surfaces use `8px`, status pills are full capsule (`9999px`), and only the primary desktop white work sheet carries a soft outer radius (`16px`).

## Components

Every interactive primitive uses clear surface boundaries (`1px solid #cdced1` on interactive controls vs. `1px solid #e8eaec` on passive seams) and unambiguous action labels.

### Buttons
- **Shape:** Subtle technical radius (`6px`), compact `32px` height (`h-8`) for toolbars and `36px` (`h-9`) alongside full inputs.
- **Primary (`Sim/Scan`):** Solid carbon fill (`#131416`) with `#ffffff` text and `12px–16px` horizontal padding; darkens to `#2a2c30` on hover.
- **Containment Plan Confirm:** Solid emerald (`#1e7b4f`) with `#ffffff` text when full multi-issuer containment is active.
- **Secondary / Ghost:** Pure `#ffffff` background, `1px solid #cdced1` border, `#131416` text, subtle `#f4f6f8` hover fill.
- **Accent Action (`Re-audit clean scopes`):** Deep teal `#1b6c80` fill with `#ffffff` text for primary verification loops.

### Chips & Status Pills
- **Style:** Full pill radius (`9999px`), `13px` medium weight (`Web`) or `12.5px` (`Extension`), high-contrast semantic pair fills (`#ffedea`/`#831c1e`, `#fffbeb`/`#92400e`, `#dcfae5`/`#04250e`, `#e6f2f5`/`#134e5d`).
- **State:** Interactive trust-boundary filter pills invert to `#131416` background with `#ffffff` label when active.

### Cards / Containers (Hairline-Divided Sections)
- **Corner Style:** Zero inner nested rounded boxes; sections live directly inside the `16px`-radius desktop `#ffffff` sheet.
- **Separators:** `1px solid #e8eaec` top rules separate major sections; `1px solid #f0f1f2` horizontal hairlines separate sibling list rows and checklist steps.

### Inputs / Fields
- **Style:** `36px` height (`#ffffff` background, `1px solid #cdced1` border, `6px` radius) for URL inspection; expandable hairline-ruled panel houses a `2px` teal bottom-border active tab bar and local drag-and-drop textarea (`#f9fbfc` fill for config code).
- **Focus & Errors:** All focusable controls render a `2px solid #1b6c80` focus ring (`outline-offset: 2px`). Validation errors appear inline inside `role="alert"` blocks bordered at the top in `#f0c8ca` with `#831c1e` ink while keeping valid prior audits active.

### Navigation
- **Workflow navigation:** Horizontal three-step navigation (`Check input`, `Understand exposure`, `Review actions`) with separate incident presets. Scanner drafts remain mounted across step changes; old results stay explicitly labeled until a new check succeeds.
- **Dialogs:** Native modal dialogs provide focus containment, Escape dismissal and focus restoration for tool explanations and the isolated consent sandbox. Mobile controls wrap within the work sheet.

### Blast-Radius Domino Transit Columns
- **Structure:** Four balanced left-to-right causal stages (`1. Entry grant`, `2. Permissions & keys`, `3. Direct blast`, `4. Downstream chain`) connected visually on desktop (`>= xl`) by compact directional arrows and 1px vertical column hairlines.
- **Rows:** Hairline-separated nodes capped at 5 per column with clean `"Show N additional targets"` expansion and a bottom forensic inspector revealing exact risk scores, trust zones, escalation triggers, and raw catalog keys.

## Do's and Don'ts

### Do:
- **Do** keep all security status semantics consistent across Web Arena, Chrome Extension Popup/Guard, and CLI explanations (`Persists`/`Critical` in `#c4242a`/`#831c1e`, `Contained`/`Low` in `#1e7b4f`/`#04250e`, RFC 7009 warning in `#92400e`).
- **Do** preserve `1px solid #e8eaec`/`#f0f1f2` hairline separation directly inside the single inset `#ffffff` sheet without wrapping sections in secondary bordered cards.
- **Do** mask secrets locally before display (`GITHUB_TOKEN ([REDACTED])`), allow URL/command wrapping cleanly without mid-word breaks on normal English prose (`[overflow-wrap:anywhere]`), and collapse wide checklist tables into stacked hairline items below `768px`.

### Don't:
- **Don't** nest bordered or shaded cards inside `.sheet` / `<main>` (verified by keeping automated detector output at zero findings).
- **Don't** add decorative 3px left border stripes on alerts, uppercase category kickers above headings, drop shadows on resting panels, or dark-mode neon gradients.
- **Don't** render plain narrative sentences in `IBM Plex Mono` or drop Web Arena labels below `13px`.

## v1.1 state and evidence rules

Input source labels separate sample scenarios, supplied input and selected repository files. Failed or canceled checks retain the last result with a freshness notice. Repository coverage exposes skipped files and bounds. Local explanations are immediate; external AI is opt-in with explicit provenance. Runbook review checkboxes record local review progress, not verified containment. Detailed commands and the permission guard use progressive disclosure.

The compact frame, porcelain palette and IBM Plex fonts remain unchanged. The scanner input is always visible in the first workflow step. Standalone web pages do not claim to monitor other browser tabs.
