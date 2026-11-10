# UI Design Contract — Phase 5: Live Public GitHub Repo Scanner & Plain-English AI Threat Triage

**Phase:** 05-repo-scanner-and-ai-triage
**Generated:** 2026-11-10
**Applies to:** `apps/web/src/` (API routes, UI components, types)
**Design system authority:** `DESIGN.md` (framed-sheet porcelain)

---

## Overview

Phase 5 equips ScopeBomb with live serverless intelligence without violating zero-secret-exfiltration guarantees:
1. `POST /api/scan-repo`: Inspects public GitHub repositories for root `.mcp.json`, `.env*`, and GitHub Actions workflow files within strict SSRF constraints, masks secrets server-side, and feeds synthetic config into `analyzeAudit()`.
2. `POST /api/ai-triage`: Receives strictly redacted summary metrics and outputs plain-English attacker stories, revoke failure explanations, and first-60-seconds actions via live LLM or deterministic fallback.
3. `AITriageCard.tsx`: Unboxed hairline card in Step 1 (and concise banner in Step 2) rendering honest model attribution badges (`Live AI` vs `Offline Synthesizer`) and 3 clear action sections.

---

## Visual Design & Framed-Sheet Tokens

- **Sheet Surface**: `#ffffff` with `border border-[#e8eaec]` and `rounded-[8px]` (no heavy drop shadows, no nested double cards).
- **Badge Tokens**:
  - Live Model: `bg-[#e6f2f5] text-[#1b6c80] border border-[#a2cfd8]`
  - Offline Synthesizer: `bg-[#f4f6f8] text-[#5d5f60] border border-[#e8eaec]`
- **Typography**:
  - Title: `14px font-semibold text-[#131416]`
  - Body: `13px leading-[1.5] text-[#5d5f60]`
  - Strong items: `13px font-medium text-[#131416]`
- **Zero Nested Cards**: Use `divide-y divide-[#f0f1f2]` or borderless padded columns instead of nested bordered cards.

---

## Acceptance Criteria

- [ ] `AC-01`: Submitting a public GitHub repository (`owner/repo` or URL) calls `/api/scan-repo` and shows a clean loading state.
- [ ] `AC-02`: Scanned repository files (e.g., `4 files scanned from owner/repo`) are shown with badges.
- [ ] `AC-03`: `POST /api/ai-triage` receives zero secret values and returns structured triage fields.
- [ ] `AC-04`: If no API key is set, deterministic fallback returns accurate, non-hallucinatory explanations with `fallback_used: true`.
- [ ] `AC-05`: Model attribution badge clearly differentiates between live model and offline synthesizer.
- [ ] `AC-06`: Step 1 displays the 3-section AI Threat Brief (`What an attacker could do`, `Why 1-click Revoke fails`, `Your first 60 seconds move`).

