# ScopeBomb (`INNOVEX 2026 — PS 05`)

## What This Is

ScopeBomb is an OAuth and shadow-AI blast-radius analyzer built for **INNOVEX 2026 (Track PS 05 — AI-Powered Cybersecurity)**. It shows developers and judges—in under 90 seconds with zero login wall—what a single over-scoped OAuth consent link, leaked `.env`/`.mcp.json` secret, or public repository misconfiguration actually exposes across Google, GitHub, Vercel, OpenAI, Anthropic, Slack, Microsoft Entra, and Salesforce, why a single `HTTP 200 OK` revoke fails to contain downstream attackers, and how to neutralize every affected issuer or intercept risky permissions before consent.

## Core Value

A first-time visitor or judge understands within 5 seconds what ScopeBomb inspects, sees the exact cross-app blast chain clearly without reading a wall of text, and walks away with concrete, protocol-accurate containment actions plus a working browser blocker.

## Current Milestone: v1.1 — New-User UX Rebuild, AI Threat Triage, Repo Scanner & Extension Sandbox

**Goal:** Eliminate the `v1.0` cognitive overload and navigation confusion, and elevate ScopeBomb into a crystal-clear, interactive PS 05 submission without disturbing the frozen deterministic core (`packages/engine/**`, `contracts/**`, `data/scope_catalog.json`).

**Target features:**
- Guided 3-step linear Web Arena flow (`Step 1: Scan or Test` -> `Step 2: Visual Domino Map` -> `Step 3: Fix Plan & Browser Blocker`) with zero duplicate tab sections and an always-visible interactive hero input bar.
- Plain-English outcome-first copy (`<400` words per step) with optional collapsible `"Technical forensics"` disclosures for RFC 7009, PKCE `S256`, and catalog keys.
- Live stateless public GitHub repository scanner (`POST /api/scan-repo`) fetching `.mcp.json`, `.env*` templates, and workflow risks with immediate secret masking.
- Optional AI threat triage explainer (`POST /api/ai-triage`) translating redacted findings into an attacker story and first-60-seconds action plan, degrading cleanly to deterministic plain-English triage when offline or without API keys.
- Concrete provider CLI/API kill-switch catalog (`curl`, `gh`, revocation verification probes expecting `401 Unauthorized`, console deep links) enriching `apps/web` remediation steps.
- In-browser `"Simulate Fake AI App Consent"` interactive guard sandbox + one-click downloadable `scopebomb-mv3-extension.zip` package (`apps/web/public/downloads/`) with 3-step Chrome loader instructions.

## Requirements

### Validated (v1.0)

- ✓ Deterministic OAuth URL, `.mcp.json`/`.env`, Takeout, and 5 incident-preset parser (`packages/engine/parsers.ts`) — v1.0
- ✓ Multi-hop trust-boundary blast-radius graph generator conforming to `contracts/scope_bomb.schema.json` — v1.0
- ✓ RFC 7009 naive single-revoke vs. multi-issuer containment simulation (`packages/engine/containment.ts`) — v1.0
- ✓ PKCE-preserving pre-consent evaluator (`packages/engine/pre-consent.ts`) + Chrome MV3 extension (`apps/extension`) — v1.0
- ✓ Local secret-masking CLI (`packages/engine/cli.ts`) + 30/30 Node unit tests (`tests/engine/`) — v1.0
- ✓ Light porcelain `framed-sheet` design foundation + Vercel production deploy at `https://scopebomb.vercel.app` — v1.0

### Active (v1.1)

- [ ] **UX-01..05**: 3-step guided Web Arena navigation, always-open input bar, scenario pills, compact `<400` words/screen progressive disclosure, compact `?` 3-surface explainer modal/drawer.
- [ ] **SCAN-01..02**: Public GitHub repository scanner API (`POST /api/scan-repo`) + browser tab integration with SSRF protections and immediate secret masking.
- [ ] **AI-01..03**: Stateless plain-English AI threat triage endpoint (`POST /api/ai-triage`) consuming strictly redacted summaries, Gemini/OpenAI support + deterministic offline fallback, clear step attribution UI.
- [ ] **REM-01..03**: Rich provider CLI/`curl`/API kill-switch catalog (`apps/web/src/lib/remediationTemplates.ts`), verification probe templates, and interactive plain-English/CLI toggle in Step 3.
- [ ] **EXT-01..03**: In-browser `"Simulate Fake AI App Consent"` PKCE sandbox + downloadable `scopebomb-mv3-extension.zip` build artifact + clear Web-vs-Extension handoff guidance.
- [ ] **REL-01..03**: Full desktop/tablet/mobile visual & Taste/Impeccable gates, headless Chrome E2E verification, frozen-lane `git diff` audit, Graphify + doc sync, live `https://scopebomb.vercel.app` deploy.

### Out of Scope

- Modifying frozen `packages/engine/**`, `tests/engine/**`, `contracts/**`, or `data/scope_catalog.json` — owned by Codex lane / frozen verification contract.
- Live OAuth login walls, persistent databases, Redis, billing, or user accounts (`SPEC.md` YAGNI non-goals).
- Executing destructive token-revocation mutations against live user accounts without explicit manual copy/run.
- Scanning private GitHub repos requiring stored OAuth user tokens.

## Context

- User testing of `v1.0` (`ea28931`) surfaced immediate comprehension friction: a first-time user saw a 3.6-screen vertical dump (~1,171 words) mixing technical jargon, redundant tabs (`Blast simulator` duplicating `Remediation plan` and `PKCE guard`), hidden scanner controls, generic remediation advice on `P2`/`P3`, static `ai_explainer_used: false`, and confusion about how a web page interacts with the Chrome MV3 extension (`?oauth_url=`).
- Keeping `framed-sheet` visual craft (`#f9fbfc` chrome, `#ffffff` sheet, `IBM Plex Sans`/`Mono`, hairline dividers, zero nested cards, `13px+` type floor) guarantees passing all `impeccable` and `design-taste-frontend` automated audits while reorganizing IA for instant 5-second comprehension.

## Constraints

- **Ownership / Freeze (`AGENTS.md`, `GEMINI.md`)**: NEVER alter `packages/engine/**`, `tests/engine/**`, `contracts/**`, or `data/scope_catalog.json`. All `v1.1` additions live inside `apps/web/**`, `apps/extension/**` packaging scripts, `.planning/**`, and docs.
- **Security & Protocol Accuracy**: Always preserve RFC 7009 `HTTP 200 OK != proof of containment`, access-token `SHOULD` cascading + illustrative JWT TTL caveat, GitHub `DELETE /applications/{client_id}/grant`, and zero mid-flight `scope=` rewriting on PKCE URLs (`safe_replacement_url: null`). Never transmit raw unredacted secrets to `/api/ai-triage`.
- **Serverless Safety (`POST /api/scan-repo`)**: Allow-list only `github.com` / `api.github.com` / `raw.githubusercontent.com`, reject private/loopback/IP hosts, cap inspected files & bytes to avoid SSRF or serverless timeouts.
- **Offline Fallback**: `/api/ai-triage` MUST return valid structured triage even with zero `GEMINI_API_KEY` or `OPENAI_API_KEY` set in Vercel/local env.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Rebuild Web Arena into 3 linear steps (`Scan` -> `Domino` -> `Fix & Guard`) | Eliminates tab duplication and 3.6-screen scroll wall | — Pending (v1.1 Phase 4) |
| Enrich remediation & AI triage in `apps/web` layer rather than touching frozen `packages/engine` | Preserves 30/30 Codex engine tests & `contracts/verify_contracts.py` lock | — Pending (v1.1 Phases 5–6) |
| Package built `apps/extension` into `apps/web/public/downloads/scopebomb-mv3-extension.zip` + in-browser fake consent test | Lets judges test PKCE blocking immediately on Vercel without `git clone` | — Pending (v1.1 Phase 6) |
| Build `/api/scan-repo` for public GitHub repos & `/api/ai-triage` with deterministic fallback | Satisfies Track PS 05 AI cybersecurity demo while preserving zero-login & zero-key reliability | — Pending (v1.1 Phase 5) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition` or milestone check):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

---
*Last updated: 2026-11-10 after starting Milestone v1.1*
