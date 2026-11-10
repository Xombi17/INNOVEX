# Scoped Requirements (v1.0.0)

- **REQ-01 (Parser):** Parse Google/GitHub/Microsoft OAuth URLs, `.mcp.json`/`.env` key patterns (masked previews), Takeout grant snippets, and 5 real incident presets per `contracts/scope_bomb.schema.json`.
- **REQ-02 (Blast Graph):** Deterministically build multi-hop trust-boundary Domino graphs across `personal`, `developer_local`, `vendor`, `ci_cd`, `enterprise_tenant`.
- **REQ-03 (RFC 7009 Simulator):** Compare `naive_single_revoke` (showing HTTP 200 trap + residual JWT TTL + cross-issuer persistence) vs. `full_multi_issuer` ordered remediation & API probes.
- **REQ-04 (MV3 Guard):** Pre-consent interception flagging over-scoped permissions without corrupting PKCE `code_challenge`, outputting least-privilege alternatives.
- **REQ-05 (Live Judge UI):** `<90s` interactive Web Arena deployable to Vercel with no login wall (`DEMO_SCRIPT.md`).
