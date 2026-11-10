# ScopeBomb — <90s Live Demo Script

**Goal:** Judge understands and tests ScopeBomb end-to-end in under 90 seconds with zero setup or sign-in.

## Step 1 — Instant Trigger (`0:00 – 0:25`)
- **Action:** Load ScopeBomb Web Arena (`rohan_mcp_oauth_trap` pre-loaded, or paste any live Google/GitHub OAuth consent URL + drop `.mcp.json`/`.env`).
- **What Happens:** Deterministic engine parses `gmail.modify`, `drive`, GitHub `repo` + `workflow`, and an unrevoked `VERCEL_TOKEN` in `<50ms`.
- **Visual:** 4-hop **Blast-Radius Domino Graph** lights up across 4 trust boundaries (`personal` -> `developer_local` -> `ci_cd` -> `vendor`), showing exact exposed assets (Gmail OTP resets, `.github/workflows` RCE, production env vars).

## Step 2 — The RFC 7009 "HTTP 200 Trap" (`0:25 – 0:55`)
- **Action:** Click **"Simulate Naive Containment (Single RFC 7009 Revoke)"**.
- **What Happens:** Graph highlights `POST https://oauth2.googleapis.com/revoke` returning **`HTTP 200 OK`**, yet **65% of the blast graph pulses RED**:
  1. Access-token cascading is only RFC 7009 `SHOULD`; residual JWT TTL stays live.
  2. GitHub `workflow` backdoor (`repo` + `workflow`) & exfiltrated `VERCEL_TOKEN` live at **different issuers** — Google's `200 OK` didn't touch them.
  3. Attacker-minted persistence survives password reset.

## Step 3 — Ordered Multi-Issuer Containment + MV3 Guard (`0:55 – 1:25`)
- **Action 1:** Switch to **"Full Multi-Issuer Containment Plan"**.
- **What Happens:** All persisting paths turn **GREEN** via priority-ordered actions (GitHub `DELETE /applications/{client_id}/grant`, workflow audit, downstream Vercel/OpenAI key rotation at each issuer, API probe verifying `401 Unauthorized` beyond HTTP `200`).
- **Action 2:** Trigger Chrome MV3 Pre-Consent Guard preview against an over-scoped OAuth consent URL (`drive` + `mail.google.com` + `code_challenge`).
- **What Happens:** Extension intercepts **before** user clicks Allow (explaining why naive in-flight URL rewriting would break PKCE `code_challenge`), flags least-privilege downgrades (`drive.file`, `gmail.readonly`), and generates a clean replacement initiation URL.
