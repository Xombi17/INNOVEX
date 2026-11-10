# Multi-Agent Orchestration & Token-Saving Playbook (`ScopeBomb`)

Read this on setup/handoff only (kept out of `AGENTS.md` / `GEMINI.md` so workers do not pay its token cost on every turn).

## 1. Worktree & Branch Topology (Zero Collisions)
- `main`: Clean frozen baseline & integration branch.
- `feat/ui-extension` (`/home/varad/Documents/hackathons/INNOVEX`): **Antigravity Lane** — owns `apps/web/**`, `apps/extension/**`, `SPEC.md`, `DEMO_SCRIPT.md`, `.planning/**`.
- `feat/core-engine` (`/home/varad/Documents/hackathons/INNOVEX/.worktrees/core-engine`): **Codex Lane** — owns `packages/engine/**`, `tests/engine/**`.
- **Frozen / Orchestrator-Only:** `contracts/**`, `data/scope_catalog.json`. Workers treat these as **read-only**. If a contract field must change, pause workers, update on `main` + bump schema, rebase both branches.

## 2. Launching Parallel Agents Safely
1. **Antigravity (current workspace):** Work directly in `/home/varad/Documents/hackathons/INNOVEX` (`feat/ui-extension`). Open a **fresh chat** when switching phases (Engine Integration vs. Web UI vs. Chrome MV3 Guard vs. E2E Polish).
2. **Codex CLI (parallel worker terminal):** Always run inside the isolated worktree with heavy unused global MCPs disabled:
   ```bash
   cd /home/varad/Documents/hackathons/INNOVEX/.worktrees/core-engine
   codex \
     -c mcp_servers.rea.enabled=false \
     -c mcp_servers.aws-mcp.enabled=false \
     -c mcp_servers.firecrawl.enabled=false
   ```
   *(Repository `.codex/config.toml` also sets these once the directory is marked trusted in Codex.)*

## 3. Token-Saving Discipline
- **Graphify Before Reading:** Run `graphify query "<topic>"` or `graphify path A B` before opening multiple files. Run `graphify update .` (AST-only, $0 API cost) after modifying source files.
- **Ponytail (`full`):** Standard library & platform primitives before adding npm/PyPI dependencies; minimal working diffs; **one focused test per non-trivial parser/graph/containment function** rather than bloated test boilerplate.
- **Bounded Commands:** Never dump huge logs/outputs into chat. Pipe test output through `--tb=short -q` or `tail -n 30`.
- **Fresh Context over Mega-Sessions:** Compact (`/compact`) or start a fresh chat strictly at phase boundaries after updating `.planning/STATE.md`.

## 4. Merge-Back Gate (Zero Conflict Protocol)
Before merging `feat/core-engine` or `feat/ui-extension` into `main`:
1. Verify `git diff --name-only` contains **only** files owned by that lane.
2. Run `python3 contracts/verify_contracts.py` + lane unit tests.
3. Merge cleanly:
   ```bash
   git -C /home/varad/Documents/hackathons/INNOVEX/.worktrees/core-engine status
   # Integrate cleanly into main, then sync both feat/ui-extension and feat/core-engine
   ```
