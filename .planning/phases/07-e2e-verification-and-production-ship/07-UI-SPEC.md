# UI Design Contract — Phase 7: End-to-End Visual/E2E Verification, Doc Sync & Live Production Ship

**Phase:** 07-e2e-verification-and-production-ship
**Generated:** 2026-11-10
**Applies to:** Verification across all viewports (`1440x900`, `768x1024`, `390x844`), docs, live Vercel deploy
**Design system authority:** `DESIGN.md` (framed-sheet porcelain)

---

## Overview

Phase 7 is the release and verification gate for Milestone v1.1. It validates every visual, functional, protocol, and contract invariant across desktop and mobile viewports, updates project knowledge and documentation, pushes to origin, and verifies production at `https://scopebomb.vercel.app`.

---

## Visual Verification Rubric

- **Responsive Bounds**:
  - Desktop (`1440x900`): Max width 1440px centered, zero horizontal scrolling, clear visual hierarchy.
  - Tablet (`768x1024`): Fluid sheet layout, 2-column or stacked metric cards, clean touch targets (min 44px).
  - Mobile (`390x844`): Single-column stack, wrapped code blocks without horizontal viewport blowout, stepper tabs clearly touch-navigable.
- **Tokens**:
  - Background `#f9fbfc`, card `#ffffff`, borders `#e8eaec` / `#f0f1f2`.
  - Zero nested bordered cards.
  - Typography floor >= 13px across all body and interactive labels.

---

## Acceptance Criteria

- [ ] `AC-01`: `verify_contracts.py` passes (schema, scopes, presets, fixture).
- [ ] `AC-02`: Node 24 engine tests pass 30/30 (`tests/engine/*.test.ts`).
- [ ] `AC-03`: `npm run typecheck` passes with zero errors.
- [ ] `AC-04`: Frozen lane invariant (`packages/engine`, `tests/engine`, `contracts`, `data/scope_catalog.json`) is 100% clean.
- [ ] `AC-05`: `scopebomb-mv3-extension.zip` verified via `unzip -t`.
- [ ] `AC-06`: Graphify knowledge graph updated (`graphify update .`).
- [ ] `AC-07`: `PRODUCT.md`, `DESIGN.md`, `README.md`, `STATE.md`, and `ROADMAP.md` synced.

