# ScopeBomb hackathon readiness plan

**Status:** Repo-side readiness work completed 2026-11-12; external event and human-validation gates remain open. No new product code was justified by available evidence.
**Basis:** current `main`, the v1.1.1 handoff and validation records, and the repo's stated PS 05 target.
**Goal:** maximize judging performance through eligibility, a clear problem story, credible evidence, and a reliable demonstration. Winning cannot be guaranteed.

## Execution log

- **2026-11-12 — Internal event brief and rubric found.** Full hidden-file review found `SPEC.md`: PS 05 — AI-Powered Cybersecurity; target deadline Nov 15, 2026 at 23:55 IST; build freeze at 18:00 IST; rubric weights below. The user confirms this is a separate cybersecurity INNOVEX from the unrelated public Code for INNOVEX event previously found. The local spec is sufficient to proceed with readiness work, but official prior-work, AI-assistance, presentation-format, and attribution rules are not present in the repo and remain to verify before final submission.
- **2026-11-12 — Phase 1 production automated check passed.** `BASE_URL=https://scopebomb.vercel.app npm run test:browser --prefix apps/web` passed **58/58** with no runtime/console errors. Artifacts: `/tmp/scopebomb-plan-browser-2026-11-12`. The suite covers the live guided flow, focus/reveal behavior, exit/resume, sample reset, keyboard/reduced motion, and 320/390px reflow. This is automated evidence, not a human study or spoken rehearsal.
- **2026-11-12 — Screenshot review.** The welcome screen presents the guided tour and own-configuration paths clearly. On the guided action step, the fixed coachmark temporarily covers some underlying content until the user activates its reveal control; after reveal, the 390px action screen is readable. Treat this as a usability-study observation to test, not a confirmed defect. No product code changed.
- **2026-11-12 — Rubric and adjacent-product pass.** Mapped the SPEC's five weighted criteria, found existing OAuth-app and MCP-configuration security products, and removed “first tool” from the proposed pitch. The defensible combination is conditional cross-issuer exposure + provider-specific review actions + PKCE-aware pre-consent guidance. This scan is bounded, not an exhaustive competitor review.
- **2026-11-12 — Keyboard spot-check on production.** The live page exposes a skip link and named controls; Tab reaches the welcome actions in order, and Enter opens the guided sample. The sample accessibility tree distinguishes illustrative data, supplied evidence, conditional exposure and unknowns. This is an agent-operated browser keyboard check; it is not a real screen-reader session.
- **2026-11-12 — Branch and PR refresh.** GitHub reports no open PRs. All checked feature branches are at or behind `main` except `fix/v11-release`, whose one unique commit is the superseded Candidate A snapshot; the security hardening worth keeping is already present in `main`. No direct merge is recommended. Production `main` is `e1ecd4b`.
- **2026-11-12 — Event-source check.** `SPEC.md` supplies the PS, target deadline and rubric, but repo search found no organizer rulebook, registration confirmation or submission template. Exact-phrase search found several different events: the IEEE CIS/GHRCE INNOVEX AI hackathon ran Feb 4–9, 2026; the public Code for INNOVEX '26 lists PS 2 as cybersecurity and PS 5 as disaster resilience for Nov 20–21; another INNOVEX 2026 site lists Dec 15, 2025–Feb 15, 2026. None matches the repo's PS 05 + Nov 15, 2026 target. These identities/dates are documented by [IEEE vTools](https://events.vtools.ieee.org/m/576444), [Code for INNOVEX](https://codeforinnovex.in/) and [the separate INNOVEX 2026 site](https://sites.google.com/view/innovex2026/home). Do not apply those events' rules to this project. Gate 0 remains open for eligibility and final submission rules.
- **GSD gate decision.** No Phase 8 was opened: the repo workflow requires the official event contract and observed usability results first. Existing Phase 7 is shipped; no code defect or rubric requirement currently justifies new implementation.
- Existing study kit and validation record are ready, but no participant sessions, spoken rehearsal, or real screen-reader evaluation are recorded. Those require human participation and cannot be substituted with simulated results.

## Gate 0 — Confirm the actual competition

Do this before changing the product or preparing final claims. The repository identifies the target as **INNOVEX 2026, PS 05 — AI-Powered Cybersecurity** and records a Nov 15, 2026 submission target. Public search also surfaced a different **Code for INNOVEX '26**: its PS 05 is disaster resilience, its event is Nov 20–21, and its rules say projects must be authored during the 24-hour sprint and prohibit prebuilt apps. These may be different competitions; do not assume either source describes this team's event.

### Verify from the team's registration/organizer materials

- Official event name, organizer, track and assigned problem statement.
- Current deadline, timezone, presentation/video format and required template.
- Whether existing code, work started before the event, and AI-assisted work are allowed; required disclosure and attribution.
- Judging rubric and whether a working demo, repository, user evidence or live AI use is expected.

### Decision

- **Correct cybersecurity track; existing work permitted:** continue with the plan below and disclose project history accurately where required.
- **Rules prohibit prebuilt work or assigned track differs:** pause this submission plan. Get an eligibility ruling from the organizer. Do not present the existing project as built during a sprint. If it is not eligible, choose a compliant path before spending time on polish.
- **Event remains uncertain:** no final deck/video claims; use time only for reversible preparation and validation.

**Exit artifact:** a one-page event brief with links or filenames for the official rules, PS, rubric, and deadlines. The current research finding is a warning to resolve, not proof that the Code for event is the user's competition. [Code for INNOVEX track](https://codeforinnovex.in/tracks/abhedya) · [rules](https://codeforinnovex.in/rules).

## Product thesis to test

**Primary user:** a developer reviewing a suspicious or over-broad AI/IDE integration or project credential.
**Job:** understand what the supplied access could expose, what a single revoke may leave behind, and which issuer-specific review action to take.
**One-line pitch:** “ScopeBomb maps the access and separate credentials that may remain exposed after an integration is revoked, then gives developers a safe, provider-specific review plan.”

Keep the claim conditional: ScopeBomb analyzes supplied input and models possible paths. It does not detect active compromise, prove a credential works, execute account changes, or verify containment. The engine's protocol/security guardrails remain frozen.

## Rubric map from `SPEC.md`

The weights below are the repository's stated rubric. Reconfirm them against the event's official material when available.

| Criterion | Weight | Best proof in ScopeBomb | Current gap / execution |
| --- | ---: | --- | --- |
| Innovation | 25% | Contrast one-provider revocation with separate credentials/issuers that still need review; show the PKCE-aware pre-consent guard as a supporting prevention surface. | The SPEC's “First tool” superlative is unverified. Do not use it without a credible competitor search. Show the product's concrete differentiator instead. AI is optional prioritization, not the deterministic detector; a live model call and meaningful comparison are unverified. |
| Technical implementation | 25% | Deterministic engine and schema; local redaction; bounded public-repository retrieval; extension; portable CI. Cite actual checks and show one architecture/data-flow diagram. | Engineering evidence is strong, but don't spend demo time reciting test counts. The current production AI path uses the local fallback unless a provider is configured. |
| Problem-solving | 20% | One realistic developer incident: “what did this integration receive, what could follow, and what must I check at other issuers?” | Five-person task success and practical decision value are unmeasured. Collect actual user outcomes. Keep modeled consequences distinct from observed evidence. |
| Impact & scalability | 15% | Privacy-preserving local analysis, no login or database, bounded stateless repository endpoint, practical owner-specific actions. | No user-demand, adoption, retention, or load evidence is recorded. Do not claim scale or impact from architecture alone; present them as design properties and next validation questions. |
| Presentation | 15% | Welcome screen, visible guided coachmark, direct three-step path, offline example, corrected 90-second script. | A person has not rehearsed the script aloud. Run the cold rehearsal and record actual duration, slips, and questions. |

The demo should map each claim to visible proof. Avoid unsupported “first,” breach-prevention, clean-repository, compromise-detected, containment-success, or user-impact claims.

### Adjacent-product scan (2026-11-12; not an exhaustive market study)

- Microsoft Defender for Cloud Apps documents monitoring, investigating, and remediating OAuth apps already authorized in an enterprise tenant. This establishes that OAuth permission review is an existing category, especially for administrators. [Microsoft Learn](https://learn.microsoft.com/en-us/defender-cloud-apps/investigate-risky-oauth)
- `mcp-audit` scans MCP and agent configuration, supports CI/pre-commit and remediation workflows, and includes a `killchain` command for reducing attack paths. [Project docs](https://mcp-audit.dev/start/)
- `MCPSec` audits MCP configurations and source, including secrets, dangerous startup commands, excessive declared permissions, inventory, drift, and CI gates. [Project repository](https://github.com/pfrederiksen/mcpsec)
- ShieldMCP also checks MCP configuration permission risks and possible secrets. Its current published page says scans upload config to its server and results remain accessible by scan URL for seven days, so ScopeBomb's local parsing/data-handling boundaries are a comparison point, not a blanket superiority claim. [Product page](https://shieldmcp.net/)

**Implication:** Do not position ScopeBomb as the first OAuth auditor or MCP scanner. Position it around connecting a supplied OAuth/configuration finding to *conditional cross-issuer consequences and separate provider-specific review actions*, with the pre-consent guard as a related prevention mechanism. The scan does not establish that no competitor offers this complete combination.

### Provisional pitch and demo spine

**Pitch:** “ScopeBomb helps developers see what access may remain exposed after an integration is revoked, and which provider-specific actions they should review next.”

**AI explanation:** “The deterministic analyzer maps supported findings and possible paths. Optional AI can prioritize those vetted facts; raw local configuration is not sent.” Only show a live model result if a real authorized request is verified. Do not call the model the detector.

**Storyboard:** one sentence on the problem → choose the labeled example → show one sourced finding and one conditional path → explain why a single revoke can miss an independent credential/issuer → show the relevant owner/action → close with the limitation that this is a review plan, not account remediation. The current consent sandbox/extension may be shown as an optional prevention follow-up.

## Phase 1 — Validate comprehension and usefulness

**Timebox:** first available day after Gate 0.
**Work:** run the prepared five-person study with unfamiliar developers, one session at a time, without teaching the interface. Rehearse the current demo aloud on the production build. Perform an actual screen-reader session with a supported browser/reader. Use fixture data only.

**Measure:**

- At least 4/5 explain the product and find the first action after the ten-second prompt.
- At least 4/5 complete the example unaided within two minutes.
- 5/5 distinguish sample findings from their own accounts.
- 5/5 understand the preview/checklist performs no remediation.
- At least 4/5 identify a practical action and its responsible owner.
- Record the decision each participant says the tool helped them make, when they would use it again, friction, task time, and any coaching. Do not infer demand from compliments.
- Record screen-reader/browser/OS and blockers; do not make a WCAG conformance claim from one session.
- Record spoken demo time and hesitations. The repo's under-90-second target is a target until a human rehearsal confirms it.

Use `docs/validation/v1.1.1-usability.md` and update its results only with real observations. If participants understand the flow but cannot name a useful decision, narrow the product instead of adding features.

**Exit:** completed score sheets, screen-reader notes, a timed rehearsal, and a short list of observed friction ranked by frequency and severity.

## Phase 2 — Lock the smallest winning story

**Timebox:** half day; no implementation yet.
Select one scenario already supported by the product and one differentiating moment: a single-provider revoke can leave independently issued credentials or other issuer actions to review. Check every detail against the actual fixture, sources, engine output and labels.

The main demonstration should be:

1. Choose the clearly labeled example.
2. Show the evidence and what remains unknown.
3. Reveal one conditional exposure chain.
4. Contrast a single revoke with the relevant issuer-specific actions.
5. End with the first practical action and say explicitly that ScopeBomb performed no cleanup.

Keep the repository scan, technical catalog, full graph, consent sandbox, extension setup, and CLI as supporting evidence. Use one only if it strengthens the assigned rubric; do not make judges install anything or depend on a live repository response for the core demo.

**Exit:** a 60–90 second narration, a click-by-click runbook, an offline fallback, and a written list of claims/limitations. If the official submission requires a longer video, use this as the product-demo segment and meet the official duration separately.

## Phase 3 — Make the AI claim earn its space

First confirm the event rubric and whether judges expect AI to be central. ScopeBomb's supported model path prioritizes vetted facts; deterministic rules produce the analysis, and the local fallback remains available. No live model key is currently configured in production according to the release record.

- If live AI is important and an authorized key is available, verify one redacted demo call using the supported flow. Show exactly what input is sent and what the model changes; prove it cannot add findings.
- Compare the model-prioritized result with local fallback on a fixed example. Explain the practical difference, not just the provider name.
- If no authorized key or meaningful difference is available, present AI as optional prioritization and make the deterministic security analysis the main innovation. Do not imply that an LLM detects compromise or validates credentials.

**Exit:** one truthful sentence on AI's role, one demonstrated result or an explicit local-fallback path, and matching wording in the interface, deck and narration.

## Phase 4 — Apply only evidence-backed fixes

**Timebox:** one focused implementation pass; reserve the final day for release and submission. Start a GSD phase only after Gate 0 and the usability results. The current roadmap ends at Phase 7, so formalize the next milestone/phase before execution rather than silently expanding the shipped roadmap.

Prioritize observed blockers in this order:

1. A misunderstanding that could make a user think a sample is their data or believe an account was secured.
2. A blocker that prevents an unfamiliar user from reaching evidence or the next action.
3. A screen-reader, keyboard, mobile, or error-recovery blocker encountered in validation.
4. A demo reliability issue that can break the primary path.

Do not add providers, logins, telemetry, automated revocation, tour libraries, or other features without direct evidence and a rubric reason. Keep `packages/engine/**`, `tests/engine/**`, contracts, catalog, and protocol claims frozen unless a proven defect requires a separate explicit contract change. Re-test only affected paths plus the normal release gates; preserve the current no-secret/no-account-mutation boundaries.

**Exit:** every code change traces to an observed problem or confirmed rubric requirement; affected tests and browser checks pass; the demo still works offline with the example; no claim exceeds evidence.

## Phase 5 — Assemble and rehearse the submission

Map the verified rubric to a small deck and video; use the exact organizer template and format if required. A reusable six-part outline is:

1. **Problem and user** — one concrete developer situation and why it matters.
2. **Insight** — why revoking one grant may not cover separately issued credentials or other issuers.
3. **Solution** — the primary workflow and the user decision it enables.
4. **Proof** — deterministic engine, evidence/provenance, bounded scanning, privacy boundary, and actual validation results.
5. **Impact and viability** — observed user outcomes, intended use, constraints, and what would be tested next. Use no invented market size, testimonials, breach statistics, or success rates.
6. **Team, technology and credits** — accurate contributions, model/library/tool use, and licenses required by the event.

Before upload, run a cold rehearsal with someone who has not seen the app. Verify the production link, a local/offline fallback, video playback, audio, legible captions/text, repository access, file name/size/template, and that the demo contains no live secrets or real account actions. Prepare concise answers on model role, false positives, scan coverage, privacy, and limits.

**Exit:** final deck and video comply with the confirmed event rules; a cold viewer can explain the problem and next action; all factual claims have evidence; links and files open from a fresh device/session.

## Release gates and stop rules

- Keep `main` as the release source; the only branch ahead is the superseded `fix/v11-release` snapshot, with no open PR.
- Existing baseline evidence: engine 30/30, web 36/36, extension 2/2, 58 browser checks recorded for the guided release, CI passed, production deployed. Re-run the relevant gates after any code change; do not present historical counts as a new run.
- Do not add new runtime dependencies or broaden the product in the final stretch.
- Freeze code at least one day before the confirmed deadline; spend the remaining time on rehearsal, evidence, deck/video and submission checks.
- Do not claim user validation until sessions occur, live AI until a real authorized call succeeds, or containment from a simulated/checked-off action.

## GSD routing

1. Close Gate 0 and capture the official event contract.
2. Run the human validation and review results (`gsd-verify-work` / discuss gaps).
3. If the event is eligible and fixes are justified, formalize the next milestone/Phase 8 requirements and roadmap, then create a focused plan (`gsd-plan-phase`).
4. Execute only the approved small UX/reliability changes, verify, and update state/evidence.
5. If no user-facing blocker appears, skip implementation and put the effort into the demo and submission.

The installed GSD skill references core workflow files absent from this checkout; this document uses the repository's GSD phase structure but is not represented as an automated GSD run.
