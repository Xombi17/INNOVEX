import { evaluatePreConsent, parseOAuthUrl } from "./engine/index.js";
import {
  ACTION_META,
  PKCE_TRANSACTION_NOTE,
  PROVIDER_LABELS,
  buildArenaDeepLink,
  buildCleanInitiationTemplate,
  getStoredArenaBaseUrl,
} from "./shared.js";

const params = new URLSearchParams(window.location.search);
const targetUrl = params.get("url") || "";
const sourceTabId = params.get("tabId");

const actionPill = document.getElementById("guard-action-pill");
const pkcePill = document.getElementById("guard-pkce-pill");
const headlineEl = document.getElementById("guard-headline");
const errorBox = document.getElementById("guard-error");
const detailsSection = document.getElementById("guard-details");
const openArenaLink = document.getElementById("open-arena-link");

const scoreEl = document.getElementById("guard-score");
const providerEl = document.getElementById("guard-provider");
const clientEl = document.getElementById("guard-client");
const redirectEl = document.getElementById("guard-redirect");
const pkceWarningEl = document.getElementById("guard-pkce-warning");
const flaggedListEl = document.getElementById("guard-flagged-list");
const recPillsEl = document.getElementById("guard-recommended-pills");
const cleanTemplateEl = document.getElementById("guard-clean-template");

const copyScopesBtn = document.getElementById("copy-scopes-btn");
const copyTemplateBtn = document.getElementById("copy-template-btn");
const backSafeBtn = document.getElementById("back-safe-btn");
const proceedBtn = document.getElementById("proceed-anyway-btn");

async function copyText(btn, value, doneLabel) {
  const original = btn.textContent;
  try {
    await navigator.clipboard.writeText(value);
    btn.textContent = doneLabel;
    setTimeout(() => {
      btn.textContent = original;
    }, 1500);
  } catch {
    btn.textContent = "Copy unavailable";
  }
}

function showError(msg) {
  actionPill.className = "pill badge-warn mono";
  actionPill.textContent = "INVALID URL";
  headlineEl.textContent = "Unable to evaluate intercepted OAuth URL";
  errorBox.textContent = msg;
  errorBox.classList.remove("hidden");
}

async function init() {
  const arenaBase = await getStoredArenaBaseUrl();

  if (!targetUrl.trim()) {
    openArenaLink.href = arenaBase;
    showError("No OAuth authorization URL parameter was supplied to the guard page.");
    return;
  }

  openArenaLink.href = buildArenaDeepLink(arenaBase, targetUrl);

  let parsed;
  let decision;
  try {
    parsed = parseOAuthUrl(targetUrl);
    decision = evaluatePreConsent(parsed);
  } catch (err) {
    showError(err instanceof Error ? err.message : "Malformed OAuth URL.");
    return;
  }

  const meta = ACTION_META[decision.action] ?? ACTION_META.WARN;
  actionPill.className = `pill ${meta.pillClass} mono`;
  actionPill.textContent = meta.label;

  pkcePill.textContent = decision.pkce_protected
    ? `PKCE ${parsed.code_challenge_method ?? "S256"} PRESENT`
    : "NO PKCE CHALLENGE";
  pkcePill.className = `pill ${decision.pkce_protected ? "badge-sky" : "badge-warn"} mono`;

  headlineEl.textContent =
    decision.action === "BLOCK_PRE_CONSENT"
      ? `Blocked High-Risk ${PROVIDER_LABELS[decision.provider]} Consent Before Handshake`
      : decision.action === "WARN"
        ? `Sensitive ${PROVIDER_LABELS[decision.provider]} Scopes Flagged Pre-Consent`
        : `${PROVIDER_LABELS[decision.provider]} Request Matches Least-Privilege Baseline`;

  scoreEl.textContent = `${decision.risk_score} / 100`;
  scoreEl.style.color =
    decision.risk_score >= 80
      ? "#c4242a"
      : decision.risk_score >= 45
        ? "#92400e"
        : "#1e7b4f";
  providerEl.textContent = PROVIDER_LABELS[decision.provider];
  clientEl.textContent = parsed.client_id ?? "unknown";
  redirectEl.textContent = `${parsed.redirect_uri ?? "unknown"}${parsed.access_type ? ` (${parsed.access_type})` : ""}`;
  pkceWarningEl.textContent = decision.pkce_protected ? PKCE_TRANSACTION_NOTE : decision.pkce_rewrite_warning;

  flaggedListEl.replaceChildren();
  if (decision.flagged_scopes.length === 0) {
    const empty = document.createElement("div");
    empty.className = "card-inner subtext";
    empty.textContent = "No high/critical scope downgrades required.";
    flaggedListEl.appendChild(empty);
  } else {
    for (const item of decision.flagged_scopes) {
      const row = document.createElement("div");
      row.className = "scope-row";

      const top = document.createElement("div");
      top.className = "row-between";

      const left = document.createElement("div");
      left.className = "row-gap";

      const sev = document.createElement("span");
      sev.className = `pill ${item.severity === "critical" ? "badge-block" : "badge-warn"} mono`;
      sev.textContent = item.severity.toUpperCase();

      const oldScope = document.createElement("span");
      oldScope.className = "scope-old mono";
      oldScope.textContent = item.scope_id;

      left.append(sev, oldScope);

      const arrowWrap = document.createElement("div");
      arrowWrap.className = "row-gap";
      const arrow = document.createElement("span");
      arrow.className = "subtext";
      arrow.textContent = "Downgrade →";
      const newScope = document.createElement("span");
      newScope.className = "scope-new mono";
      newScope.textContent = item.recommended_scope_id;
      arrowWrap.append(arrow, newScope);

      top.append(left, arrowWrap);

      const reason = document.createElement("div");
      reason.className = "subtext";
      reason.textContent = item.reason;

      row.append(top, reason);
      flaggedListEl.appendChild(row);
    }
  }

  recPillsEl.replaceChildren();
  for (const sc of decision.recommended_scopes) {
    const pill = document.createElement("span");
    pill.className = "scope-new mono";
    pill.textContent = sc;
    recPillsEl.appendChild(pill);
  }

  const template =
    decision.safe_replacement_url ??
    buildCleanInitiationTemplate(targetUrl, decision.recommended_scopes);
  cleanTemplateEl.textContent =
    template ?? "No scopes present to build a clean initiation template.";

  copyScopesBtn.addEventListener("click", () => {
    void copyText(copyScopesBtn, decision.recommended_scopes.join(" "), "Copied!");
  });

  if (template) {
    copyTemplateBtn.addEventListener("click", () => {
      void copyText(copyTemplateBtn, template, "Copied!");
    });
  } else {
    copyTemplateBtn.classList.add("hidden");
  }

  backSafeBtn.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.close();
    }
  });

  if (targetUrl) {
    proceedBtn.classList.remove("hidden");
    proceedBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage(
        {
          type: "BYPASS_ONCE",
          tabId: sourceTabId ? Number(sourceTabId) : undefined,
          url: targetUrl,
        },
        () => {
          window.location.href = targetUrl;
        },
      );
    });
  }

  detailsSection.classList.remove("hidden");
}

void init();

