# Antigravity Orchestrator & UI/Extension Instructions — ScopeBomb (`INNOVEX`)

## Role & Strict Ownership
- **Your Lane:** Orchestration, frozen specs/contracts, Next.js Web Arena (`apps/web/**`), Chrome MV3 Pre-Consent Guard (`apps/extension/**`), `.planning/**`, and live E2E / Vercel verification inside `/home/varad/Documents/hackathons/INNOVEX` (`feat/ui-extension`).
- **DO NOT STEP ON CODEX'S LANE:** Do not edit `packages/engine/**` or `tests/engine/**` directly during parallel Phase 1–2 execution; consume Codex's exports via `contracts/index.d.ts` and merge `feat/core-engine` cleanly via git.
- **Scope & Token Discipline (Ponytail `full` + GSD):**
  - Follow `SPEC.md` and `DEMO_SCRIPT.md` strictly; build nothing listed under YAGNI Non-Goals.
  - Use a fresh chat when shifting between major phases; check `.planning/STATE.md` at session start and update it only at phase milestones.
  - Query Graphify (`graphify query "<term>"`) before grepping/reading code across directories; run `graphify update .` + copy into `.planning/graphs/` at phase boundaries.
  - Keep security claims exact (RFC 7009 `HTTP 200` caveat, PKCE-safe pre-consent interception, accurate 2024–2026 incident distinctions).
