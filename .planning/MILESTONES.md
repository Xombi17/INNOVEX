# Project Milestones: ScopeBomb

## v1.0 MVP — Core Engine, Web Arena & Chrome MV3 Guard (Shipped: 2026-11-10)

**Delivered:** Zero-dependency deterministic OAuth & shadow-AI blast-radius analyzer (`packages/engine`), light-porcelain Web Arena (`apps/web`) deployed to `https://scopebomb.vercel.app`, Chrome MV3 Pre-Consent Guard (`apps/extension`), and local secret-redacting audit CLI.

**Phases completed:** 0–3 (Foundation & Governance, Parallel MVP Vertical Slice, Chrome MV3 Guard + CLI + Live Engine Integration, Vercel Deploy & Initial Porcelain Redesign)

**Key accomplishments:**
- Froze `contracts/scope_bomb.schema.json`, `contracts/index.d.ts`, `contracts/verify_contracts.py`, and `data/scope_catalog.json` (17 verified scopes, 5 grounded 2024–2026 incident presets).
- Built zero-dependency TypeScript core engine (`parseAuditInput`, `buildBlastGraph`, `simulateContainment`, `evaluatePreConsent`, `analyzeAudit`) + local CLI (`packages/engine/cli.ts`) with 30/30 passing `node:test` specs.
- Built 7-module offline Chrome MV3 extension (`apps/extension`) intercepting Google, GitHub, and Microsoft Entra authorization pages before consent without corrupting PKCE `code_challenge`, linking deep into the Web Arena via `?oauth_url=`.
- Deployed `apps/web` to `https://scopebomb.vercel.app` and verified `impeccable`, Taste frontend lint/inspect (`0 FAIL`), and Chrome CDP E2E tests.

**Git range:** `136b0b8` -> `ea28931`

**What's next (`v1.1`):** Fix first-time user comprehension and navigation overload by rebuilding `apps/web` into a guided 3-step linear workflow with an always-visible input bar, live public GitHub repo scanner, optional plain-English AI threat triage, concrete provider CLI kill switches, an interactive in-browser consent trap simulator, and a one-click downloadable Chrome MV3 extension bundle.

---
