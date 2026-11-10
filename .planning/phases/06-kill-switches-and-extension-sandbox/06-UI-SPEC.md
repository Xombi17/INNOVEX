# UI Design Contract — Phase 6: Concrete Provider Kill-Switches & Downloadable Chrome Extension Sandbox

**Phase:** 06-kill-switches-and-extension-sandbox
**Generated:** 2026-11-10
**Applies to:** `apps/web/src/`, `apps/extension/`
**Design system authority:** `DESIGN.md` (framed-sheet porcelain)

---

## Overview

Phase 6 upgrades Step 3 (`Fix Plan & Blocker`) into an executable containment control center:
1. **Concrete Provider Kill-Switches**: Upgrades generic remediation table rows to display copy-ready `curl`/CLI commands, verification `401` probes, and direct account settings links.
2. **In-Browser Consent Simulator (`ConsentTrapSandbox.tsx`)**: An interactive mock OAuth authorization prompt demonstrating why mid-flight scope rewriting breaks PKCE and allowing judges to test least-privilege scope downgrades with immediate risk recalculation.
3. **Chrome Extension Pack & Install Guide**: Direct one-click download of `scopebomb-mv3-extension.zip` from `/downloads/scopebomb-mv3-extension.zip` paired with clear 3-step `chrome://extensions` instructions.

---

## Design System & Tokens

- **Sheet Surfaces**: `#ffffff` with `border border-[#e8eaec]` and `rounded-[8px]`.
- **Code Blocks**: `font-mono text-[12px] bg-[#f4f6f8] text-[#131416] p-2 rounded-[6px] border border-[#e8eaec]`.
- **Action Buttons**: `bg-[#131416] text-[#ffffff] text-[13px] rounded-[6px] px-3 py-1.5 hover:bg-[#2a2c30]`.
- **Simulated Consent Box**: Framed sheet mimicking a clean authorization prompt (`#ffffff`, `border border-[#cdced1]`, Google/GitHub styled header).
- **Zero Nested Cards**: Use horizontal hairline dividers (`divide-y divide-[#f0f1f2]`).

---

## Acceptance Criteria

- [ ] `AC-01`: Containment steps display copy-ready CLI/curl commands and verification probes per issuer.
- [ ] `AC-02`: Clicking "Simulate Fake AI App Consent" opens `ConsentTrapSandbox` showing realistic mock OAuth consent prompt.
- [ ] `AC-03`: Clicking "Inspect with ScopeBomb Guard" in sandbox explains PKCE challenge invalidation and least-privilege downgrade.
- [ ] `AC-04`: Clicking "Apply Clean Scopes" in sandbox recalculates audit with reduced scopes.
- [ ] `AC-05`: Step 3 provides a working download link to `/downloads/scopebomb-mv3-extension.zip` and a concise 3-step setup guide for `chrome://extensions`.
- [ ] `AC-06`: The extension zip is valid and unzips cleanly with `unzip -t`.

