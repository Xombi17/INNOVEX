# Phase 6: Concrete Provider Kill-Switches & Downloadable Chrome Extension Sandbox - Context

**Gathered:** 2026-11-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Turn Step 3 (`Fix Plan & Blocker`) into an immediately actionable, interactive security control room without changing `packages/engine/**` (`packages/engine/containment.ts` stays untouched):
1. Build a rich web-layer **Provider Kill-Switch Catalog** (`apps/web/src/lib/remediationTemplates.ts`) upgrading every `ContainmentStep` rendered in `apps/web` with exact copy-ready `curl` / `gh` / CLI revocation commands, verification `401` probe commands, RFC 7009 nuances, and direct account revocation links.
2. Build an **In-Browser `"Simulate Fake AI App Consent"` Interactive Sandbox** in Step 3 (also triggerable via 1 click from Step 1) where users or judges click Allow/Inspect on a realistic mock `"Acme AI Workspace Wants Access"` authorization screen and watch ScopeBomb's PKCE-safe pre-consent blocker intercept it live.
3. Build a clean, repeatable packaging step producing `apps/web/public/downloads/scopebomb-mv3-extension.zip` from the built `apps/extension/` folder and surface a working **Download Chrome Extension (.zip)** + 3-step `chrome://extensions` guide directly inside Step 3 (and the `"How 3 Tools Connect"` drawer).

</domain>

<decisions>
## Implementation Decisions

### Concrete Provider Kill-Switches (`REM-01`, `REM-02`, `REM-03`)
- **D-01 (Web-Layer Enrichment Over Frozen Engine):** Do NOT modify `packages/engine/containment.ts`. Instead, export `enrichContainmentStep(step: ContainmentStep, report: AuditReport)` in `apps/web/src/lib/remediationTemplates.ts` that maps `(step.issuer, step.action_type, report.parsed_oauth)` to concrete actionable templates:
  - **Google (`rfc7009_revoke`):** Exact `curl -X POST https://oauth2.googleapis.com/revoke -d "token=<REFRESH_TOKEN>"` command + explicit RFC 7009 note (`returns HTTP 200 even on invalid tokens; access tokens may live until TTL`) + post-revoke `gmail/v1/users/me/profile` `401` verification curl + `https://myaccount.google.com/connections` link.
  - **GitHub (`github_grant_delete` & `rotate_downstream_key`):** Exact `curl -X DELETE -u "$CLIENT_ID:$CLIENT_SECRET" https://api.github.com/applications/$CLIENT_ID/grant -d '{"access_token":"<TOKEN>"}'` (`HTTP 204`) AND `gh auth refresh` / PAT revocation at `https://github.com/settings/tokens` + `curl -H "Authorization: Bearer <OLD_TOKEN>" https://api.github.com/user` (expect `401 Bad credentials`).
  - **GitHub CI Workflows (`inspect_ci_workflows`):** Exact git audit commands (`git log -n 10 -p -- .github/workflows/` + `gh run list --limit 10` + branch protection check link).
  - **Vercel (`rotate_downstream_key`):** `npx vercel tokens ls` / `https://vercel.com/account/tokens` + `curl -H "Authorization: Bearer <OLD_VERCEL_TOKEN>" https://api.vercel.com/v2/user` (`401`).
  - **OpenAI / Anthropic / Slack / Microsoft Entra / Salesforce:** Tailored copy-ready CLI/curl revocation & `401`/`token_revoked` verification probes + real provider dashboard URLs.
- **D-02 (Plain-English vs CLI Toggle & Progress Simulation):** Let users switch step view between **`Plain English Steps`** and **`CLI & curl Scripts`** (or expand commands inline cleanly), plus interactive dry-run checkboxes (`"Mark verified in runbook"` / `"0 of N verified"` simulation progress bar — strictly UI local state, with clear `"Dry-run templates only — never executes live destructive calls"` assurance).

### In-Browser Fake AI Consent Trap Sandbox (`EXT-01`, `EXT-02`)
- **D-03 (Realistic Interactive Consent Prompt):** Add a `ConsentTrapSandbox.tsx` modal/inline interactive card triggered by **"Simulate Fake AI App Consent"** button. Shows a realistic mock OAuth consent card (`"NovaAI Workspace Assistant wants to access your Google Account"` requesting `Read, compose & send Gmail` (`mail.google.com`) + `Full Google Drive access` (`drive`), showing `PKCE S256 active` & `offline refresh`).
- **D-04 (Live Interception Demonstration):** Clicking **"Click Allow (See What Happens)"** or **"Intercept with ScopeBomb Guard"** triggers ScopeBomb's real `tryRunScopeBombAudit` on `DEMO_PKCE_TRAP_URL` and opens the Guard Interception view right inside the browser, highlighting:
  1. Why rewriting `?scope=` mid-flight breaks SHA-256 `code_challenge` (`safe_replacement_url: null`).
  2. Exact flagged scope downgrades (`mail.google.com` -> `gmail.readonly`, `drive` -> `drive.file`).
  3. One-click **"Copy Least-Privilege Scopes"** and **"Apply Clean Scopes to Simulation"** (which re-audits `gmail.readonly + drive.file` so judges watch the risk drop immediately!).

### Downloadable Chrome Extension Pack (`EXT-03`)
- **D-05 (Automated Build + Zip Emission):** Extend `apps/extension/scripts/build.mjs` (or add `apps/extension/scripts/pack.mjs` invoked by `npm run build` in `apps/extension` AND ensured during build check) to deterministically bundle the built MV3 extension (`manifest.json`, `background.js`, `content.js`, `guard.*`, `popup.*`, `shared.js`, `styles.css`, `engine/*.js`, `icons/*.png`) into `apps/web/public/downloads/scopebomb-mv3-extension.zip` using Node stdlib / Python `zipfile` (note: check Vercel/Node availability — commit the built `apps/web/public/downloads/scopebomb-mv3-extension.zip` directly to git so Vercel serves it cleanly as a static asset without needing Python during Vercel build!).
- **D-06 (Clear Install Guide & Browser Bridge Explanation):** In Step 3 next to **`Download Chrome Extension (.zip)`**, show concise 3-step install steps (`1. Download & unzip -> 2. Open chrome://extensions & enable Developer mode -> 3. Click Load unpacked -> Visit any Google/GitHub/Microsoft OAuth URL`) and explicitly state why only the extension monitors external tabs (`webNavigation`) and hands off a single URL via `?oauth_url=`.

### the agent's Discretion
- Using Python `zipfile` or pure Node ZIP builder during `apps/extension` packaging script (generating valid CRC-32 uncompressed/deflated zip verified with `unzip -t`). Ensure `apps/web/public/downloads/scopebomb-mv3-extension.zip` is committed cleanly or git-tracked after running build so Vercel static hosting serves `Content-Type: application/zip` cleanly.

</decisions>

<specifics>
## Specific Ideas

- Never suggest clicking `"Apply"` mutates a user's live third-party OAuth tokens automatically; make the sandbox clearly educational & dry-run (`SPEC.md` §2).
- Verify exact `apps/extension/manifest.json` host permissions (`accounts.google.com`, `github.com`, `login.microsoftonline.com`) are mirrored accurately in any Extension documentation text.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Specification & Protocol Rules
- `SPEC.md` §1.3, §1.4, §2 (RFC 7009 HTTP 200 trap, GitHub grant DELETE, PKCE preservation, no destructive live mutations)
- `DESIGN.md` — `framed-sheet` porcelain design constraints (zero nested cards, `13px+` text)

### Extension & Web Implementation
- `apps/extension/manifest.json` — Exact MV3 permissions & monitored hosts
- `apps/extension/scripts/build.mjs` — Current MV3 TypeScript transpiler into `apps/extension/engine/`
- `apps/extension/guard.js`, `apps/extension/popup.js`, `apps/extension/shared.js` — Existing MV3 guard UX & `?oauth_url=` handoff to `https://scopebomb.vercel.app`
- `apps/web/src/components/ContainmentComparison.tsx` — Step 3 containment table target
- `apps/web/src/components/PreConsentPreview.tsx` — Step 3 PKCE pre-consent preview target

### Reference Only (Read-Only Engine)
- `packages/engine/containment.ts` — Exact emitted `action_type` and `issuer` strings (`Google`, `GitHub`, `Microsoft Entra ID`, `Slack`, `Salesforce`, `Vercel`, `OpenAI`, `Anthropic`, `Discovered downstream issuer`) so `remediationTemplates.ts` matches 100% of engine outputs

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ContainmentStep.action_type` (`rfc7009_revoke`, `github_grant_delete`, `rotate_downstream_key`, `audit_minted_apps`, `inspect_ci_workflows`, `invalidate_sessions`) provides exact discriminant keys for `remediationTemplates.ts`.
- `DEMO_PKCE_TRAP_URL` in `InputAndPresetBar.tsx` already carries `mail.google.com`, `drive`, `access_type=offline`, `code_challenge`, `code_challenge_method=S256`.

### Integration Points
- `apps/extension/scripts/pack.mjs` (or `build.mjs`) writes `apps/web/public/downloads/scopebomb-mv3-extension.zip`.
- `apps/web/src/lib/remediationTemplates.ts` exports pure deterministic command & probe enrichment functions.
- `apps/web/src/components/ConsentTrapSandbox.tsx` (new) + updated `ContainmentComparison.tsx` & `PreConsentPreview.tsx` inside Step 3.

</code_context>

<deferred>
## Deferred Ideas

- Chrome Web Store published extension listing ID — out of scope pre-hackathon submission; unpacked MV3 `.zip` download is standard and self-contained.

</deferred>

---

*Phase: 06-kill-switches-and-extension-sandbox*
*Context gathered: 2026-11-10*
