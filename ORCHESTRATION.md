# Multi-Agent Orchestration & Handoff Playbook (`ScopeBomb`)

Read this on setup/handoff only. Notice ownership transferred from Antigravity to **Codex as Lead Orchestrator** on `2026-11-11`.

## 1. Current Worktree & Branch Topology (as of 2026-11-11)
- `main` (`1ce7fb1`): Clean `v1.1` baseline prior to candidate refactors. Contains the fully merged deterministic engine.
- `feat/core-engine` (`/home/varad/Documents/hackathons/INNOVEX/.worktrees/core-engine`, `4a92051`): **0 unmerged commits vs `main`** (`packages/engine/**`, `tests/engine/**`, `contracts/**`, `data/scope_catalog.json` are already synced across all active branches).
- `feat/ui-extension` (`/home/varad/Documents/hackathons/INNOVEX`, `900f4c7`): **Candidate B** — full Welcome-first 3-step UX (`Check input -> Understand exposure -> Review actions`), `ScanInput`, `EvidenceSummary`, `AccessibleDialog`, `triage.ts`, `verify-browser.mjs`, `docs/UX-VALIDATION.md`, `tests/{analysis,repository}.test.ts` (`14/14` passing).
- `fix/v11-release` (`/tmp/scopebomb-v11-release`, `5f6a576`): **Candidate A** — hardened release candidate (`boundedBody.ts`, strict runtime allowlist `aiTriage.ts`, `apps/web/tests/security.test.ts` `9/9`, `apps/extension/tests/guard.test.mjs` `2/2`, reproducible ZIP `pack.mjs`, `0 FAIL / 0 WARN` lint, `.planning/V11-RELEASE-REVIEW.md`).
- **Frozen Contracts:** `contracts/**`, `data/scope_catalog.json`, `packages/engine/**`, `tests/engine/**`.

## 2. Launching Codex as Lead Orchestrator
Run inside `/home/varad/Documents/hackathons/INNOVEX` (repo root owns `.vercel/project.json` and `.vercelignore`):
```bash
cd /home/varad/Documents/hackathons/INNOVEX
codex \
  -c mcp_servers.rea.enabled=false \
  -c mcp_servers.aws-mcp.enabled=false \
  -c mcp_servers.firecrawl.enabled=false
```
*(Repo `.codex/config.toml` also applies these MCP exclusions when trusted.)*

## 3. Token-Saving Discipline
- **Graphify Before Reading:** Run `graphify query "<topic>"` or `graphify path A B` before broad greps. Run `graphify update .` (AST-only, $0 API cost) after modifying code, then sync `.planning/graphs/`.
- **Ponytail (`full`):** Standard library & platform primitives before adding dependencies; minimal diffs; focused checks.
- **Bounded Commands:** Pipe long outputs (`tail -n 30`). Never dump screenshots/large logs in chat; inspect visual screenshots directly.

## 4. Candidate Selection, Integration & Ship Gate
1. Compile & evaluate both `fix/v11-release` (`5f6a576`) and `feat/ui-extension` (`900f4c7`) (plus inspect `764f42b` if UI tradeoffs matter). See `.planning/CODEX_HANDOFF.md` for exact rubric & commands.
2. Unify the winning codebase cleanly (e.g., cherry-picking/porting security tests, ZIP pack determinism, `0 FAIL / 0 WARN` lint, and browser verification into one clean candidate).
3. Run full non-sandbox gates (`verify_contracts.py`, engine `30/30`, web tests, extension tests, `tsc --noEmit`, standard `npm run build`, `lint.mjs`, `inspect.mjs`, `impeccable detect`, headless browser E2E).
4. Merge winning result to `main`, push `origin/main` (and sync branches/prune temporary worktrees if desired), deploy via `vercel deploy --prod --yes` from repo root, and smoke-test live `https://scopebomb.vercel.app`.
