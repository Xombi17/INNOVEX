# Phase 4: Guided 3-Step Information Architecture & Always-Visible Scanner - Context

**Gathered:** 2026-11-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Rebuild `apps/web` information architecture, navigation, and above-the-fold layout so first-time users immediately see what ScopeBomb scans, interact with the live input bar on load, and progress cleanly through a non-overlapping **3-Step Guided Flow** (`1. Scan or Test` -> `2. Attack Path` -> `3. Fix Plan & Blocker`). Keeps all frozen engine contracts intact (`packages/engine/**` read-only) and preserves the light `framed-sheet` porcelain design system (`DESIGN.md`). Live API routes (`/api/scan-repo`, `/api/ai-triage`), provider CLI kill-switch enrichment, and downloadable extension zip are delivered in Phases 5 and 6; Phase 4 creates the clean UI shell, slots, and progressive disclosure layout for them.

</domain>

<decisions>
## Implementation Decisions

### Navigation & Layout Simplification (`UX-01`, `UX-03`)
- **D-01:** Replace the overlapping 4-tab sidebar (`Blast simulator`, `Remediation plan`, `PKCE guard`, `How it works` in `apps/web/src/components/ScopeBombArena.tsx`) with a **strict 3-Step Guided Stepper**:
  - **Step 1 — `Scan & Verdict`**: Always-visible input bar + 5 curated incident scenario pills + plain-English 3-metric verdict strip + concise blast summary (plus Step 5 AI Triage card slot).
  - **Step 2 — `Attack Path`**: Focused `DominoGraph` escalation flow showing left-to-right propagation + ONE clean segmented toggle (**`After 1-Click Revoke (Fails)`** vs **`After Full Multi-Issuer Plan (Fixed)`**) and single node forensic bar. No stacked remediation tables or PKCE blocks below it.
  - **Step 3 — `Fix Plan & Blocker`**: Focused remediation action checklist + Chrome MV3 PKCE Pre-Consent Guard preview (extended in Phase 6 with concrete CLI scripts, fake consent simulator, and downloadable `.zip`).
- **D-02:** Separate **Scenario Presets** (`Shadow-AI MCP`, `Midnight Blizzard`, `Salesloft Drift`, `Context.ai`, `LiteLLM CI`) into a dedicated compact horizontal preset strip or secondary switcher inside Step 1 / top frame so users never confuse *workflow steps* with *test scenarios*.
- **D-03:** Keep each active step compact (`~1 to 1.5` viewports tall, target `<400` rendered words per screen) by eliminating the duplicate full-page `overview` stack (`~3.6` screens / `1,171` words in `v1.0`). Include clear `Continue to Attack Path ->` / `View Fix Plan ->` step actions at the bottom of Steps 1 and 2.

### Always-Visible Input Bar Above the Fold (`UX-02`)
- **D-04:** Remove the hidden `scannerOpen` default (`false`) gate from `ScopeBombArena.tsx` and `InputAndPresetBar.tsx`. The scanner bar MUST be open and interactive on initial load above the fold with clean mode tabs:
  - `OAuth Login Link` (paste URL + 1-click **"Load PKCE Trap Sample"** / **"Simulate Fake AI App Consent"** trigger slot)
  - `.mcp.json / .env / Takeout` (drag/drop or paste local config; secrets masked locally in browser memory)
  - `GitHub Repo URL` (clean input + sample button slot, wired live to `POST /api/scan-repo` in Phase 5)

### Plain-English Headlines & Progressive Disclosure (`UX-04`, `UX-05`)
- **D-05:** Replace protocol-first opening titles (`"Google returns HTTP 200 on revoke, leaving 24 paths open"`) with plain-English outcome headlines understandable by non-OAuth specialists first, e.g.:
  - Step 1: `"Check what one AI login link or leaked .env key exposes"` (plus dynamic scenario risk verdict `"Danger: 1 login reaches GitHub, Vercel & 24 resources"`)
  - Step 2: `"Why clicking Revoke still leaves 24 paths open"` vs `"Full multi-account fix closes all exposed paths"`
  - Step 3: `"Follow these steps by provider & block bad logins before clicking Allow"`
- **D-06:** Tuck raw catalog IDs (`downstream_saas_takeover`), raw `node.label` strings, and detailed RFC 7009 normative citations (`SHOULD` cascading, invalid-token `200`, illustrative TTL disclaimer) behind a clean collapsible `"Technical forensics & RFC 7009 proof"` disclosure so protocol rigor remains 100% intact without overwhelming first-time skimmers.
- **D-07:** Replace the 4th `"How it works"` page tab with a compact **`How it Works` modal/drawer** triggered from the header (`"How the 3 tools connect"`), explaining clearly: (a) **Web Arena** inspects pasted URLs, files, or `?oauth_url=` links, (b) **Chrome MV3 Extension** intercepts browser OAuth navigations before Allow and deep-links here, (c) **Local CLI** (`node packages/engine/cli.ts . --json`) scans local repos offline with secret masking.

### Design System Preservation (`DESIGN.md`)
- **D-08:** Preserve all `framed-sheet` tokens strictly: `#f9fbfc` chrome, `#ffffff` main sheet (`rounded-[16px]`), `1px` hairlines (`#e8eaec`, `#f0f1f2`), `IBM Plex Sans` / `IBM Plex Mono`, Phosphor icons, `13px` minimum text size, `divide-x` / `divide-y` lists, **zero nested cards**, zero hero gradients, zero eyebrow labels.

### the agent's Discretion
- Exact responsive breakpoint transitions (`1440px` rail vs sticky top stepper on `<1024px` mobile/tablet) and exact visual polish of the modal/drawer overlay while staying `0 FAIL / 0 WARN` under `design-taste-frontend` & `impeccable`.

</decisions>

<specifics>
## Specific Ideas

- When someone arrives cold on `https://scopebomb.vercel.app`, the first 5 seconds should read like a clean security inspector (Snyk/Vercel/Linear restraint) rather than an unguided raw dump of 30 graph nodes + huge tables.
- Preserve `?oauth_url=...` deep-link handling on initial mount (`ScopeBombArena.tsx`), auto-advancing or pre-filling Step 1 with clear banner context (`"Intercepted link passed from browser guard"`).

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product & Design System
- `SPEC.md` — Core pillars, 5 grounded incident presets, YAGNI constraints, protocol accuracy requirements
- `PRODUCT.md` — Target users, 3-surface architecture, zero-exfiltration policy
- `DESIGN.md` — `framed-sheet` light porcelain color tokens, typography scale (`13px` floor), border/no-nested-card rules
- `DEMO_SCRIPT.md` — `<90s` live judge walkthrough script (must remain smooth and intuitive via Step 1 -> 2 -> 3)

### Existing Web Implementation (Antigravity Lane)
- `apps/web/src/components/ScopeBombArena.tsx` — Current sidebar, view switcher, metric strip, and `?oauth_url=` mount hook
- `apps/web/src/components/InputAndPresetBar.tsx` — Current collapsible input bar & Takeout/MCP handlers
- `apps/web/src/components/DominoGraph.tsx` — 4-stage horizontal blast graph columns + node forensic inspector
- `apps/web/src/components/ContainmentComparison.tsx` — Side-by-side Naive vs Full outcome cards + P1..Pn checklist
- `apps/web/src/components/PreConsentPreview.tsx` — PKCE rewrite warning + recommended scope downgrades
- `apps/web/src/components/HowItWorksView.tsx` — Existing 3-surface explainer copy to convert into compact header modal/drawer
- `apps/web/src/components/uiTokens.ts` — Provider/severity/boundary display maps & `humanizeNodeLabel()`

### Read-Only Contracts (Do Not Modify)
- `contracts/index.d.ts` — Exact `AuditInput`, `AuditReport`, `PreConsentDecision` types consumed via `apps/web/src/lib/auditAdapter.ts`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tryRunScopeBombAudit()` in `apps/web/src/lib/auditAdapter.ts` cleanly catches malformed inputs and returns typed `AuditReport`.
- `humanizeNodeLabel()`, `PROVIDER_LABELS`, `TRUST_BOUNDARY_META`, `SEVERITY_META`, `formatScopeShort()` in `apps/web/src/components/uiTokens.ts`.
- `DominoGraph` already separates 4 stages cleanly (`computeStageIndex`) and sorts persisting nodes first.

### Established Patterns
- `apps/web` uses Tailwind CSS v4 with arbitrary color hexes + `@fontsource/ibm-plex-sans` & `@fontsource/ibm-plex-mono` in `globals.css`.
- Flattened `divide-x`/`divide-y` hairline sections avoid `impeccable` `nested-cards` flags.

### Integration Points
- `apps/web/src/app/page.tsx` renders initial SSR `AuditReport` (`rohan_mcp_oauth_trap`) into `ScopeBombArena`.
- Keep state (`report`, `simulationMode`, `activeStep`, `activeOAuthUrl`) lifted in `ScopeBombArena.tsx` so switching Step 1 <-> Step 2 <-> Step 3 is instant and preserves inspected findings.

</code_context>

<deferred>
## Deferred Ideas

- Live `/api/scan-repo` & `/api/ai-triage` implementation — Phase 5
- Rich provider CLI kill-switch catalog, fake consent modal, & downloadable extension zip — Phase 6
- Full `impeccable` / Taste / CDP E2E / Vercel deploy sweep — Phase 7 (run lighter smoke check after Phase 4 too!)

</deferred>

---

*Phase: 04-guided-ux-architecture*
*Context gathered: 2026-11-10*
