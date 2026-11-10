# ScopeBomb engine

Zero npm dependencies; pure TypeScript ESM. Import `index.ts` directly on Node 24 or through a Next.js / MV3 TypeScript bundler. Runtime code uses no Node-specific APIs, filesystem access, network calls, clocks, or randomness. The frozen JSON catalog is imported with `with { type: "json" }`.

```ts
import { analyzeAudit } from "./packages/engine/index.ts";

const report = analyzeAudit({
  mode: "incident_preset",
  preset_id: "rohan_mcp_oauth_trap",
  raw_payload: "",
  simulation_mode: "naive_single_revoke",
});
```

`analyzeAudit(AuditInput)` returns the frozen `AuditReport`, always including both containment outcomes. `simulation_mode` is validated; consumers select which outcome to display. No raw config credential values leave the parser, including in errors. Reports redact complete values rather than displaying secret fragments.

Inputs are bounded to 1,000,000 characters, 64 JSON levels, 10,000 JSON containers, 256 unique scopes per grant, 128 Takeout grants, and 256 detected credentials per config. Malformed input throws a sanitized `Error`.

Reusable exports:

- `parseOAuthUrl(url)` → `ParsedOAuthParams`; exact authorization host/path matching, repeated scopes merged, no challenge/state values retained.
- `parseMcpConfig(text)` → masked `ShadowSecretFinding[]`; nested MCP/IDE JSON, authorization headers, `.env` exports/quotes/comments/multiline quoted keys, and service-account JSON. Environment references are not resolved. JSON comments and executable config files are not supported.
- `parseTakeout(json)` → all grants found in nested objects/arrays with `scope`, `scopes`, or `requested_scopes` strings/string arrays. Accepts `client_id`/`clientId`; defaults to Google unless `provider` is explicit. Other export layouts fail rather than invent grants.
- `parseAuditInput(input)` → normalized grants, redacted secrets, and catalog preset framing. All five frozen preset IDs work through `preset_id` or `raw_payload`.
- `buildBlastGraph(parsed)` → stable node/edge IDs, ordered multi-hop paths, conditional catalog capabilities and independent config exposure. Local PAT permissions are unknown unless supplied as OAuth scopes; a Google grant alone does not establish local file access.
- `simulateContainment(graph, parsed, mode)` → ordered issuer-specific actions and authentication probes. The identity is excluded from containment sets and ratios. A naive revoke affects only the first grant. `rfc7009_http_status_returned: 0` means no RFC 7009 response applies; GitHub DELETE uses 204, OAuth app credentials and an access-token JSON body. PATs require separate key revocation.
- `evaluatePreConsent(urlOrParsedParams)` → allow/warn/block plus scope recommendations. Unknown capabilities warn. A detected challenge is not cryptographically verified. No pending request is mutated; `safe_replacement_url` is null because only the initiating client can create a fresh state/verifier transaction.

For multiple Takeout grants, the contract's singular `parsed_oauth` and guard `provider` describe the first grant. Graphs, risk, flagged/recommended scopes, PKCE presence and full containment cover every grant. Evaluate each grant separately when initiating new authorization requests; do not combine cross-provider recommendations into one request.

Graph paths describe possible access, not observed compromise. The naive outcome assumes successful revocation of the first grant, independent of HTTP status. Residual TTLs are illustrative (3600 seconds, or 5400 for Entra), not measured expiry. Full containment projects successful completion of **all** actions, issuer discovery, token expiry and authentication probes; it cannot recover already copied data. No actions or probes are executed.

Checks from the repository root:

```sh
node --test
python3 contracts/verify_contracts.py
graphify update .
```
