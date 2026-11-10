# ScopeBomb Delivery Roadmap (Nov 10 – Nov 15, 2026)

- **Phase 0: Foundation & Governance (COMPLETE — Nov 10)**
  - Frozen `SPEC.md`, `DEMO_SCRIPT.md`, `contracts/`, `data/scope_catalog.json`, `AGENTS.md`, `GEMINI.md`, GSD + Graphify config, `feat/ui-extension` & `.worktrees/core-engine` (`feat/core-engine`) worktree split.
- **Phase 1: Parallel MVP Vertical Slice (`feat/core-engine` + `feat/ui-extension`) — Nov 10–11**
  - **Mode:** mvp
  - Codex builds `packages/engine` (`parseAuditInput`, `buildBlastGraph`, `simulateContainment`, `evaluatePreConsent`) + Node tests.
  - Antigravity builds `apps/web` shell consuming `contracts/sample_report.fixture.json` -> switches cleanly to live engine import on merge.
- **Phase 2: Chrome MV3 Guard + Multi-Issuer Presets Integration — Nov 12–13**
  - Integrate `apps/extension` (MV3 `webNavigation`/UI banner with PKCE-safe pre-consent blocking) + wire all 5 grounded incident presets + live OAuth URL & `.mcp.json`/`.env` scanner.
- **Phase 3: End-to-End Verification, Vercel Deploy & Demo Polish — Nov 14–15**
  - Run Graphify diff/update, `verify_contracts.py`, Node test suite, Playwright/Chrome live DOM verification against `DEMO_SCRIPT.md`, deploy live link to Vercel, capture README architecture diagram/video before Nov 15 23:55 IST.
