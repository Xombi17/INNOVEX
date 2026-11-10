# ScopeBomb — Frozen Product Specification (v1.0.0)

**Track:** PS 05 — AI-Powered Cybersecurity (INNOVEX 2026)  
**Target Deadline:** Nov 15, 2026, 23:55 IST (build freeze Nov 15, 18:00 IST)  
**One-Line Pitch:** OAuth & Shadow-Integration Blast-Radius, Persistence & Multi-Issuer Containment Simulator — proves why revoking one token (`HTTP 200 OK`) leaves attackers inside your ecosystem, and prevents over-scoped grants before PKCE handshake.

## 1. Core Architectural Pillars (Only What We Ship)

1. **Multi-Surface Input Parser (`packages/engine`)**
   - **Live OAuth URL Inspector:** Parses `accounts.google.com/o/oauth2/v2/auth`, `github.com/login/oauth/authorize`, `login.microsoftonline.com/.../authorize`, extracting `client_id`, `redirect_uri`, `scope`, `access_type=offline`, `code_challenge`, `code_challenge_method`, and `state`.
   - **Shadow-AI / Developer Config Scanner:** Parses pasted `.mcp.json`, `.env`, IDE MCP configs, or Google Takeout OAuth grant JSON exports for embedded non-human credentials (`GITHUB_TOKEN`, `VERCEL_TOKEN`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, Slack/Salesforce keys) — masking secret values immediately (never sends secrets over network).
   - **2024–2026 Real-World Incident Presets:** Interactive simulations grounded in public post-mortems (`rohan_mcp_oauth_trap`, `midnight_blizzard_2024`, `salesloft_drift_2025`, `context_ai_vercel_2026`, `litellm_ci_2026`) with exact framing (unvetted shadow-AI integration vs. vendor OAuth fan-out vs. legacy OAuth privilege abuse vs. unrevoked static key reuse).

2. **Deterministic Trust-Boundary & Domino Pivot Graph**
   - Traverses `data/scope_catalog.json` to map multi-hop escalation chains across 5 trust boundaries (`personal`, `developer_local`, `vendor`, `ci_cd`, `enterprise_tenant`).
   - Example chains: `gmail.modify` -> password-reset/OTP hijack -> downstream cloud console; `repo` + `workflow` -> `.github/workflows/*.yml` CI injection -> PyPI/npm/Vercel secret exfil; `.mcp.json` unrevoked token -> production repo + env vars.
   - Emits strict JSON conforming to `contracts/scope_bomb.schema.json`.

3. **RFC 7009 Persistence & Naive-vs-Full Containment Engine**
   - **Toggle 1 — Naive Containment (Single RFC 7009 Revoke / Password Reset):** Models what breaks and what **still persists**:
     - `HTTP 200 OK` from `POST /revoke` does **not** prove containment (spec returns `200` for already-invalid tokens; access-token cascading is only `SHOULD`; self-contained JWTs stay active until TTL; attacker-minted OAuth apps, modified CI workflows, and exfiltrated `.env` keys live at **different issuers**).
   - **Toggle 2 — Full Multi-Issuer Containment Plan:** Ordered remediation queue grouped by real issuer (`oauth2.googleapis.com/revoke`, GitHub `DELETE /applications/{client_id}/grant`, Vercel/OpenAI/Anthropic key rotation, workflow/app audit) with API rejection verification probes beyond HTTP 200.

4. **Chrome MV3 Pre-Consent Guard & Web Demo Arena (`apps/extension`, `apps/web`)**
   - **PKCE-Safe Interception:** Never corrupts `code_challenge` via mid-flight `scope=` URL rewriting on live PKCE requests. Uses Chrome MV3 pre-consent warning/blocking + clean least-privilege replacement preview (`drive` -> `drive.file`, `gmail.modify` -> `gmail.readonly`, `repo`/`workflow` -> fine-grained PAT) for a fresh auth initiation.
   - **Zero-Login Instant Demo UI:** Interactive Blast-Radius Domino Graph + Side-by-Side Naive vs. Full Containment toggle + Live OAuth URL tester + `.mcp.json` dropzone, runnable standalone on CPU/Vercel with zero mandatory API keys.

## 2. Explicit YAGNI Non-Goals (Do NOT Build)
- No Google/GitHub production OAuth app verification or live user OAuth login wall blocking judges.
- No database server, ORM, Redis, message queue, or local LLM/GPU runtime (100% deterministic core engine; optional tiny AI explainer must degrade cleanly if offline).
- No live destructive API calls against user accounts — all revocation/rotation actions output verifiable curl/API payloads & consumer kill-switch deep links safely.
- No speculative dashboards, user accounts, RBAC, billing, or extra providers beyond `data/scope_catalog.json`.

## 3. Rubric Alignment (INNOVEX 2026)
- **Innovation (25%):** First tool contrasting RFC 7009 `HTTP 200` containment illusion vs. cross-issuer trust-boundary persistence + PKCE-aware MV3 pre-consent blocking.
- **Technical Implementation (25%):** Frozen JSON Schema contract, deterministic graph traversal, strict RFC 7009 + GitHub API mechanics, working Chrome MV3 guard + interactive web arena.
- **Problem-Solving (20%):** Grounded directly in 2024–2026 incidents (Midnight Blizzard, Salesloft Drift, Context.ai->Vercel, LiteLLM).
- **Impact & Scalability (15%):** Zero-backend deterministic analyzer + local `.mcp.json`/`.env` privacy-preserving scan + instant consumer & dev kill-switch.
- **Presentation (15%):** `<90s` live judge flow, zero login friction, clear Domino visual contrast.
