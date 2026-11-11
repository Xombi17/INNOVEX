---
gsd_state_version: '1.0'
milestone: v1.1
milestone_name: New-User UX, AI Triage & Sandbox
current_phase: '7'
current_phase_name: Cross-Branch Comparison, Consolidation & Live Production Ship
status: shipped_v1.1
last_activity: 2026-11-11
release_code_commit: 1893afb
production_url: https://scopebomb.vercel.app
production_deployment: dpl_FZPypEKaBAqYr7akMEghzTZkTTWQ
progress:
  total_phases: 4
  completed_phases: 4
  total_plans: 4
  completed_plans: 4
  percent: 100
---

# Project State

ScopeBomb v1.1 is shipped and production-smoke verified. Candidate B (`641b8ad`, UX `900f4c7`) is the base; streaming body bounds, provider commands, deterministic packaging and extension tests were ported from Candidate A (`5f6a576`). Full comparison, limits and evidence: `.planning/V11-CONSOLIDATED-RELEASE.md`.

## Release and branch state

- Release code `1893afb` fast-forwarded into `main`; `feat/ui-extension` synced; both pushed to origin. This state/evidence update follows the code deployment and changes no runtime files.
- `/home/varad/Documents/hackathons/INNOVEX` is the linked deployment root. Vercel deployment `dpl_FZPypEKaBAqYr7akMEghzTZkTTWQ` is Ready and aliases `https://scopebomb.vercel.app`.
- Candidate A remains available at `/tmp/scopebomb-v11-release`, branch `fix/v11-release`, commit `5f6a576`, for comparison. Both candidates passed standard builds; A required discarding its stale generated build cache, without a webpack fallback.
- Core worktree `feat/core-engine` remains at `4a92051`. `packages/engine/**`, `tests/engine/**`, `contracts/**` and `data/scope_catalog.json` have zero diff from frozen baseline `1ce7fb1`.

## Verified gates

- Contracts valid; engine 30/30, web 23/23, extension 2/2; TypeScript and standard `npm run build --prefix apps/web` passed.
- Browser E2E: 39/39 locally and 39/39 against production, no runtime/console errors, 1440px desktop and 390/320px reflow. Dialog centering, focus, Escape, skip link, history, redaction, AI opt-in and coverage reporting checked.
- Lint and rendered inspector: 0 FAIL / 0 WARN, at 1440/768/390px. Local and production Impeccable desktop/mobile JSON reports are empty. Screenshots visually reviewed.
- Chrome MV3: actual unpacked extension popup/guard and supported top-level OAuth interception checked, preserving the exact original URL; PKCE safe replacement remains null.
- Extension ZIP: production HTTP 200, 19 valid entries, byte-for-byte identical to local deterministic pack. SHA-256 `15e3d93c83a99d81b9451f9cb64703e7ee7b18a05f9527a8220acdcda1e9f7fe`.
- Production API smoke: AI valid summary 200/local fallback; unknown provider 400; repository invalid host 400; `octocat/Hello-World` 200 with honest zero matching selected files at pinned revision; inaccessible `Xombi17/INNOVEX` 404.
- `vercel env ls`: no optional LLM environment variables. No live inference is claimed; local summaries remain functional.
- `graphify update .`: AST-only, 836 nodes / 1320 edges / 52 communities, generated graph mirrored into ignored `.planning/graphs/` artifacts.

## Product guardrails and remaining limits

Preserve RFC 7009 HTTP 200 caveats, SHOULD access-token cascading, GitHub grant deletion versus independent PAT revocation, and fresh client-managed PKCE authorization. No account actions or probes are executed by ScopeBomb. Public repository checks inspect bounded selected files, not account security or full history. Example findings, conditional exposure and self-reported remediation remain distinct.

Unauthenticated GitHub returns 404 for `Xombi17/INNOVEX` (private or missing) and 200 for `octocat/Hello-World`; public demo defaults use the latter. Human comprehension/demand validation, screen-reader evaluation, live LLM inference and real account revocation remain untested. The historical `DEMO_SCRIPT.md` contains superseded immediate-sample/replacement-URL framing; use the actual shipped flow documented in `docs/UX-VALIDATION.md`.
