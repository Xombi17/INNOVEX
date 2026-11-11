# ScopeBomb

ScopeBomb models potential OAuth and developer-credential exposure, compares a single-issuer revoke with a multi-issuer cleanup plan, and previews permission decisions before consent. Built for INNOVEX 2026, PS 05.

The documented production URL is https://scopebomb.vercel.app. Changes on `fix/v11-release` require review and deployment before that URL represents this revision.

## Three tools

- **Web Arena:** Check pasted authorization links, MCP/environment configs, supported Takeout JSON, or five illustrative incident presets. Follow **Check input → Understand exposure → Review actions**.
- **Chrome MV3 extension:** Separately install the unpacked extension to evaluate supported Google, GitHub and Microsoft Entra consent navigations. High-risk requests redirect to a guard page. Its Arena button sends the original authorization URL via `?oauth_url=`.
- **Local CLI:** Run `node packages/engine/cli.ts /path/to/project --json` on Node 24 to scan local configuration and emit a completely redacted report. See `packages/engine/README.md` for supported layouts and scan limits.

The pure, zero-dependency TypeScript engine is shared by all three. `contracts/scope_bomb.schema.json`, `contracts/index.d.ts`, and `data/scope_catalog.json` remain frozen. Core analysis is deterministic; optional web AI explanations are separate and do not change `AuditReport.ai_explainer_used`.

## Privacy and limits

Pasted configuration is parsed in browser memory; credential values are not uploaded. Placeholders and environment references are listed separately from credential-like findings. Detection is heuristic and cannot establish validity, effective permissions or compromise.

`POST /api/scan-repo` accepts public `owner/repo` identifiers or exact HTTPS GitHub repository URLs. It retrieves a revision-pinned tree (at most 1 MB), then at most **8 selected MCP/env/workflow files**, with a **64 KiB streaming limit per file** and **8-second overall fetch deadline**. Redirects are rejected. Its response contains redacted reports, evidence and coverage, never raw file contents. Skipped files and truncated trees are disclosed; history and other files are not inspected. A zero-finding result is not a clean bill of health.

The optional **Request AI explanation** button sends only bounded counts and recognized provider/boundary names. URLs, key names, free-form labels, scopes and file contents are excluded. Server-only `GEMINI_API_KEY` or `OPENAI_API_KEY` enables inference; missing keys, upstream failures or malformed model output use a complete deterministic fallback with honest attribution. No model call occurs on page load. Live AI text should still be reviewed against the evidence.

## Protocol accuracy

- RFC 7009 HTTP 200 is not proof of containment: invalid tokens also receive 200, and access-token cascading is SHOULD. Provider-specific behavior still matters.
- GitHub OAuth grant deletion uses `DELETE /applications/{client_id}/grant`, app-owner Basic authentication, a JSON access-token body, and a 204 success response. Independent PATs require separate revocation.
- PKCE S256 hashes the verifier, not the scopes. ScopeBomb preserves pending transactions. Permission changes require fresh client-managed state and PKCE values; displayed URL templates are incomplete simulation material and must not be opened as live authorization requests.
- All cleanup outcomes are conditional simulations. No revocations, key rotations or verification probes are executed. Status alone is insufficient evidence: inspect provider error details, propagation and residual access. Independent static keys do not share an assumed JWT expiry. Illustrative TTLs are not measured expiry, and already-copied data cannot be recovered.

## Run and verify

Requires Node 24. Install web dependencies with `npm ci` inside `apps/web`, then `npm run dev`.

```sh
node --test tests/engine/*.test.ts
npm test --prefix apps/web
npm test --prefix apps/extension
npm run typecheck --prefix apps/web
npm run build --prefix apps/web
npm run pack --prefix apps/extension
unzip -t apps/web/public/downloads/scopebomb-mv3-extension.zip
python3 contracts/verify_contracts.py
```

On hosts that restrict Turbopack CSS worker sockets, use the supported alternative `npm run build --prefix apps/web -- --webpack`. Extension packaging requires Python 3 and emits a reproducible ZIP; the committed download avoids needing Python in the Vercel build.

To install the extension: download/unzip `apps/web/public/downloads/scopebomb-mv3-extension.zip`, open `chrome://extensions`, enable Developer mode, then choose **Load unpacked** and the extracted folder. Browser consent monitoring requires this installation; the web sandbox is educational and keeps the current audit intact.

## 90-second demo

1. Select an illustrative incident or inspect your own permission link/config. Read the source label and evidence.
2. Open Understand exposure and compare modeled survivors after one revoke and a full plan.
3. Open Review actions, expand provider commands and verification notes, then run the fake-consent sandbox. Narrower permissions are re-evaluated with actual engine counts, not a hardcoded safety claim.

Preset classifications and historical framing come from the catalog. Potential graph nodes are not distinct observed attack paths or proof of exploitation. See `.planning/V11-RELEASE-REVIEW.md` for this revision's checks and outstanding release steps.
