# Roadmap: ScopeBomb (`INNOVEX 2026 — PS 05`)

## Milestones

- ✅ **v1.0 MVP** - Phases 0–3: Core Engine, Web Arena, Chrome MV3 Guard & Initial Vercel Deploy (shipped 2026-11-10)
- ✅ **v1.1 New-User UX, AI Triage & Sandbox** - Phases 4–7: Guided 3-Step Flow, Live GitHub Scanner, AI Threat Triage, Concrete Kill Switches, Chrome Extension Sandbox & Production Ship (shipped 2026-11-10)
- 🚀 **v1.2 Enterprise Security Platform & Hackathon Flagship** - Phases 8–12: Instant Attack Detonator, Live Swarm Streaming, Multi-Cloud Active Revocation, CI/CD Gate CLI & Distributed Tracing (IN PROGRESS)

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

### Phase 8: Instant Attack Detonator & High-Impact Cockpit UI
**Goal**: Deliver an immediate "Aha!" moment within 5 seconds of landing. Un-box the `DominoGraph` from the accordion onto the primary hero view, add a real-time animated "Detonate Scope Bomb" attack scrubber, and replace defensive text with punchy developer storytelling.
**Depends on**: Phase 7
**Requirements**: [HERO-01, HERO-02, HERO-03]
**UI hint**: yes
**Success Criteria**:
  1. Visitors see the interactive Domino Graph immediately above the fold without clicking a collapsed accordion.
  2. A pulsing **"Detonate Scope Bomb"** button triggers an animated sequence highlighting nodes sequentially from initial grant to multi-cloud takeover.
  3. Interactive toggle between **"Naive Disconnect"** (exposing surviving breach nodes) and **"Surgical Multi-Issuer Containment"** is prominent and responsive.
**Status**: Ready

### Phase 9: Live 4-Agent Defense Swarm Streaming & Interactive Triage Mesh
**Goal**: Convert the passive Agent Operations Center into a real-time collaborative defense mesh where Sentinel, Threat Modeler, Red Team, and Containment Commander stream structured security deliberation with one-click quick-action chips.
**Depends on**: Phase 8
**Requirements**: [SWARM-01, SWARM-02, SWARM-03]
**UI hint**: yes
**Success Criteria**:
  1. 4 agent personas auto-stream concise, role-specific reasoning cards when a scenario is loaded or analyzed.
  2. One-click quick-action pills allow instant evaluation of worst-case exploit paths, CISO reporting, and persistence probes.
  3. Graceful fallback ensures instant offline response even if external LLM gateways throttle.
**Status**: Planned

### Phase 10: Multi-Cloud Token Revocation Engine & Active Containment API
**Goal**: Elevate ScopeBomb from passive modeling to an active security remediation platform. Implement backend API endpoints that orchestrate real cloud revocation payloads across AWS (STS/IAM), GitHub (OAuth App grants/PATs), and Google.
**Depends on**: Phase 9
**Requirements**: [REMED-01, REMED-02, REMED-03]
**UI hint**: no
**Success Criteria**:
  1. API routes `/api/remediate/aws` and `/api/remediate/github` generate syntactically valid, copy-ready or runnable API containment payloads.
  2. Post-revocation verification probes test for exact HTTP 401/403 status codes.
  3. A tamper-evident remediation ledger records completed containment actions with ISO timestamps.
**Status**: Planned

### Phase 11: Enterprise CI/CD Pipeline Gate & Standalone CLI Scanner (`scopebomb-cli`)
**Goal**: Package the scanner into a standalone Node.js CLI and GitHub Action that developers and security teams can run in CI pipelines to block PRs introducing dangerous cascading scopes or uncontained MCP configs.
**Depends on**: Phase 10
**Requirements**: [CLI-01, CLI-02, CI-01]
**UI hint**: no
**Success Criteria**:
  1. Standalone command `npx scopebomb scan .` or local executable parses local `.env`, `.mcp.json`, and manifests, outputting structured JSON and formatted terminal blast radiuses.
  2. GitHub Action workflow runs on pull requests, detecting overbroad scopes and posting an automated blast radius PR comment.
  3. Non-zero exit code on critical blast-radius thresholds to gate deployments.
**Status**: Planned

### Phase 12: High-Conversion Product Landing Page & Multi-Tab Web Architecture
**Goal**: Transform ScopeBomb from a single cluttered workbench into a clean, modular SaaS website featuring a high-conversion public Landing Page (`/`), a dedicated Threat Arena & Cockpit tab (`/arena`), an Autonomous SOC tab (`/swarm`), and dedicated pages for the Chrome Extension and Documentation.
**Depends on**: Phase 11
**Requirements**: [SITE-01, SITE-02, SITE-03]
**UI hint**: yes
**Success Criteria**:
  1. High-impact public landing page with compelling problem visualization, 90-second video hero, and direct CTA to launch the interactive cockpit.
  2. Multi-tab navigation architecture replacing cluttered single-view vertical stacking.
  3. Clean responsive layout across desktop and mobile with zero visual clutter.
**Status**: Planned

### Phase 13: OpenTelemetry Distributed Tracing, Verification Suite & Live Production Ship
**Goal**: Instrument the full ingestion, graph traversal, and agent mesh with OpenTelemetry distributed tracing for deep enterprise observability, run complete CDP browser verification, update Graphify, and ship to live production.
**Depends on**: Phase 12
**Requirements**: [OTEL-01, VERIFY-01, SHIP-01]
**UI hint**: yes
**Success Criteria**:
  1. OpenTelemetry trace spans emitted for input parsing, blast radius graph computation, and swarm consensus.
  2. All automated tests (engine, web, extension, contracts, and headless Chrome browser CDP) pass with 0 errors.
  3. Production deployment updated at `https://scopebomb.vercel.app` and knowledge graph refreshed with `graphify update .`.
**Status**: Planned

## Progress

**Execution Order:**
Phases execute in numeric order: 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11 -> 12 -> 13

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
| 8. Instant Attack Detonator & UI Hero | v1.2 | 1/1 | Complete | 2026-11-13 |
| 9. Live 4-Agent Defense Swarm Mesh | v1.2 | 1/1 | Complete | 2026-11-13 |
| 10. Multi-Cloud Active Revocation Engine | v1.2 | 1/1 | Complete | 2026-11-13 |
| 11. CI/CD Scanner & ScopeBomb CLI | v1.2 | 1/1 | Complete | 2026-11-13 |
| 12. Landing Page & Multi-Tab Web Redesign | v1.2 | 0/1 | Ready | - |
| 13. OpenTelemetry Tracing & Live Ship | v1.2 | 0/1 | Planned | - |
