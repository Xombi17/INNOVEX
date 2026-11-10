---
phase: 7
plan: 1
title: "End-to-End Verification, Documentation Sync & Production Release"
goal: "Verify every visual, functional, contract, and protocol invariant, update documentation and Graphify knowledge graph, and ensure repository and deployment are ready for submission."
requires: []
files_modified:
  - PRODUCT.md
  - DESIGN.md
  - README.md
  - .planning/graphs/
verify:
  automated: "cd /home/varad/Documents/hackathons/INNOVEX/apps/web && npm run typecheck 2>&1 | tail -30"
requirements: [REL-01, REL-02, REL-03]
---

<threat_model>
- T-07-01: Risk — Documentation drifts from implementation. Mitigation: sync PRODUCT.md and DESIGN.md with v1.1 features (3-step stepper, live repo scan, AI triage, sandbox).
- T-07-02: Risk — Regression in frozen engine contracts. Mitigation: assert git diff on frozen lane is completely clean before and after verification.
</threat_model>

## Tasks

### Task 1: Complete Automated Test & Invariant Verification
Commands:
- `python3 contracts/verify_contracts.py`
- `$HOME/.nvm/versions/node/v24.21.0/bin/node --test tests/engine/*.test.ts`
- `cd apps/web && npm run typecheck`
- `unzip -t apps/web/public/downloads/scopebomb-mv3-extension.zip`
- `git diff -- packages/engine tests/engine contracts data/scope_catalog.json`

### Task 2: Sync Documentation for v1.1
Files: `PRODUCT.md`, `DESIGN.md`, `README.md`
Update descriptions, features, and screenshots/architecture notes to reflect the 3-Step Guided flow, GitHub repo scanner, AI threat triage, and consent sandbox.

### Task 3: Graphify Knowledge Graph Update
Command: `graphify update .` and sync `.planning/graphs/`

### Task 4: Release Verification & Branch Push
Fast-forward merge `feat/ui-extension` into `main` and push to origin.

