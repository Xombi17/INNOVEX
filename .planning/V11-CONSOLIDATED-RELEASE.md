# ScopeBomb v1.1 consolidated release

Date: 2026-11-11. Base: Candidate B (`641b8ad`, UI implementation `900f4c7`). Selected hardening ported from Candidate A (`5f6a576`).

| Criterion | Candidate A | Candidate B | Release decision |
| --- | --- | --- | --- |
| First-use clarity | Scanner and illustrative sample share the first screen | Explicit example/input choice; provenance; accessible dialogs and history | Keep B; shorten welcome heading and flatten choices |
| Standard build | Initial stale cache failed with Turbopack socket EPERM; moving `.next` aside produced a standard successful build (3.4s compile) | Standard successful build (1.2s compile) | Both qualified; times are diagnostic, not a controlled performance benchmark |
| Browser checks | B's welcome-specific suite is incompatible; A's own 16-check workflow suite passed | 37 checks passed before integration | Keep B suite; add keyboard skip-link check and desktop/mobile workflow screenshots |
| Design baseline | Source lint and render inspector 0 FAIL/0 WARN; Impeccable advisory typography findings only | Source lint 6 warnings; render inspector 1 fail/2 warnings; nested-choice panels | Consolidated lint/inspect 0 FAIL/0 WARN and Impeccable desktop/mobile empty |
| API security | Shared streaming byte limits, no redirects, strict summaries | Strict provider/count allowlist and model ordering of vetted facts; bounded pinned repository retrieval | Port A byte reader to both requests and inference responses; reuse for repository responses; prohibit inference redirects |
| Remediation | Provider-specific commands/probes and independent PAT distinctions | Action owners, understandable guidance, self-reported verification | Combine A commands with B guidance; retain conditional/unverified outcomes |
| MV3 | Deterministic shell-safe ZIP, 2 guard tests | Honest catalog-warning and handoff copy | Port packer/tests and exact PKCE explanation; preserve B warnings |

Local homepage fetch benchmark (five warm sequential requests including body, same host): A median 12.9 ms (10.9–13.8 ms), consolidated B median 10.5 ms (9.3–12.5 ms). This is a smoke benchmark, not a production load or statistically controlled speed claim.

## Verified local release gates

- Contracts valid; 30/30 frozen engine tests; 23/23 web tests (analysis, repository, adapted security); 2/2 extension tests; TypeScript and standard production build passed.
- Browser suite: 39 checks, including skip-link visibility, welcome distinction, redaction, AI opt-in, partial coverage, history, dialog focus, sandbox isolation, deep-link cleanup, and 390/320px overflow checks.
- Source lint and rendered inspector at 1440/768/390px: 0 FAIL, 0 WARN. Both Impeccable desktop and 390x844 scans: no findings.
- Unpacked MV3 installed using Chrome CDP `Extensions.loadUnpacked`: popup and guard rendered; actual supported top-level OAuth navigation redirected to guard with the exact original URL preserved. Both candidate extensions checked. Temporary browser harness required no product dependency.
- Extension ZIP integrity passed; two independent packs had SHA-256 `15e3d93c83a99d81b9451f9cb64703e7ee7b18a05f9527a8220acdcda1e9f7fe` (19 entries, manifest v1.1.0).
- Local API smoke: valid summary 200 labeled local fallback; unrecognized provider 400; non-GitHub host 400; public `octocat/Hello-World` 200 with zero matching files at pinned revision (not a clean-account assertion); `Xombi17/INNOVEX` 404.
- Unauthenticated GitHub API: `Xombi17/INNOVEX` 404 (could be private or missing), `octocat/Hello-World` 200. Public demo defaults use the latter. Public source/setup links that returned 404 were replaced with the working extension download; local CLI instructions require a source checkout.
- `git diff main -- packages/engine tests/engine contracts data/scope_catalog.json`: empty.
- Graphify AST update: 836 nodes / 1320 edges / 52 communities, zero LLM cost; generated outputs mirrored into `.planning/graphs/` (ignored local artifacts).
- `vercel env ls`: no configured environment variables. Production uses an honest local rule-based fallback; real model inference is not claimed.

## Protocol references

- [RFC 7009](https://www.rfc-editor.org/rfc/rfc7009.html): HTTP 200 includes invalid tokens; access-token cascading after refresh-token revocation is SHOULD.
- [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636): S256 derives from the verifier; scopes are not part of the hash. No pending authorization is rewritten; PKCE guard replacement remains null.
- [GitHub grant deletion](https://docs.github.com/en/rest/apps/oauth-applications#delete-an-app-authorization): application-owner Basic authentication, DELETE `/applications/{client_id}/grant`, 204, separate from independent PAT revocation.

The historical `DEMO_SCRIPT.md` has older immediate-sample and replacement-URL framing. The shipped interface and `docs/UX-VALIDATION.md` govern the actual safe walkthrough: choose example, understand possible exposure, review unverified actions, then demonstrate fresh client-managed authorization. No fake credentials are manufactured for empty repository results.

## Limits

Human ten-second comprehension and screen-reader study remain pending. No destructive provider actions, real credentials, live LLM keys or account containment were exercised. Browser screenshots and automated assertions establish implementation behavior, not user demand or proven security of an account.

Production deployment and smoke evidence are appended after deployment completes.
