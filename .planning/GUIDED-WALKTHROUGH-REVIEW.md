# Guided walkthrough and interface refinement

Date: 2026-11-11. Branch: `feat/guided-walkthrough`, based on `feat/v1.1.1-validation` at `5dfb36b`. Runtime changes are not yet deployed to production.

## Outcome

Choosing **Try an example** now starts optional inline guidance across the real input → exposure → actions workflow. Each stage explains one task, makes **Show me…** its primary action, opens any required disclosure, and moves focus to the actual evidence, conditional chain or provider action. Next/previous actions use the existing browser-history workflow. Users can exit or resume without resetting the analysis or self-reported action progress. Completion offers a clean start with their own configuration and clears the sample findings before input begins.

| Before | After | Why |
| --- | --- | --- |
| Example opened into a long page of findings | Contextual instructions and a primary reveal action for each stage | Make the first useful action explicit |
| Sources, chains and provider actions required scrolling/searching | Reveal controls open disclosures, scroll and focus real content | Teach through working product content |
| Alternate presets competed with the starting example | Scenario selection is a disclosure during guidance | Keep the default path focused while retaining every preset |
| Exposure rendered as disconnected numbered rows | A connected numbered chain with unchanged engine data | Make the conditional sequence legible |
| Abrupt workflow changes | Native 180ms opacity/transform feedback for pointer navigation | Provide continuity without delaying interaction |
| No explicit guided completion | Recap and an own-input handoff; exit/resume retains progress | Give users a useful next step without claiming remediation |
| Boxed guide and provider groups; skipped action heading level | Flat guide/runbook surfaces; action headings use h3 after h2 | Reduce visual depth and improve heading navigation |

Shared shell/control styling already being edited concurrently was preserved and integrated: semantic tokens, compact Input/Exposure/Actions labels, 44px controls, pointer hover/press feedback and the app-level design-system note. The guide's decorative side rail and nested boxes were removed after actual-screen audits. Text fields retain a stronger boundary color, and paragraph wrapping avoids isolated final words where supported.

## Scope and behavior

- No changes to engine, engine tests, contracts, catalog, SPEC, inference authority, repository scanning or extension behavior. No new dependencies.
- Guidance is local component state and resets on reload. It starts only for examples; custom input and extension deep links retain their normal flow.
- Sample provenance, uncertainty, conditional exposure and unverified/self-reported remediation remain explicit.
- Keyboard navigation is immediate; reduced-motion preference disables movement. Pointer motion uses native Web Animations and native scrolling, without delaying control availability.
- Browser test improvements send Enter's character event and stop in-flight smooth scrolling before measuring pointer coordinates. Early failures were traced to the CDP harness; direct state inspection confirmed review progress was preserved.
- A separate worktree snapshot was used for production-build verification because another process was running `next dev` against the shared checkout. Runtime source files were compared byte-for-byte before completion.

## Verification

- Contracts valid; engine 30/30, web 36/36, extension 2/2; archive negative self-check and two identical packs matching the committed 19-entry download passed.
- TypeScript and standard `next build` passed in the isolated snapshot; no webpack fallback. One initial shared-cache build was interrupted after stalling; clean and subsequent isolated standard builds succeeded.
- **57/57 browser checks**, no runtime/console errors. Includes the existing privacy, history, dialog, repository-coverage and clipping checks plus actual guide reveal/focus, state preservation, completion, own-input reset, keyboard/reduced-motion behavior and all guide controls at 390/320px.
- Source lint and rendered inspector at 1440/768/390px: **0 FAIL / 0 WARN**.
- Impeccable attached to each actual guided state: **empty reports** at stages 1, 2 and 3, for both 1440px desktop and 390px mobile. These checks cover the working screens rather than just the welcome URL.
- Desktop/mobile screenshots visually inspected. Evidence is under `.planning/evidence/guided-walkthrough/`.

Local review: production build served from `/tmp/scopebomb-guided-check` at `http://127.0.0.1:3115`. Choose **Try an example**. The existing root dev server is separate and was not stopped.

Human comprehension, real screen-reader validation and live inference remain separate pending checks. These automated results do not establish account containment or full accessibility conformance. Professional video production is deferred; no Remotion/video dependencies were added.
