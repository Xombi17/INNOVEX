# Phase 7: End-to-End Visual/E2E Verification, Doc Sync & Live Production Ship - Context

**Gathered:** 2026-11-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Run complete verification across contracts, engine tests, visual design gates, API endpoints, Chrome CDP E2E user journeys (`1440px`, `768px`, `390px`), Graphify knowledge graph updates, living documentation (`PRODUCT.md`, `DESIGN.md`, `.impeccable/*`, `README.md`, `STATE.md`), git merges (`feat/ui-extension` -> `main`), and live Vercel production deployment verification at `https://scopebomb.vercel.app`.

</domain>

<decisions>
## Implementation Decisions

### Contract & Lane Integrity Checks (`REL-01`)
- **D-01:** Assert `git diff -- packages/engine tests/engine contracts data/scope_catalog.json` produces zero changes (unless pre-existing baseline matches HEAD).
- **D-02:** Run and confirm `python3 contracts/verify_contracts.py` (`OK`), `node --test tests/engine/*.test.ts` (`30/30` pass), `node packages/engine/cli.ts . --json` clean, `cd apps/extension && npm run build` + `unzip -t apps/web/public/downloads/scopebomb-mv3-extension.zip`, and `cd apps/web && npm run typecheck && npm run build`.

### Visual, Accessibility & Live Browser E2E Suite (`REL-02`)
- **D-03:** Run `node /home/varad/.agents/skills/design-taste-frontend/scripts/lint.mjs --app apps/web/src` -> require `0 FAIL, 0 WARN`.
- **D-04:** Start production `apps/web` server (`npx next start -p <port>`), run:
  - `/home/varad/.agents/skills/impeccable/scripts/impeccable detect --json` at desktop (`1440x900`) and mobile (`390x844`) -> require `[]` (`exit 0`).
  - `node /home/varad/.agents/skills/design-taste-frontend/scripts/inspect.mjs --app` across `1440x900`, `768x1024`, `390x844` -> require `0 FAIL, 0 WARN`.
  - Extended Playwright / Chrome CDP E2E verification script covering:
    1. Initial load shows Step 1 with scanner bar immediately visible (no hidden button click needed) & scenario pills working.
    2. `POST /api/scan-repo` with valid public repo (`Xombi17/INNOVEX`) AND clean validation error on invalid repo URL.
    3. `POST /api/ai-triage` returning structured JSON with zero unredacted secrets & honest fallback mode badge when API key absent.
    4. Step 2 Attack Path domino toggle (`After 1-Click Revoke` red vs `After Full Multi-Issuer Plan` green) + Technical Forensics disclosure toggle.
    5. Step 3 concrete CLI kill-switch snippets, interactive `"Simulate Fake AI App Consent"` modal interception (`safe_replacement_url: null` check), and downloadable `scopebomb-mv3-extension.zip` HTTP `200` + valid content-length check.
    6. `?oauth_url=` query parameter deep-link landing flow + `"How 3 Tools Connect"` header modal.
    7. Zero console errors or uncaught page errors across desktop & mobile, plus direct visual screenshot inspection (`read_file`).
- **D-05:** Clean up ALL temporary local dev/prod servers & Chrome processes right after local inspection (`CLEAN_PROCESSES`).

### Docs, Graphify, Git & Live Production Ship (`REL-03`)
- **D-06:** Update `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, `.impeccable/surfaces/apps-web.md`, `README.md`, and `.planning/STATE.md` / `ROADMAP.md` to accurately reflect `v1.1` features & verification counts.
- **D-07:** Run `graphify update .` and sync updated graph files into `.planning/graphs/`.
- **D-08:** Commit cleanly on `feat/ui-extension`, fast-forward merge `main`, push `origin main feat/ui-extension`, run `vercel deploy --prod --yes`, and verify live `https://scopebomb.vercel.app` (`HTTP/2 200`, live Step 1–3 smoke check, `/api/ai-triage`, `/downloads/scopebomb-mv3-extension.zip`, zero console errors).

### the agent's Discretion
- Order of doc updates and screenshot filenames saved in `<scratch>` during Phase 7 verification (keep untracked temporary screenshots out of git commits).

</decisions>

<specifics>
## Specific Ideas

- Treat visual inspection with `read_file` on real rendered desktop & mobile screenshots as mandatory before declaring `v1.1` shipped — automated scripts catch overflow/contrast, human visual review catches crowding and confusing hierarchy.

</specifics>

<canonical_refs>
## Canonical References

- `GEMINI.md` — Lane rules, Graphify snapshot rule at phase boundaries, clean claim verification
- `PRODUCT.md`, `DESIGN.md`, `README.md` — Documentation files to sync in Phase 7
- `/home/varad/.agents/skills/design-taste-frontend/scripts/{lint.mjs,inspect.mjs,lib/cdp.mjs}` — Automated Taste verification suite
- `/home/varad/.agents/skills/impeccable/scripts/impeccable` — Impeccable defect detector

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing scratch script `/home/varad/.gemini/antigravity/brain/364beb3e-9936-452d-9ab6-58ddb1354cc5/scratch/verify_e2e.mjs` can be extended in Phase 7 to assert all new `v1.1` user flows.

### Integration Points
- Vercel production target `https://scopebomb.vercel.app` already linked in `.vercel/`.
- `vercel.json` / `.vercelignore` already tested in `v1.0`.

</code_context>

<deferred>
## Deferred Ideas

- Final hackathon Devpost / judge submission video & pitch deck (tracked outside code after `v1.1` ships cleanly).

</deferred>

---

*Phase: 07-e2e-verification-and-production-ship*
*Context gathered: 2026-11-10*
