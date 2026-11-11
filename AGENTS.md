# Codex Agent Instructions — ScopeBomb (`INNOVEX`)

## Role & Orchestration Ownership (Updated 2026-11-11)
- **Your Role:** **Lead Orchestrator & Release Engineer.** Antigravity has handed off orchestration to Codex across all branches and worktrees (`/home/varad/Documents/hackathons/INNOVEX`, `.worktrees/core-engine`, `/tmp/scopebomb-v11-release`).
- **Frozen Core Baseline (Keep Read-Only Unless Contract Change Explicitly Required):** `packages/engine/**`, `tests/engine/**`, `contracts/scope_bomb.schema.json`, `contracts/index.d.ts`, and `data/scope_catalog.json` are verified (`30/30` tests, `verify_contracts.py` OK) and already merged across `main`, `feat/core-engine`, `fix/v11-release`, and `feat/ui-extension`. Do not modify them unless resolving a proven defect.
- **Immediate Orchestration Mission:** Read `.planning/STATE.md` and `.planning/CODEX_HANDOFF.md`, compile and evaluate `fix/v11-release` (`5f6a576` in `/tmp/scopebomb-v11-release`) vs `feat/ui-extension` (`900f4c7` in `/home/varad/Documents/hackathons/INNOVEX`) vs historical `764f42b`, select/merge the strongest combination cleanly into `main`, verify end-to-end (build, tests, browser, extension, design lint), update Graphify (`graphify update .`), and deploy to live Vercel (`https://scopebomb.vercel.app`).
- **Tech Discipline (Ponytail `full`):** Pure zero-dependency TypeScript/stdlib/native APIs first (`URL`, `URLSearchParams`, `node:test`, `node:assert`). Minimal working diffs; verify every claim directly from tool output.
- **Technical Accuracy:** Preserve RFC 7009 nuances (`HTTP 200 OK` != proof of containment; access-token cascading is only `SHOULD`), GitHub `DELETE /applications/{client_id}/grant` (versus PAT revocation), and never corrupt PKCE `code_challenge` via mid-flight scope rewriting (`safe_replacement_url: null`). Run `python3 contracts/verify_contracts.py` and `node --test tests/engine/*.test.ts` after any integration.
- **Token Conservation:** Read `.planning/CODEX_HANDOFF.md` & `ORCHESTRATION.md` once at startup. Keep responses concise; pipe verbose test output (`--tb=short` or `tail -n 30`).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
