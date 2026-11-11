# ScopeBomb v1.1 release review

Date: 2026-11-11. Branch: `fix/v11-release`. Worktree: `/tmp/scopebomb-v11-release`.

## Baseline and scope

Started at `764f42b` with a binary patch and two untracked source files captured from the active `feat/ui-extension` working tree. Snapshot: `/tmp/scopebomb-v11-snapshot`. That checkout remains untouched by this execution. Current source-lane work may overlap this branch; review before integrating.

The frozen engine, engine tests, contracts and scope catalog have zero diff from the base. No dependencies, accounts, stored user tokens, databases or live remediation actions were added.

## Changes and review findings

| Finding | Resolution |
| --- | --- |
| Input/results props captured during an incomplete refactor | Integrated `Analysis` evidence and repository coverage across the Arena and inputs; retained drafts, labeled previous results and rejected stale asynchronous responses. |
| Repo scanner selected one MCP file, fabricated sample values and returned incompletely masked content | Normalize all selected configurations with the frozen parser; return only complete redaction and source evidence. No synthetic credential values or raw file content are returned. |
| Fetching entire bodies before slicing, inconsistent revisions and silent partial scans | Stream-enforced byte caps, pinned tree revision, redirect rejection, overall abort signal and explicit inspected/skipped coverage. |
| Triage trusted a TypeScript cast and could forward arbitrary user strings | Runtime allowlist accepts only enumerated providers/boundaries and bounded counts/flags. Requests reject all extra fields. No raw scopes, URLs, key names or free-form labels reach a model. |
| Inaccurate fallback statements and mixed attribution | Distinguish RFC response applicability, static-key persistence and illustrative TTL; validate all three model strings or use a complete deterministic fallback. AI is opt-in, with an immediate local brief. |
| Unsupported Vercel CLI, invalid Anthropic probe, blanket status assumptions | Documented Vercel token API; read-only Anthropic models probe; GitHub owner-only grant deletion versus PAT cleanup; issuer-specific error interpretation. |
| Sandbox changed the active audit and promised zero exposure | Independent sample state uses actual engine results and preserves the user's report. Narrower scopes remain potentially sensitive. |
| Misleading PKCE hash explanation | Explain that S256 hashes the verifier, not the scopes. Preserve pending requests and require fresh client-managed transactions. Templates remain simulation material. |
| Duplicate overview in remediation and inaccessible custom modals | One responsive runbook, expandable details, local review progress and native modal dialogs. |
| Shell-interpolated, nondeterministic ZIP packaging | Structured child-process arguments, allowlisted entries, fixed timestamps/permissions and sorted ZIP paths. |

## Requirement traceability

| Requirements | Evidence | Status |
| --- | --- | --- |
| UX-01, UX-02, UX-03 | Three workflow steps, immediately available inputs, separate preset strip; browser navigation and retained-draft checks. | Local pass |
| UX-04 | Outcome-first conditional language; collapsed technical details and runbook; checked permission-link view measures 397 visible main-content words at all three widths. | Local pass; optional expanded evidence can exceed the compact default view |
| UX-05 | Native three-tool dialog, Escape dismissal, current audit preserved. | Local pass |
| SCAN-01 | Selected-file analysis and merged-source tests; live `octocat/Hello-World` returns a revision and zero modeled credentials without claiming safety. | Local/live endpoint pass |
| SCAN-02 | Host/traversal validation, redirect-error fetches, streaming caps, bounded file count, redaction/partial-scan tests. | Local pass |
| AI-01 | Only bounded counts/enumerations accepted; arbitrary text and credential-like values rejected before model fetch. | Local pass |
| AI-02 | Mocked success and malformed-provider responses plus deterministic fallback; external request is opt-in. | Local pass; live inference with configured keys not tested |
| AI-03 | Local/live attribution, complete fallback, no fabricated observed compromise. | Local pass; live generated text still needs human review |
| REM-01, REM-02 | Issuer templates with official documentation links and read-only probes; distinct static-key, OAuth, workflow and app review actions. | Local pass; no live revocations/probes executed |
| REM-03 | Review checkboxes and plain-language/command toggle, clearly separate from verified containment. | Local pass |
| EXT-01, EXT-02 | Real-engine fake-consent sandbox, narrower-scope re-evaluation, null replacement URL; native focus and active-audit preservation. | Local pass |
| EXT-03 | Reproducible 19-file ZIP, integrity verification, actual production download and unpacked Chrome-for-Testing navigation. | Local pass |
| REL-01 | 30 engine tests, contract verification and frozen-file diff. | Pass |
| REL-02 | 16 production browser assertions, three widths, no page overflow or browser exceptions; Taste and Impeccable reports. | Local pass |
| REL-03 | README/PRODUCT/DESIGN/state updates; AST graph refreshed and copied to `.planning/graphs/`. | Partial: branch review, merge/push, production deploy and production smoke remain |

## Commands and artifacts

- Engine: `node --test tests/engine/*.test.ts` — 30/30 outside the sandbox. The sandbox disrupts the suite's child-process checks; no engine changes were needed.
- Web: `npm test --prefix apps/web` — 9/9 focused security tests.
- Extension: `npm test --prefix apps/extension` — 2/2 focused policy/service-worker tests.
- Types: `npm run typecheck --prefix apps/web` — pass.
- Build: `npm run build --prefix apps/web -- --webpack` — pass. The default Turbopack build hits an environment socket restriction; the supported fallback is documented.
- Package: `npm run pack --prefix apps/extension` and `unzip -t apps/web/public/downloads/scopebomb-mv3-extension.zip` — 19 files, no integrity errors.
- Contract: `python3 contracts/verify_contracts.py` — schema, 11 scopes, five presets and fixture pass.
- Browser: final production flow — 16/16 assertions, including late rejection of an aborted scan and native-dialog focus.
- Source design lint: `node /home/varad/.agents/skills/design-taste-frontend/scripts/lint.mjs --app apps/web/src` — zero failures/warnings.
- Render audit: `inspect.mjs --app http://127.0.0.1:3048 --widths 1440,768,390` — see saved final findings.
- Impeccable source detector: `impeccable detect --json apps/web/src` — `[]`.
- AST graph: `graphify update .` — 812 nodes, 1284 edges. No semantic/model extraction was run; four source files have no extractor symbols, and community labels changed. Docs are the authoritative context for new prose.

Browser scripts and screenshots are local artifacts in `/tmp/scopebomb-v11-*`. The final ZIP SHA-256 is `415f26c367472537d684536f103d05156a05028a1baac8fb6f50b3e659cc6521`; two builds produced identical bytes. Final concise results are copied under `.planning/evidence/v11-release/`. The browser helper comes from the installed design-taste-frontend skill and uses disposable profiles. Chrome for Testing was needed for unpacked-extension loading; standard branded Chrome ignores the removed loading flags.

## Release gate

This is a reviewed local release candidate, not evidence that production is updated. No merge, push, deployment, live model call or destructive remediation was performed. Live model credentials were not copied from the original checkout. The project's self-scan repository returned GitHub 404/private; do not advertise that demo until repository visibility is confirmed.

Review and integrate this branch, configure model keys only on the server if desired, deploy, then smoke-test the public URL and ZIP on the deployed revision. Do not treat historical phase reports as validation of subsequent edits.
