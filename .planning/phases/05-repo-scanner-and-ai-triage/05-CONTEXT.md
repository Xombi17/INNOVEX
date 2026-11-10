# Phase 5: Live Public GitHub Repo Scanner & Plain-English AI Threat Triage - Context

**Gathered:** 2026-11-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver two stateless Next.js App Router backend endpoints inside `apps/web/src/app/api/` and wire them cleanly into Step 1 and Step 2 of the Web Arena:
1. `POST /api/scan-repo` — Inspects any public GitHub repository (`owner/repo` or `https://github.com/owner/repo`) for `.mcp.json`, `mcp.json`, `.env*` config/templates, and `.github/workflows/*.yml` over-scoped workflow triggers/secrets, immediately masks secret-like values server-side, and returns sanitized configuration text for deterministic `analyzeAudit()`.
2. `POST /api/ai-triage` — Accepts strictly redacted `AuditReport` summary fields (NEVER raw unredacted secrets), produces a plain-English **Attacker Story**, **Why 1-Click Revoke Fails**, and **First 60 Seconds Action**, using live LLM inference when `GEMINI_API_KEY` or `OPENAI_API_KEY` is configured and falling back deterministically (`fallback_used: true`) when offline or unconfigured.

Strictly read-only toward `packages/engine/**`, `tests/engine/**`, `contracts/**`, and `data/scope_catalog.json`.

</domain>

<decisions>
## Implementation Decisions

### Public GitHub Repo Scanner (`SCAN-01`, `SCAN-02`)
- **D-01 (Input Parsing & SSRF Defense):** Accept `owner/repo` shorthand or `https://github.com/<owner>/<repo>` URLs (validating strictly `[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+`, stripping `.git`, optional tree/branch suffix if clean). NEVER fetch arbitrary URLs, IPs, localhost, or non-`github.com` hosts. Only call `https://api.github.com/repos/{owner}/{repo}...` and `https://raw.githubusercontent.com/{owner}/{repo}/...`.
- **D-02 (Bounded Inspection & Timeout):** Fetch default branch tree (`GET /repos/{owner}/{repo}/git/trees/HEAD?recursive=1` or root contents fallback if rate-limited), match target filenames (`.mcp.json`, `mcp.json`, `.cursor/mcp.json`, `.env.example`, `.env.local`, `.env.sample`, `.env`, `.github/workflows/*.yml`), cap at **max 10 files**, **max 64KB per file**, **8s abort timeout**, returning crisp actionable error messages on `404` (private/missing repo) or `403/429` (GitHub anonymous rate limit).
- **D-03 (Immediate Masking & Deterministic Feeding):** Run pattern-based secret redaction (`ghp_`, `github_pat_`, `sk-`, `sk-ant-`, `xoxb-`, `AIza`, `vercel_` / token env values) on fetched content server-side before returning JSON `{ repo, branch, scannedFiles, detectedPatterns, syntheticMcpPayload, workflowWarnings }`. Never persist fetched repo content.
- **D-04 (Client Integration):** Submitting a GitHub repo in Step 1 (`GitHub Repo URL` tab + 2 one-click sample repo buttons for instant testing) triggers `/api/scan-repo`, displays scanned file badges (`Scanned 4 files from owner/repo`), feeds the masked config payload through `tryRunScopeBombAudit({ mode: "mcp_config", ... })`, and triggers AI triage. Include a graceful workflow risk mapper note when workflows request `contents: write` / `id-token: write` or expose `GITHUB_TOKEN`.

### Plain-English AI Threat Triage (`AI-01`, `AI-02`, `AI-03`)
- **D-05 (Zero-Secret Payload Contract):** Define `apps/web/src/lib/aiTriageTypes.ts`. Request body to `POST /api/ai-triage` contains ONLY non-secret summary facts (`inputMode`, `presetId`, `headline`, `maxRiskScore`, `maxHops`, `trustBoundaries`, `primaryProvider`, `requestedScopes`, `detectedKeyNames` using masked key names like `VERCEL_TOKEN` only — never previews or raw tokens, `naivePersistingCount`, `naiveStoppedPct`, `topPersistingLabels`, `topSteps`, `pkceProtected`).
- **D-06 (Dual Provider + Deterministic Fallback):**
  - If `process.env.GEMINI_API_KEY` is present -> call Gemini REST (`gemini-2.5-flash` / `generativelanguage.googleapis.com`) with strict JSON schema output and `8s` timeout.
  - Else if `process.env.OPENAI_API_KEY` is present -> call OpenAI Chat Completions (`gpt-4o-mini` or `gpt-4.1-mini`) with strict JSON output.
  - Else (or on upstream timeout/error) -> compute rich **deterministic plain-English triage** directly from the redacted facts (`mode: "deterministic-fallback"`, `provider: "local-synthesizer"`, `fallback_used: true`), synthesizing accurate incident/scope/cross-issuer explanations with zero network dependency!
- **D-07 (Honest Attribution & Non-Hallucination):** Prompt & fallback BOTH enforce `SPEC.md` protocol rules (never claim `HTTP 200` proved revocation, never fabricate compromised accounts, cite actual crossed trust boundaries & issuers from the audit input). UI renders a subtle transparent badge: `"AI Triage · Live Model"` or `"Smart Triage · Offline Synthesizer"` so judges can verify both behaviors honestly.

### UI Presentation (`AI-03`)
- **D-08:** Render a concise, unboxed hairline **Plain-English Security Brief** strip in Step 1 (with quick summary synced into Step 2) containing 3 short scannable items (`What an attacker could do`, `Why 1-click Revoke fails`, `Your first 60 seconds move`). Includes a `"Regenerate summary"` / `"Ask: What if I click Allow?"` micro-action.

### the agent's Discretion
- Whether to use direct `fetch` calls inside Next.js Route Handlers (`export const runtime = "nodejs"`) vs installing `@ai-sdk/google` (direct native `fetch` keeps `apps/web/package.json` dependency footprint lean, fast, and avoids unpinned AI SDK version friction — recommend direct native `fetch` with strict schema validation unless needed).

</decisions>

<specifics>
## Specific Ideas

- Include curated 1-click public demo repo chips in Step 1 (`Xombi17/INNOVEX` self-scan! and `modelcontextprotocol/servers` or a curated example) — wait: scanning `Xombi17/INNOVEX` itself live in front of judges is an awesome meta-demo (`node packages/engine/cli.ts .` vs live web scan of the hackathon repo!). Verify repo visibility before setting default pill (`Xombi17/INNOVEX` is already pushed public!).
- Ensure malformed/non-existent repo URLs show clean inline validation without throwing uncaught exceptions or overwriting the last good audit state.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Specification & Constraints
- `SPEC.md` §1 & §2 (optional tiny AI explainer must degrade cleanly if offline; zero secret exfiltration)
- `PRODUCT.md` — Zero-exfiltration & zero-fabricated-claims policy
- `GEMINI.md` — Antigravity lane (`apps/web/**`) vs read-only `packages/engine/**`

### Frozen Core Engine & Existing Adapter
- `contracts/index.d.ts` — `AuditReport`, `AuditInput`, `ContainmentStep`, `ShadowSecretFinding`
- `apps/web/src/lib/auditAdapter.ts` — Calls `@scopebomb/engine` `analyzeAudit`
- `packages/engine/parsers.ts` — Reference only (read-only) to ensure `/api/scan-repo` output format triggers `parseMcpConfig` cleanly with `.mcp.json` / `.env` key patterns
- `apps/web/src/components/ScopeBombArena.tsx` & Step 1 components delivered in Phase 4

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ScopeBombArena.tsx` + Step 1 input tabs built in Phase 4.
- `.env.local` in root currently only sets `VERCEL_OIDC_TOKEN`, making deterministic offline fallback immediately testable in dev + production, while supporting `GEMINI_API_KEY` / `OPENAI_API_KEY` if added in Vercel env vars.

### Established Patterns
- All secret previews (`ghp_••••`, `[REDACTED]`) happen before modeling. Notice `packages/engine/parsers.ts` detects key names (`GITHUB_TOKEN`, `VERCEL_TOKEN`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `SLACK_BOT_TOKEN`, `SALESFORCE_TOKEN`, etc.) and `.mcp.json` `mcpServers` entries!

### Integration Points
- `apps/web/src/app/api/scan-repo/route.ts` (new)
- `apps/web/src/app/api/ai-triage/route.ts` (new)
- Step 1 UI component & `ScopeBombArena.tsx` state hook calling `/api/ai-triage` whenever an audit changes (non-blocking async fetch with immediate local deterministic preview while/if upgrading to live AI).

</code_context>

<deferred>
## Deferred Ideas

- GitHub OAuth app authentication for private repo scanning — explicitly Out of Scope (`SPEC.md` YAGNI)
- Streaming multi-turn security chatbot UI — avoid scope creep; structured 3-part Threat Triage brief is clearer and faster for `<90s` judging

</deferred>

---

*Phase: 05-repo-scanner-and-ai-triage*
*Context gathered: 2026-11-10*
