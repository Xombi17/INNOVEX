---
version: 1
slug: "apps-web"
primary_target: "apps/web"
related_targets: []
---

# Surface Brief: ScopeBomb Web Arena (apps/web)

- **Mode:** Operate (interactive blast-radius & pre-consent simulation workbench)
- **Primary Task:** Let developers and first-time evaluators grasp in seconds how Web Arena, Chrome MV3 Extension, and Local CLI fit together, trigger any 2024–2026 OAuth/MCP incident or custom URL/config, see why `POST /revoke` (`HTTP 200 OK`) leaves downstream issuers exposed, verify the priority-ordered multi-issuer fix, and test PKCE-safe pre-consent downgrades.
- **Confirmed Constraints:** Use deterministic local `analyzeAudit` only; preserve `packages/engine/**`, `contracts/scope_bomb.schema.json`, and `data/scope_catalog.json`; preserve RFC 7009 nuances (`HTTP 200 OK != containment`), GitHub `DELETE /applications/{client_id}/grant`, and `safe_replacement_url: null` under live PKCE. No login walls, no backend APIs, no synthetic benchmarks.

## Direction contract

- **THESIS:** ScopeBomb renders OAuth and shadow-AI blast escalation as a calm porcelain-and-white forensic transit workbench (`framed-sheet` fused with 4-stage Boundary Transit Flow + Side A/B protocol containment diff), rejecting dark-slate neon dashboards and wall-of-boxes dumps.
- **OWN-WORLD:** `#f9fbfc` low-chroma slate-ice L-frame (`240px` sidebar + ruleless `48px` top bar) holding an inset `#ffffff` work sheet (`1px solid #e8eaec`, `16px` radius desktop, zero resting drop shadows); `IBM Plex Sans` (`400/500/600`) with tabular figures and `IBM Plex Mono` strictly inside `<code>`/`<pre>` for scopes, endpoints, keys, and curl payloads; single brand teal `--accent: #1b6c80` with semantic statuses strictly reserved for containment outcomes (`#c4242a` surviving breach, `#1e7b4f` verified contained, `#92400e` RFC 7009 warning).
- **STORY:** A first-time visitor reads a plain-English incident sentence on the first screen, sees in 1 glance how 1 token grant fans across 4 boundaries (`Personal -> Developer Local -> CI/CD -> Vendor`), flips once between `Naive Single Revoke` and `Multi-Issuer Plan` to watch red surviving paths turn green, inspects issuer steps or tests PKCE pre-consent downgrades, and sees clearly how Web Arena, Chrome Extension, and CLI share one deterministic engine.
- **FIRST VIEWPORT:** Fixed `240px` left sidebar (wordmark + 4 plain workspace views: `Simulator`, `Containment`, `PKCE Guard`, `How It Works` + 5 compact incident selector rows + pinned CLI snippet & GitHub link) joined seamlessly to a `48px` top bar with the active scenario title and `Naive / Multi-Issuer` simulation toggle; inside the inset white sheet sits the 22px H1 + plain-English 1-line summary, a 4-cell divided KPI strip (`Blast risk`, `Chain depth`, `Containment coverage`, `Persisting paths`), a compact custom input launcher (`OAuth URL`, `.mcp.json / .env`, `Takeout JSON`), and the 4-stage interactive Domino Transit Map (`Entry` -> `Scope & Secret` -> `Escalation Pivot` -> `Downstream Impact`) with grouped sibling expansion so the entire causal chain fits comfortably without overlapping spiderwebs.
- **FORM:** Candidate 5 from the grounded Operate derivation (Porcelain `framed-sheet` Developer Security Workbench + Boundary Transit Diagram; `design-taste-frontend` `framed-sheet` seed `548045554`; Impeccable `concept-seed` key `f2625470`, `operate`, with raised quarantined semantic chroma from Challenger 1, binary Held/Bypassed state clarity from Challenger 2, Side A/B mental flip from Challenger 3, junction wayfinding clarity from Challenger 4, dense left-index list from Challenger 5, and numeric step conflict delta from Challenger 6).
- **FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
