# ScopeBomb

Review app permissions and project credentials, understand possible exposure, and plan provider-specific cleanup.

**Published demo:** https://scopebomb.vercel.app
**Track:** INNOVEX 2026 — PS 05 (AI-Powered Cybersecurity)

## Start with one task

1. Choose **Try an example** for a labeled, illustrative scenario, or **Check my configuration** to supply your own input.
2. Review **Found in input**, **Possible exposure**, and **Still unknown**. Each finding includes its source; placeholders and environment references are listed separately.
3. Follow a conditional exposure chain, then review the relevant provider’s actions. Technical details are optional.

ScopeBomb does not sign in to accounts, establish credential validity, detect active exploitation, execute cleanup, or independently verify containment. Marking an action done records your progress only. A full-plan preview is a projected outcome, not a measured security status. Scenarios are illustrative models, not forensic reconstructions.

## Inputs and data handling

| Input | Processing | What the result establishes |
| --- | --- | --- |
| `.env` / MCP JSON | Browser only; paste, choose file, or drop a text file | Recognized credential-like values and placeholders, with redacted values |
| OAuth authorization URL | Browser only for manually pasted input | Requested permissions, not approval or effective access |
| Grant-export JSON (advanced) | Browser only; requires supported scope records | Permissions described by the supplied records |
| Public GitHub repository | Server retrieves selected files at a pinned commit | Findings in inspected files, with explicit coverage and skipped files |

Repository review is limited to eight matching configuration/workflow files, 64 KiB per file, a bounded inventory and a 20-second upstream deadline. It excludes history, private content and effective runtime permissions. Empty or partial results are never a claim that the repository is clean.

The plain-English explanation works locally. **Optional AI prioritization** sends only input type, supported provider identifiers and counts after the user requests it. A configured Gemini/OpenAI model can reorder vetted facts; model-generated security claims are not accepted. No local input text, credentials, URLs, scopes or verification notes are sent to AI.

An extension deep link (`?oauth_url=`) initially sends that authorization URL to the web host. Intake removes it from the current address after parsing; this cannot remove the initial host request or its logs. The extension discloses this handoff.

## What the model means

- Severity scores come from fixed rules, not measured compromise probabilities.
- Graph nodes and counts describe conditional resources and consequences, not confirmed attacks or distinct exploitable paths.
- Revocation behavior depends on the provider. Google documents project-token invalidation with a possible propagation delay. Separately issued credentials, sessions, artifacts and copied data require separate review. See [Google’s revocation documentation](https://developers.google.com/identity/protocols/oauth2/web-server#tokenrevoke) and [RFC 7009](https://www.rfc-editor.org/rfc/rfc7009).
- GitHub app grant deletion uses `DELETE /applications/{client_id}/grant`, application-owner Basic authentication and an expected `204`. Account holders can remove an app through settings. See [GitHub’s authorization API](https://docs.github.com/en/rest/apps/oauth-applications#delete-an-app-authorization).
- PKCE links a secret verifier and challenge; scopes are not part of that hash. Scope review should trigger a fresh authorization transaction in the initiating client. Removing security parameters from a copied URL is not a secure client restart. See [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636.html).

## Local development

Requires Node 24 and Python 3 for contract verification and extension packaging.

```sh
cd apps/web
npm install
npm run dev
```

## Offline command line

From the cloned repository root:

```sh
node packages/engine/cli.ts /path/to/project
node packages/engine/cli.ts /path/to/project --json > audit-report.json
```

The CLI uses the deterministic engine and emits redacted reports. It does not verify live credential access.

## Chrome extension

Use the extension download in **Review actions → Prevent future overbroad app access**, or load `apps/extension` from this checkout:

1. Download/extract the bundle, or use the source folder.
2. Open `chrome://extensions` in desktop Chrome and enable Developer mode.
3. Choose **Load unpacked** and select the extension folder. Confirm it is enabled and inspect a supported URL through its popup.

The extension reviews supported Google, GitHub and Microsoft authorization pages. Downloading a zip or trying the website’s consent demonstration does not install or activate browser protection. The website cannot establish that the extension is installed.

```sh
node apps/extension/scripts/pack.mjs
```

## Verification

```sh
python3 contracts/verify_contracts.py
node --test tests/engine/*.test.ts
npm run test --prefix apps/web
npm run typecheck --prefix apps/web
npm run build --prefix apps/web
```

For reproducible browser checks and the five-participant human-study protocol, see [UX validation](docs/UX-VALIDATION.md). Automated checks do not establish user demand or replace testing with unfamiliar developers.
