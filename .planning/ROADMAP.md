# Roadmap: ScopeBomb (`INNOVEX 2026 — PS 05`)

## Milestones

- ✅ **v1.0 MVP** - Phases 0–3: Core Engine, Web Arena, Chrome MV3 Guard & Initial Vercel Deploy (shipped 2026-11-10)
- ✅ **v1.1 New-User UX, AI Triage & Sandbox** - Phases 4–7: Guided 3-Step Flow, Live GitHub Scanner, AI Threat Triage, Concrete Kill Switches, Chrome Extension Sandbox & Production Ship (shipped 2026-11-10)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 0-3) - SHIPPED 2026-11-10</summary>

- **Phase 0: Foundation & Governance** — Froze `SPEC.md`, `DEMO_SCRIPT.md`, `contracts/scope_bomb.schema.json`, `contracts/index.d.ts`, `data/scope_catalog.json`, `AGENTS.md`, `GEMINI.md`, and worktree split (`feat/ui-extension`, `.worktrees/core-engine`).
- **Phase 1: Parallel MVP Vertical Slice** — Built deterministic engine (`136b0b8`) + initial Next.js Web Arena (`3ad5b4c`).
- **Phase 2: Chrome MV3 Guard + Live Engine + CLI** — Merged CLI (`4a92051`), wired live `@scopebomb/engine`, and shipped 7-module Chrome MV3 guard (`e4a0566`).
- **Phase 3: Vercel Deploy & Porcelain UI** — Deployed `apps/web` to `https://scopebomb.vercel.app`, linked MV3 guard to prod, refined `framed-sheet` UI (`ea28931`), and documented `PRODUCT.md`/`DESIGN.md`.

See full archive: `.planning/milestones/v1.0-mvp.md`

</details>

<details open>
<summary>✅ v1.1 New-User UX, AI Triage & Sandbox (Phases 4-7) - SHIPPED 2026-11-10</summary>

- **Phase 4: Guided 3-Step Information Architecture & Always-Visible Scanner** — Linear `1. Scan -> 2. Attack Path -> 3. Fix & Blocker` flow, always-visible input bar, dedicated preset strip, and connection modal.
- **Phase 5: Live Public GitHub Repo Scanner & Plain-English AI Threat Triage** — Stateless `/api/scan-repo` and `/api/ai-triage` serverless endpoints with strict SSRF/redaction safety and deterministic offline fallback.
- **Phase 6: Concrete Provider Kill-Switches & Downloadable Chrome Extension Sandbox** — Enriched CLI/API containment steps per provider, in-browser PKCE consent sandbox, and downloadable Chrome extension zip bundle.
- **Phase 7: End-to-End Visual/E2E Verification, Doc Sync & Live Production Ship** — Full verification suite (contract, 30/30 engine tests, Next.js typecheck, extension pack), doc sync, knowledge graph sync, and production deployment.

See full archive: `.planning/milestones/v1.1-roadmap.md`

</details>

## Phase Details

### Phase 4: Guided 3-Step Information Architecture & Always-Visible Scanner
**Goal**: First-time visitors immediately understand what ScopeBomb inspects within 5 seconds, see the interactive input bar right above the fold, and step cleanly through `1. Scan or Test` -> `2. Attack Path` -> `3. Fix Plan & Blocker` without redundant stacked walls.
**Depends on**: Phase 3 (`ea28931`)
**Requirements**: [UX-01, UX-02, UX-03, UX-04, UX-05]
**UI hint**: yes
**Success Criteria**:
  1. Opening `apps/web` presents a 3-step guided flow where each step has a focused single purpose (~1 to 1.5 screens tall, <400 words) and never duplicates heavy panels across tabs.
  2. The interactive scanner input bar is visible immediately on load without clicking a hidden header toggle.
  3. Scenario presets sit cleanly separated from the 3 workflow steps.
  4. A compact `"How 3 Tools Connect"` dialog from the header clearly shows how the Web Arena, Chrome MV3 Extension, and Local CLI work together.
**Status**: Complete (commit `f291605`)

### Phase 5: Live Public GitHub Repo Scanner & Plain-English AI Threat Triage
**Goal**: Visitors can paste any public `owner/repo` or `https://github.com/owner/repo` URL to inspect leaked `.mcp.json`/`.env`/workflow configurations safely, and receive a plain-English AI Threat Triage story powered by Next.js API routes with graceful deterministic offline fallback.
**Depends on**: Phase 4
**Requirements**: [SCAN-01, SCAN-02, AI-01, AI-02, AI-03]
**UI hint**: yes
**Success Criteria**:
  1. Entering a public repository hits `POST /api/scan-repo`, safely inspects root MCP/env/workflow config files within `github.com` allowlist constraints, masks credentials, and feeds into deterministic `analyzeAudit()`.
  2. `POST /api/ai-triage` receives strictly redacted `AuditReport` summary data and returns structured **Attacker Story**, **Why 1-Click Revoke Fails**, and **First 60 Seconds Action**.
  3. Step 1 and Step 2 prominently display the plain-English AI Triage card with truthful source attribution while keeping `packages/engine/**` completely untouched.
**Status**: Complete (commit `5cde632`)

### Phase 6: Concrete Provider Kill-Switches & Downloadable Chrome Extension Sandbox
**Goal**: Step 3 delivers immediately runnable provider revocation scripts (`curl`, `gh`, console deep links, and `401` verification probes) instead of generic placeholders, alongside an in-browser `"Simulate Fake AI App Consent"` sandbox and one-click downloadable Chrome MV3 extension bundle.
**Depends on**: Phase 5
**Requirements**: [REM-01, REM-02, REM-03, EXT-01, EXT-02, EXT-03]
**UI hint**: yes
**Success Criteria**:
  1. Every detected issuer step in Step 3 displays concrete, copy-ready revocation CLI/API commands, direct settings links, and post-revoke `401` verification probes matching RFC 7009 and GitHub grant-deletion semantics.
  2. Clicking **"Simulate Fake AI App Consent"** launches a realistic interactive third-party app authorization prompt in-browser demonstrating PKCE pre-consent blocking and scope downgrade.
  3. Clicking **"Download Chrome Extension (.zip)"** downloads a valid packaged zip from `/downloads/scopebomb-mv3-extension.zip` paired with 3-step setup instructions.
**Status**: Complete (commit `37f2595`)

### Phase 7: End-to-End Visual/E2E Verification, Doc Sync & Live Production Ship
**Goal**: Verify every visual, functional, contract, and protocol invariant locally and against live `https://scopebomb.vercel.app`, sync documentation + Graphify knowledge graph, and leave a spotless repository ready for INNOVEX 2026 submission.
**Depends on**: Phase 6
**Requirements**: [REL-01, REL-02, REL-03]
**UI hint**: yes
**Success Criteria**:
  1. `python3 contracts/verify_contracts.py`, `node --test tests/engine/*.test.ts` (30/30), `apps/extension` build + zip verification, `apps/web` typecheck, and zero diff across frozen engine pass.
  2. Plain-English 3-step flow, public repo scan, AI triage, consent sandbox, and zip download all verified.
  3. `PRODUCT.md`, `DESIGN.md`, `README.md`, Graphify, git branches, and production deployment updated.
**Status**: Complete (commit `90a288c`)

## Progress

**Execution Order:**
Phases execute in numeric order: 4 -> 5 -> 6 -> 7

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 0. Foundation & Governance | v1.0 | 1/1 | Complete | 2026-11-10 |
| 1. Parallel MVP Vertical Slice | v1.0 | 2/2 | Complete | 2026-11-10 |
| 2. MV3 Guard + Engine + CLI | v1.0 | 2/2 | Complete | 2026-11-10 |
| 3. Vercel Deploy & Porcelain UI | v1.0 | 2/2 | Complete | 2026-11-10 |
| 4. Guided 3-Step UI & Scanner Bar | v1.1 | 1/1 | Complete | 2026-11-10 |
| 5. Live Repo Scanner & AI Triage | v1.1 | 1/1 | Complete | 2026-11-10 |
| 6. Kill-Switches & Extension Sandbox | v1.1 | 1/1 | Complete | 2026-11-10 |
| 7. E2E Audit, Doc Sync & Live Ship | v1.1 | 1/1 | Complete | 2026-11-10 |
