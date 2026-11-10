---
phase: 06-kill-switches-and-extension-sandbox
verified: 2026-11-10T20:28:00Z
status: passed
score: 6/6 must-haves verified
covered_files:
  - .planning/phases/06-kill-switches-and-extension-sandbox/06-PLAN.md
  - .planning/phases/06-kill-switches-and-extension-sandbox/06-SUMMARY.md
  - apps/extension/scripts/pack.mjs
  - apps/web/src/components/ConsentTrapSandbox.tsx
  - apps/web/src/components/ContainmentComparison.tsx
  - apps/web/src/components/Step3FixBlocker.tsx
  - apps/web/src/lib/remediationTemplates.ts
covered_digest: "v3:sha256:4b96fec8655f744350fc3525f93f10f6099d0badc31f19aab4f19f48ce6575a7"
behavior_unverified: 0
---

# Phase 6: Concrete Provider Kill-Switches & Downloadable Chrome Extension Sandbox Verification Report

**Phase Goal:** Step 3 delivers immediately runnable provider revocation scripts (`curl`, `gh`, console deep links, and `401` verification probes) instead of generic placeholders, alongside an in-browser `"Simulate Fake AI App Consent"` sandbox and one-click downloadable Chrome MV3 extension bundle.
**Verified:** 2026-11-10T20:28:00Z
**Status:** passed

## Goal Achievement

### Observable Truths

1. **Concrete Provider Kill-Switches (`REM-01`, `REM-02`, `REM-03`)**
   - Verified: `remediationTemplates.ts` enriches containment steps with actionable `curl`/CLI commands for Google, GitHub, Entra ID, Vercel, Slack, Salesforce, OpenAI, and Anthropic.
   - Verified: Post-revocation HTTP 401 probes and RFC 7009 caveats displayed for each step.
   - Verified: Direct provider settings links provided.

2. **In-Browser Consent Trap Sandbox (`EXT-01`, `EXT-02`)**
   - Verified: `ConsentTrapSandbox.tsx` provides interactive mock consent dialog with "Allow" and "Inspect with ScopeBomb Guard".
   - Verified: Demonstrates why in-flight `?scope=` rewriting invalidates PKCE `code_challenge`.
   - Verified: One-click "Apply Clean Scopes to Simulation" re-runs audit with downgraded scopes.

3. **Downloadable Extension Zip & Setup Guide (`EXT-03`)**
   - Verified: `apps/web/public/downloads/scopebomb-mv3-extension.zip` created and verified via `unzip -t` (19 files OK).
   - Verified: Step 3 includes download button and 3-step `chrome://extensions` load unpacked guide.

## Contract & Lane Invariants

- **Engine Freeze**: `git diff -- packages/engine tests/engine contracts data/scope_catalog.json` is clean (0 changes).
- **TypeScript**: `cd apps/web && npm run typecheck` passed (exit code 0).
- **Contract Verifier**: `python3 contracts/verify_contracts.py` passed.
- **Engine Tests**: `node --test tests/engine/*.test.ts` on Node 24 passed (30/30).
