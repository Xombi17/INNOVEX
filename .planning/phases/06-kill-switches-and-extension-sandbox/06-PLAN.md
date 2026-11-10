---
phase: 6
plan: 1
title: "Concrete Provider Kill-Switches & Downloadable Chrome Extension Sandbox"
goal: "Step 3 delivers immediately runnable provider revocation scripts, an in-browser Fake AI App Consent simulator, and one-click downloadable Chrome MV3 extension bundle."
requires: []
files_modified:
  - apps/web/src/lib/remediationTemplates.ts
  - apps/web/src/components/ConsentTrapSandbox.tsx
  - apps/web/src/components/ContainmentComparison.tsx
  - apps/web/src/components/Step3FixBlocker.tsx
  - apps/web/src/components/ScopeBombArena.tsx
  - apps/web/public/downloads/scopebomb-mv3-extension.zip
verify:
  automated: "cd /home/varad/Documents/hackathons/INNOVEX/apps/web && npm run typecheck 2>&1 | tail -30"
requirements: [REM-01, REM-02, REM-03, EXT-01, EXT-02, EXT-03]
---

<threat_model>
- T-06-01: Risk — Modifying ContainmentComparison breaks frozen engine contract. Mitigation: zero changes to packages/engine/**. Pure web-layer enrichment via remediationTemplates.ts.
- T-06-02: Risk — Simulated consent sandbox performs unexpected live network mutations. Mitigation: pure client-side dry run using local state and tryRunScopeBombAudit.
- T-06-03: Risk — Chrome extension zip incomplete or corrupted. Mitigation: build via extension build script, package via zipfile, and verify with unzip -t.
</threat_model>

## Tasks

### Task 1: Create remediationTemplates.ts
File: `apps/web/src/lib/remediationTemplates.ts`
Export `enrichContainmentStep(step, report)` with concrete copy-ready CLI/curl commands, verification probes, and direct dashboard URLs for each detected issuer.

### Task 2: Create ConsentTrapSandbox Component
File: `apps/web/src/components/ConsentTrapSandbox.tsx`
In-browser interactive mock consent prompt with PKCE challenge warning and one-click scope downgrade simulator.

### Task 3: Update ContainmentComparison Component
File: `apps/web/src/components/ContainmentComparison.tsx`
Render enriched CLI revocation commands, 401 verification probes, and direct provider links.

### Task 4: Package Chrome Extension Zip
Files: `apps/extension/`, `apps/web/public/downloads/scopebomb-mv3-extension.zip`
Build and bundle the Chrome MV3 extension into a static downloadable zip file.

### Task 5: Update Step3FixBlocker Component
File: `apps/web/src/components/Step3FixBlocker.tsx`
Add "Simulate Fake AI App Consent" trigger and download card for `scopebomb-mv3-extension.zip` with 3-step setup guide.

### Task 6: TypeScript & Invariant Verification
Commands: `npm run typecheck`, frozen lane diff.
