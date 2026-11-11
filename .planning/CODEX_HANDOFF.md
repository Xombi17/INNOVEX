# Codex Master Orchestration Handoff (`ScopeBomb` — `INNOVEX 2026`)

**Date:** `2026-11-11`  
**Previous Orchestrator:** Antigravity  
**New Lead Orchestrator:** Codex (`AGENTS.md` updated to grant repo-wide orchestration authority while keeping the core engine/contracts frozen)

---

## 1. Why You Are Taking Over & Current Situation

Two parallel `v1.1` implementation branches evolved from common commit `764f42b` (`main` is still at `1ce7fb1`) across separate worktrees, while **live production (`https://scopebomb.vercel.app`) is still running old `v1.0`** (`Blast simulator` UI; `GET /downloads/scopebomb-mv3-extension.zip` returns `HTTP 404`).

Your job as Lead Orchestrator is to:
1. Compile, build (standard non-sandbox Next.js build), run all tests + headless browser checks + design audits on **both** active candidates side-by-side (and compare UX quality vs baseline `764f42b`).
2. Decide which branch is stronger as the base AND port any missing strengths from the sibling branch so the final build gets **the best of both**.
3. Verify zero regressions across Web, MV3 Extension, Engine (`30/30`), and Contracts.
4. Update Graphify (`graphify update .`), finalize `.planning/STATE.md`, integrate cleanly into `main`, deploy to **`https://scopebomb.vercel.app`**, and run live production smoke checks.

---

## 2. Exact Map of Branches & Worktrees (Verified `2026-11-11`)

1. **`/home/varad/Documents/hackathons/INNOVEX` — branch `feat/ui-extension` (`900f4c7`) — Candidate B**
   - **Checks passing right now:**
     - `python3 contracts/verify_contracts.py` -> OK
     - `node --test tests/engine/*.test.ts` -> `30/30` pass
     - `npm run test --prefix apps/web` (`tests/analysis.test.ts`, `tests/repository.test.ts`) -> `14/14` pass
     - `npm run typecheck --prefix apps/web` -> pass (`0` errors)
     - `design-taste-frontend/scripts/lint.mjs --app apps/web/src` -> `0 FAIL, 6 WARN` (`font-mono` used in `EvidenceSummary.tsx`, `PreConsentPreview.tsx`, `ScanInput.tsx`, `Step2AttackPath.tsx`, `StepStepper.tsx`)
   - **Notable assets in `900f4c7`:**
     - Welcome screen before displaying sample findings (distinguishes sample vs real user data, per `docs/UX-VALIDATION.md` & `PRODUCT.md`).
     - `apps/web/src/components/ScanInput.tsx` (329L), `ScopeBombArena.tsx` (405L, browser `history.pushState`/`popstate` & focus management), `EvidenceSummary.tsx` (131L), `AccessibleDialog.tsx` (64L), `lib/repositoryScan.ts` (254L), `lib/triage.ts` (125L).
     - `apps/web/scripts/verify-browser.mjs` (562L end-to-end Playwright/CDP browser test suite covering 390px/320px/desktop, history back/forward, AI opt-in, redaction).
   - **Things to check/fix if keeping `900f4c7`:**
     - Does `npm run build --prefix apps/web` (Turbopack) pass & pass live Chrome visual inspect + `impeccable detect`?
     - Notice `apps/extension/tests/guard.test.mjs` and `apps/web/tests/security.test.ts` exist only in Candidate A (`fix/v11-release`), NOT in `900f4c7`.
     - Check whether Candidate B's `pack.mjs` is deterministic/safe vs Candidate A's hardened `pack.mjs`, and whether Candidate B's `/api/scan-repo` & `/api/ai-triage` match Candidate A's strict byte-stream/redirect/runtime allowlist guarantees.
     - Resolve the `6` `font-mono` lint warnings (or verify semantic `<code>` tags).

2. **`/tmp/scopebomb-v11-release` — branch `fix/v11-release` (`5f6a576`) — Candidate A**
   - **Checks passing right now:**
     - `python3 contracts/verify_contracts.py` -> OK
     - `node --test tests/engine/*.test.ts` -> `30/30` pass
     - `npm test --prefix apps/web` (`apps/web/tests/security.test.ts`) -> `9/9` pass
     - `npm test --prefix apps/extension` (`apps/extension/tests/guard.test.mjs`) -> `2/2` pass
     - `npm run typecheck --prefix apps/web` -> pass (`0` errors)
     - `design-taste-frontend/scripts/lint.mjs --app apps/web/src` -> **`0 FAIL, 0 WARN`** (28 files)
   - **Notable assets in `5f6a576`:**
     - Dedicated security hardening: `apps/web/src/lib/boundedBody.ts` (stream-enforced byte cap), `lib/aiTriage.ts` (strict allowlist rejecting unenumerated strings/extra fields), `redirect: "error"` fetches, pinned commit SHA scanning, runtime validation of LLM JSON responses with complete fallback.
     - Reproducible, injection-safe extension zip script (`apps/extension/scripts/pack.mjs`, deterministic SHA-256 `415f26c3...`, 19 files).
     - Detailed release audit: `.planning/V11-RELEASE-REVIEW.md` and `.planning/evidence/v11-release/*`.
   - **Things to check/fix if keeping `5f6a576`:**
     - Read `.planning/V11-RELEASE-REVIEW.md`: its prior build ran `npm run build -- --webpack` inside a restricted host sandbox, so standard `npm run build` + real visual browser inspection on BOTH `1440px` & `390px` is required!
     - Compare first-impression UX vs `900f4c7` (`Welcome` gate + `docs/UX-VALIDATION.md` + `verify-browser.mjs` 37 assertions) and vs `764f42b` (instant dashboard + KPI strip — remember judges only spend ~60–90s evaluating hackathon demos!).

3. **`/home/varad/Documents/hackathons/INNOVEX/.worktrees/core-engine` — branch `feat/core-engine` (`4a92051`)**
   - Already `100%` merged into `main`, `fix/v11-release`, and `feat/ui-extension` (`git diff main..feat/core-engine` is empty). Keep frozen!

---

## 3. Side-by-Side Compile & Evaluation Protocol for Codex

Run everything in a clean shell with normal sockets (not sandbox-blocked Turbopack):

### Phase A: Build & Benchmark Both Candidates
For **each** worktree (`/tmp/scopebomb-v11-release` on `fix/v11-release`, and `/home/varad/Documents/hackathons/INNOVEX` on `feat/ui-extension`):
1. Build & pack cleanly:
   - `npm run build --prefix apps/web`
   - `node apps/extension/scripts/pack.mjs && unzip -t apps/web/public/downloads/scopebomb-mv3-extension.zip`
2. Boot `next start` on distinct ports (e.g., `3111` for `5f6a576`, `3112` for `900f4c7`) and run:
   - Design lint: `node /home/varad/.agents/skills/design-taste-frontend/scripts/lint.mjs --app apps/web/src`
   - Render measurement: `node /home/varad/.agents/skills/design-taste-frontend/scripts/inspect.mjs http://127.0.0.1:<PORT> --app --widths 1440,768,390`
   - Impeccable audit: `/home/varad/.impeccable/bin/0.1.16/impeccable detect --json http://127.0.0.1:<PORT>` (and `--viewport 390x844`)
   - Browser E2E: run `apps/web/scripts/verify-browser.mjs` (in `900f4c7`) and inspect screenshots of Steps 1, 2, 3, Consent Sandbox, and MV3 Extension (`popup.html` & `guard.html`) visually!

### Phase B: Evaluate Winner & Best-of-Both Consolidation
Judge using these exact hackathon criteria (`SPEC.md` + `DEMO_SCRIPT.md` + `PRODUCT.md` + `docs/UX-VALIDATION.md`):
1. **Judge 10-second Comprehension & Polish:** How clear, trustworthy, visually balanced, and effortless is Step 1 -> Step 2 -> Step 3 on desktop & 390px mobile? (Check `Welcome` UX vs immediate scanner usability!)
2. **Security & Technical Honesty:** No synthetic fake credentials, complete redaction, strict `/api/ai-triage` allowlist & fallback, strict `/api/scan-repo` byte/redirect/host limits, exact RFC 7009 / PKCE S256 / GitHub grant-delete accuracy.
3. **Combined Test & Build Coverage:** Unify into **one** winning branch/commit so the final deliverable has:
   - All engine tests (`30/30`) + contract check (`verify_contracts.py`)
   - All web security + analysis + repository tests (`security.test.ts`, `analysis.test.ts`, `repository.test.ts`)
   - Chrome MV3 extension tests (`guard.test.mjs`) + deterministic `pack.mjs` ZIP
   - Clean `apps/web/scripts/verify-browser.mjs` E2E pass
   - `0 FAIL, 0 WARN` in `lint.mjs`, clean `inspect.mjs` (`<= 2` line mobile headlines, `0` horizontal overflow), clean `impeccable detect`

*(Note: verify `Xombi17/INNOVEX` visibility on GitHub! If private and returning `404`, use a confirmed public repo like `octocat/Hello-World` or a public demo repo for default/sample repo hints.)*

### Phase C: Final Integration, Git/Graphify Sync & Live Vercel Deploy
1. Verify frozen lane diff is empty: `git diff <base>..HEAD -- packages/engine tests/engine contracts data/scope_catalog.json` (or matches `main`).
2. Merge the finalized release branch cleanly into `main` (fast-forward or clean merge commit) and sync `feat/ui-extension` (`git push origin main feat/ui-extension`). Prune `/tmp/scopebomb-v11-release` worktree once merged & verified if desired.
3. Refresh AST knowledge graph & copy into planning:
   - `graphify update .`
   - Update `.planning/STATE.md` -> `status: shipped_v1.1` with verified test counts, commit SHAs, and live URL.
4. **Deploy to Vercel Production FROM REPO ROOT (`/home/varad/Documents/hackathons/INNOVEX`):**
   - Repo root owns `.vercel/project.json` (`projectName: "scopebomb"`) and `.vercelignore` (which excludes `.worktrees/`, `.planning/`, `tests/`, `apps/extension/`, etc.).
   - Check env vars (`vercel env ls`) so optional live AI triage key status is known.
   - Deploy: `vercel deploy --prod --yes`
5. **Live Production Verification (`https://scopebomb.vercel.app`):**
   - `curl -sI https://scopebomb.vercel.app/downloads/scopebomb-mv3-extension.zip` -> must be **`HTTP/2 200`**, valid ZIP!
   - `POST https://scopebomb.vercel.app/api/ai-triage` -> must return valid structured `200 OK` JSON (strictly enforcing allowlist).
   - `POST https://scopebomb.vercel.app/api/scan-repo` (e.g., `octocat/Hello-World` and invalid host SSRF check -> `400`).
   - Run browser verification (`BASE_URL=https://scopebomb.vercel.app`) & inspect rendered desktop/mobile screenshots of live site!
