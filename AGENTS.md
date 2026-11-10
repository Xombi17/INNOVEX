# Codex Agent Instructions — ScopeBomb (`INNOVEX`)

## Role & Strict Ownership
- **Your Lane:** Deterministic core engine & unit tests ONLY (`packages/engine/**`, `tests/engine/**`) inside `/home/varad/Documents/hackathons/INNOVEX-engine` (`feat/core-engine`).
- **DO NOT MODIFY:** `apps/web/**`, `apps/extension/**`, `contracts/**`, `data/scope_catalog.json`, `SPEC.md`, `DEMO_SCRIPT.md`, `.planning/**`. Treat `contracts/scope_bomb.schema.json`, `contracts/index.d.ts`, and `data/scope_catalog.json` as read-only truth.
- **Tech Discipline (Ponytail `full`):** Pure zero-dependency TypeScript runnable in Node 24 (`node --test`) and importable directly by Next.js / Chrome MV3. Stdlib/native APIs first (`URL`, `URLSearchParams`, `node:test`, `node:assert`). Every non-trivial parser/graph/containment function keeps one focused check.
- **Technical Accuracy:** Preserve RFC 7009 nuances (`HTTP 200 OK` != proof of containment; access-token cascading is only `SHOULD`), GitHub `DELETE /applications/{client_id}/grant`, and never corrupt PKCE `code_challenge` via mid-flight scope rewriting. Run `python3 contracts/verify_contracts.py` after any integration check.
- **Token Conservation:** Read `ORCHESTRATION.md` once only if needed. Keep responses brief; pipe test runs (`--tb=short` or `tail -n 30`).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
