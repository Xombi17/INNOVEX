# Requirements: ScopeBomb v1.1 — New-User UX, AI Triage & Sandbox

**Defined:** 2026-11-10
**Core Value:** A first-time visitor or judge understands within 5 seconds what ScopeBomb inspects, sees the exact cross-app blast chain clearly without a wall of text, and leaves with actionable containment scripts plus an interactive browser blocker.

## v1.1 Requirements

Requirements for Milestone `v1.1`. Each maps cleanly to Phases 4–7.

### Guided Navigation & Progressive Disclosure (`UX`)

- [ ] **UX-01**: User navigates a clear 3-step guided workflow (`1. Scan or Test`, `2. Attack Path`, `3. Fix Plan & Blocker`) with zero duplicate panels repeated across views.
- [ ] **UX-02**: User immediately sees the interactive scanner bar above the fold on initial page load (paste OAuth link, drop/paste `.mcp.json` or `.env`, scan public GitHub repo, or click a 1-click demo trigger).
- [ ] **UX-03**: User sees scenario presets (`Shadow-AI MCP`, `Midnight Blizzard`, `Salesloft Drift`, `Context.ai`, `LiteLLM CI`) cleanly separated from workflow step navigation.
- [ ] **UX-04**: User reads plain-English outcome-first headlines and `<400` words per step view, with raw catalog IDs, RFC citations, and node JSON keys tucked behind an expandable `"Technical forensics"` disclosure.
- [ ] **UX-05**: User can open a compact `"How 3 Tools Connect"` walkthrough drawer/dialog from the top bar explaining Web Arena, Chrome MV3 Extension (`?oauth_url=`), and Local CLI without leaving their active audit.

### Public Repository Scanner (`SCAN`)

- [ ] **SCAN-01**: User can enter any public `owner/repo` or `https://github.com/owner/repo` URL in Step 1 and run a stateless `POST /api/scan-repo` inspection of `.mcp.json`, `mcp.json`, `.env.example`, and `.github/workflows/*.yml`.
- [ ] **SCAN-02**: `/api/scan-repo` enforces strict SSRF guards (`github.com` only, no local/private IP fetch, file count & payload size caps) and redacts any discovered token-like values before returning masked config input to `analyzeAudit()`.

### AI-Powered Threat Triage (`AI`)

- [ ] **AI-01**: `POST /api/ai-triage` accepts ONLY redacted `AuditReport` summary metrics, scopes, crossed boundaries, and surviving provider counts (never raw secret values) and returns plain-English **Attacker Story**, **Why 1-Click Revoke Fails**, and **First 60 Seconds Action**.
- [ ] **AI-02**: `/api/ai-triage` supports live model inference when `GEMINI_API_KEY` or `OPENAI_API_KEY` is configured and degrades deterministically to a grounded offline synthesizer (`fallback_used: true`) when no API key is present.
- [ ] **AI-03**: UI displays the AI Threat Triage summary clearly on Step 1/Step 2 with transparent attribution (`Live AI Triage` vs `Deterministic Offline Triage`) and zero fabricated security claims.

### Concrete Provider Kill Switches (`REM`)

- [ ] **REM-01**: Every `ContainmentStep` rendered in Step 3 (`apps/web/src/lib/remediationTemplates.ts`) is enriched with copy-ready CLI / `curl` / `gh` / API commands and direct console URLs per detected provider (`Google`, `GitHub`, `Vercel`, `OpenAI`, `Anthropic`, `Slack`, `Microsoft Entra`, `Salesforce`).
- [ ] **REM-02**: Each step pairs its revocation command with a copy-ready post-revoke verification probe (expecting `HTTP 401` / `token_revoked`) plus explicit RFC 7009 `HTTP 200 OK` trap context when applicable.
- [ ] **REM-03**: User can interactively check off simulated containment steps or toggle plain-English guidance vs copyable CLI snippet without executing unsafe live account mutations.

### Extension Sandbox & Downloadable Pack (`EXT`)

- [ ] **EXT-01**: User can trigger an in-browser **"Simulate Fake AI App Consent"** modal/flow that mimics a real third-party `"Acme AI Assistant wants access to Gmail & Drive"` authorization screen and intercepts it live with ScopeBomb's PKCE-safe guard view.
- [ ] **EXT-02**: Pre-consent view clearly explains why rewriting `scope=` mid-flight breaks SHA-256 PKCE `code_challenge` (`safe_replacement_url: null`) and provides one-click copy of least-privilege replacement scopes (`drive.file`, `gmail.readonly`, fine-grained PAT).
- [ ] **EXT-03**: Step 3 provides a working one-click download for `scopebomb-mv3-extension.zip` (`/downloads/scopebomb-mv3-extension.zip`) generated from built `apps/extension/`, paired with 3-step `chrome://extensions` Developer Mode install instructions.

### Verification, Governance & Production Ship (`REL`)

- [ ] **REL-01**: All frozen engine contracts stay intact (`python3 contracts/verify_contracts.py` passes, `node --test tests/engine/*.test.ts` 30/30 pass, `git diff -- packages/engine tests/engine contracts data/scope_catalog.json` is empty).
- [ ] **REL-02**: Rebuilt UI passes `design-taste-frontend` `lint.mjs` & `inspect.mjs` (`1440px`, `768px`, `390px` -> `0 FAIL`), `impeccable detect --json` -> `[]`, and full headless Chrome CDP E2E across all 3 steps, repo scan, AI triage, consent sandbox, and extension zip download.
- [ ] **REL-03**: `PRODUCT.md`, `DESIGN.md`, `.impeccable/*`, Graphify graph + `.planning/graphs/`, `main` & `feat/ui-extension`, and live `https://scopebomb.vercel.app` production deployment are updated and verified with zero orphan local processes.

## Out of Scope (Locked from `SPEC.md` & `AGENTS.md`)

| Feature | Reason |
|---------|--------|
| Editing `packages/engine/**` or `contracts/**` | Frozen Codex-owned lane & schema contract |
| User sign-in / OAuth account storage | Violates zero-login-wall YAGNI rule for <90s judging |
| Live destructive token revocation API execution | Safety risk; ScopeBomb outputs dry-run verified CLI/API commands only |
| Private GitHub repository scanning with user tokens | Avoids OAuth credential custody in web app |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| UX-01 | Phase 4 | Pending |
| UX-02 | Phase 4 | Pending |
| UX-03 | Phase 4 | Pending |
| UX-04 | Phase 4 | Pending |
| UX-05 | Phase 4 | Pending |
| SCAN-01 | Phase 5 | Pending |
| SCAN-02 | Phase 5 | Pending |
| AI-01 | Phase 5 | Pending |
| AI-02 | Phase 5 | Pending |
| AI-03 | Phase 5 | Pending |
| REM-01 | Phase 6 | Pending |
| REM-02 | Phase 6 | Pending |
| REM-03 | Phase 6 | Pending |
| EXT-01 | Phase 6 | Pending |
| EXT-02 | Phase 6 | Pending |
| EXT-03 | Phase 6 | Pending |
| REL-01 | Phase 7 | Pending |
| REL-02 | Phase 7 | Pending |
| REL-03 | Phase 7 | Pending |

**Coverage:**
- v1.1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-11-10*
*Last updated: 2026-11-10 after initializing Milestone v1.1*
