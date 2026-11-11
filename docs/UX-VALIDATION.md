# ScopeBomb first-use validation

## Implemented journey

Welcome → explicitly choose an example or supply input → inspect sourced findings and uncertainty → understand conditional exposure → review provider actions.

Examples remain labeled throughout. Editing input clears prior findings. Cleanup completion is self-reported; even a full-plan preview never establishes real containment. Verification notes stay in tab memory. Refresh, reset, or a new analysis clears them.

## Data handling

- Configuration files, pasted authorization links, and grant exports are parsed in the browser. Raw local input is not posted to an API.
- Repository checks retrieve selected **public** files on the server at a pinned commit. The response contains a redacted report, evidence and coverage, never raw file contents. Limits: eight matching files, 64 KiB per file, a bounded file inventory, and a 20-second overall upstream deadline. Skipped files, truncation, timeouts and unsupported content are not reported as clean scans.
- Placeholder values and environment references are separate evidence, not synthesized credentials. Validity of any credential-like value remains unknown.
- The optional AI button sends only a supported input-mode value, fixed provider identifiers and counts. The model can order three vetted facts; arbitrary generated security assertions are discarded. The local explanation is always available.
- An incoming `oauth_url` deep link initially reaches the web host. It is parsed and removed from the current address. The extension discloses that opening the website shares this URL. This does not retroactively remove the original request from host logs.
- The website and consent sandbox do not enable the Chrome extension. Installation requires desktop Chrome and the documented unpacked-extension setup.

## Automated verification

Run from the repository root:

```sh
node --test tests/engine/*.test.ts
python3 contracts/verify_contracts.py
npm run test --prefix apps/web
npm run typecheck --prefix apps/web
npm run build --prefix apps/web
node apps/extension/scripts/pack.mjs
unzip -t apps/web/public/downloads/scopebomb-mv3-extension.zip
```

For browser checks, start the production build on port 3107, with inference disabled for the test run:

```sh
cd apps/web
OPENAI_API_KEY= GEMINI_API_KEY= npm run start -- --port 3107
# In another terminal:
npm run test:browser
```

`CHROME_BIN` can override `/usr/bin/google-chrome`; `BASE_URL` can override `http://localhost:3107`. The browser test starts and closes an isolated headless profile. Screenshots and its JSON results go to `/tmp/scopebomb-ux-browser` by default (`BROWSER_ARTIFACTS` overrides this).

Coverage includes welcome/sample distinction, local redaction, placeholders, invalid-input recovery, file selection, AI opt-in and payload boundaries, browser Back/Forward, dialog focus and Escape, self-reported cleanup, conditional previews, deep-link intake, and reflow at 390px and 320px.

These checks do not substitute for a screen-reader evaluation, live provider revocation verification, or an installed-extension interception test. No live account mutations are part of this suite.

## Latest local verification (2026-11-11)

- 30 frozen engine tests, 23 web regression/security tests and 2 extension tests passed.
- Production build, TypeScript check and frozen contract verification passed.
- 39 browser assertions passed against the production build, with no runtime/console errors captured by the suite.
- The extension archive passed integrity checks and its 19 entries matched source files.
- A live public-repository request for `octocat/Hello-World` returned bounded empty coverage at a pinned revision; an inaccessible repository returned an error rather than a clean result. Mocked upstream tests cover findings, skipped files, truncation, rate limits, malformed content and response redaction.
- Live AI inference and destructive provider API operations were not exercised. Browser tests use inference-disabled fallback; no accounts were changed.

## Human study: pending

Recruit five developers unfamiliar with ScopeBomb. Do not explain the product or controls before the tasks. Use fixture credentials, never live secrets.

1. Open the landing page. After ten seconds ask: “What does this tool do, and what would you choose first?”
2. Ask them to explore an example and explain whether it describes their accounts.
3. Ask them to inspect an example configuration containing a reference and a synthetic credential-like value. Observe how they obtain and supply input.
4. Ask them to identify what was found, what might follow, and what remains unknown.
5. Ask them to find one appropriate provider action and explain who can do it.
6. Ask them to mark an action done, preview the outcome and explain whether anything was actually secured.
7. Ask whether the tool helped them make a concrete decision, how they solve this today, and when they would use it again.

Record time, unprompted success/failure, intervention required and the participant’s own explanation. Do not count a task as successful after coaching.

| Release criterion | Target | Actual |
| --- | --- | --- |
| Complete the example unaided within two minutes | ≥4 of 5 | Pending |
| Distinguish sample findings from their own | 5 of 5 | Pending |
| Explain that the preview performs no remediation | 5 of 5 | Pending |
| Identify a practical next action | ≥4 of 5 | Pending |

If those targets fail, revise the affected step and repeat with unfamiliar participants. If users understand the workflow but cannot identify a decision it helps them make, narrow the product before adding features. No user-study or demand-validation claims are established by the automated results.

Consolidation evidence and candidate tradeoffs: `.planning/V11-CONSOLIDATED-RELEASE.md`. The source lint and rendered inspector pass with zero failures/warnings; desktop/mobile Impeccable scans are empty. The installed MV3 popup, guard and actual pre-consent navigation interception were also checked in headless Chrome. Live production checks are recorded in the release report.
