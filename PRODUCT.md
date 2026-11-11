# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Security-conscious developers and engineering leads** auditing over-scoped OAuth consent links, IDE MCP tool configs (`.mcp.json`), and `.env` token overlap in local projects. (Confirmed in `SPEC.md`, `DEMO_SCRIPT.md`, `README.md`)
- **First-time evaluators and INNOVEX 2026 judges (Track PS 05)** needing to grasp the product mechanism and test it end-to-end in under 90 seconds with zero login wall. (Confirmed in `SPEC.md`, `DEMO_SCRIPT.md`, and the active request for plain-English clarity)

## Product Purpose

ScopeBomb makes cross-issuer OAuth and shadow-AI blast radius immediately legible and actionable across three local-first surfaces:
1. **Web Arena (`apps/web`):** Guided 3-step information architecture (`1. Check input` → `2. Understand exposure` → `3. Review actions`). Visualizes multi-hop credential escalation across five trust boundaries, provides live public GitHub repo scanning (`POST /api/scan-repo`), plain-English AI threat triage (`POST /api/ai-triage`), rich copy-ready provider kill-switch scripts, and an in-browser Fake AI App Consent sandbox simulator.
2. **Chrome MV3 Pre-Consent Guard (`apps/extension`):** Intercepts dangerous Google, GitHub, and Microsoft Entra authorization URLs before the user clicks Allow, preserves pending transactions and explains that PKCE challenges derive from verifiers, not scopes, and offers a fresh least-privilege initiation template plus a one-click deep link (`?oauth_url=`) into the Web Arena. Available via one-click download (`scopebomb-mv3-extension.zip`).
3. **Local Redacted Audit CLI (`packages/engine/cli.ts`):** Scans local project trees (`.mcp.json`, `mcp.json`, `.env*`) in Node 24, masks secrets locally before analysis, and emits deterministic `AuditReport` summaries or JSON matching `contracts/scope_bomb.schema.json`.

Success means a first-time visitor understands within seconds what all three tools do, why HTTP 200 revocation creates a false sense of security, and how each issuer step and PKCE downgrade resolves the risk. ([Inferred clarity criterion from voice request + SPEC.md])

## Positioning

Unlike generic OAuth checklist linters or single-vendor token viewers, ScopeBomb models possible cross-issuer persistence after a nominal `HTTP 200 OK` revoke and enforces PKCE-safe (`code_challenge` preserving) pre-consent interception using a zero-dependency deterministic engine with no login friction; public repo scans and opt-in AI use stateless server routes.

## Operating Context

- Desktop and mobile security triage sessions running interactively in `<90s` live demonstrations, standalone browser tabs, or Chrome MV3 popup/interstitial handoffs (`?oauth_url=`).
- Browser-local parsing for pasted inputs, server-side bounded public-repository scanning, and shared deterministic parsing in Next.js 16 and Chrome MV3 (`analyzeAudit` in `packages/engine`), importing `data/scope_catalog.json` and conforming strictly to `contracts/scope_bomb.schema.json`.
- Zero-exfiltration policy: pasted `.mcp.json` and `.env` secrets are masked locally and never leave the browser or local runtime.

## Capabilities and Constraints

- **Frozen deterministic core:** `packages/engine/**`, `contracts/scope_bomb.schema.json`, `contracts/index.d.ts`, and `data/scope_catalog.json` MUST remain behaviorally unchanged and read-only during UI refinement.
- **Technical accuracy mandates:** Always state RFC 7009 nuances honestly (`HTTP 200 OK` is returned even for invalid/revoked tokens; access-token cascading is only `SHOULD`; residual JWT TTL stays valid), preserve GitHub `DELETE /applications/{client_id}/grant`, and never corrupt live PKCE `code_challenge` via mid-flight `scope=` mutation (`safe_replacement_url: null` when PKCE is present).
- **YAGNI non-goals (`SPEC.md`):** No login walls, no backend DB/Redis/queues, no mandatory LLM keys, no live destructive API calls against user accounts, and no ungrounded providers outside `data/scope_catalog.json`.
- **No fabricated claims:** Use real grounded preset names, exact engine output counts, illustrative JWT TTL caveats labeled honestly, and zero synthetic testimonials, benchmarks, or third-party trust logos.

## Brand Commitments

- **Product name:** `ScopeBomb` (`INNOVEX 2026 — PS 05`).
- **Direction & Skills Mandate ([Explicit user instruction]):** Redesigned with both `impeccable` and `design-taste-frontend` (`framed-sheet` light devtools clarity architecture) so every security concept and cross-surface workflow is immediately understandable without visual clutter.

## Evidence on Hand

- `data/scope_catalog.json`: 5 real-world incident presets (`rohan_mcp_oauth_trap`, `midnight_blizzard_2024`, `salesloft_drift_2025`, `context_ai_vercel_2026`, `litellm_ci_2026`), plus multi-provider scope catalog entries, escalation rules, and exact revocation endpoints.
- `packages/engine/`: Verified deterministic TypeScript analyzer (`30/30` passing unit tests) and CLI (`node packages/engine/cli.ts`).
- `apps/extension/`: Built 7-module Chrome MV3 pre-consent guard with focused service-worker tests and a reproducible downloadable ZIP; see the release review for browser evidence.
- `https://scopebomb.vercel.app`: Live Vercel deployment.
- **Absences:** No customer logos, live account telemetry, or user avatars exist; do not invent them.

## Product Principles

1. **Legibility before density:** Summarize the blast story first (source evidence → possible exposure → issuer-specific review), then reveal issuer steps and node forensics on demand rather than stacking 30 cards at once.
2. **Prove mechanisms visually:** Contrast Naive RFC 7009 vs. Multi-Issuer containment and Raw PKCE vs. Clean Initiation side by side using real engine counts.
3. **Never touch live secrets:** Keep scanning, masking, and replacement preview strictly local and visibly trustworthy.
4. **Preserve protocol precision:** Never sacrifice RFC 7009, RFC 7636 PKCE, or GitHub grant-deletion accuracy for simplified marketing phrasing.

## v1.1 review limits

Pasted secrets remain local. Public repository files are processed on the server and returned only as redacted findings plus bounded inspection coverage. Optional AI requests are user-triggered and contain only counts and recognized providers/boundaries. A complete deterministic explanation remains available offline.

Reports model possibilities and do not establish actual compromise, credential validity or verified cleanup. Static keys can persist until revoked, TTLs are illustrative, and the full-containment view assumes successful actions plus verification. The consent sandbox uses a separate sample and never replaces the current audit.

Release evidence and pending production/live-model checks are tracked in `.planning/V11-RELEASE-REVIEW.md`; historical milestone completion records do not certify later working-tree edits.
