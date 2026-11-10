---
phase: 5
plan: 1
title: "Live Public GitHub Repo Scanner & Plain-English AI Threat Triage"
goal: "Add stateless /api/scan-repo and /api/ai-triage serverless endpoints with strict SSRF/redaction safety, deterministic offline fallback, and clean integration in Web Arena Step 1 and Step 2."
requires: []
files_modified:
  - apps/web/src/lib/aiTriageTypes.ts
  - apps/web/src/app/api/scan-repo/route.ts
  - apps/web/src/app/api/ai-triage/route.ts
  - apps/web/src/components/AITriageCard.tsx
  - apps/web/src/components/InputAndPresetBar.tsx
  - apps/web/src/components/Step1ScanVerdict.tsx
  - apps/web/src/components/Step2AttackPath.tsx
  - apps/web/src/components/ScopeBombArena.tsx
verify:
  automated: "cd /home/varad/Documents/hackathons/INNOVEX/apps/web && npm run typecheck 2>&1 | tail -30"
requirements: [SCAN-01, SCAN-02, AI-01, AI-02, AI-03]
---

<threat_model>
- T-05-01: Risk — /api/scan-repo vulnerable to SSRF. Mitigation: validate owner/repo strictly matching regex `^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$`, only make outbound HTTP calls to `api.github.com` and `raw.githubusercontent.com`.
- T-05-02: Risk — /api/ai-triage leaks credentials to external LLM. Mitigation: payload contract accepts only high-level summary metrics (counts, hops, providers, masked key names). Never raw tokens or previews.
- T-05-03: Risk — External API downtime causes Web Arena failure. Mitigation: deterministic offline synthesizer runs on timeout or missing keys with `fallback_used: true`.
</threat_model>

## Tasks

### Task 1: Create AITriageTypes
File: `apps/web/src/lib/aiTriageTypes.ts`
Define typed request and response schemas for AI triage.

### Task 2: Create /api/scan-repo Route
File: `apps/web/src/app/api/scan-repo/route.ts`
Public repo inspector with SSRF defense, file filtering, secret masking, and synthetic MCP config generator.

### Task 3: Create /api/ai-triage Route
File: `apps/web/src/app/api/ai-triage/route.ts`
Stateless triage route supporting Gemini, OpenAI, and deterministic offline synthesis.

### Task 4: Create AITriageCard Component
File: `apps/web/src/components/AITriageCard.tsx`
Visual 3-pillar card with honest attribution badge (`Live AI` vs `Offline Synthesizer`) and scannable cards.

### Task 5: Wire Repo Scanner in InputAndPresetBar
File: `apps/web/src/components/InputAndPresetBar.tsx`
Connect GitHub Repo tab to POST `/api/scan-repo` with loading indicator and file badges.

### Task 6: Integrate AITriageCard into Step1 and Step2
Files: `apps/web/src/components/Step1ScanVerdict.tsx`, `apps/web/src/components/Step2AttackPath.tsx`, `apps/web/src/components/ScopeBombArena.tsx`
Show live triage card in Step 1 and threat summary pill in Step 2.

### Task 7: Verification & Frozen Lane Check
Commands: `npm run typecheck`, frozen lane diff.
