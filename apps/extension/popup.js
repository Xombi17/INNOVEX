import { evaluatePreConsent, parseOAuthUrl } from "./engine/index.js";
import {
  ACTION_META,
  PROVIDER_LABELS,
  SAMPLE_OAUTH_URLS,
  buildArenaDeepLink,
  getStoredArenaBaseUrl,
  isMonitoredOAuthUrl,
  saveStoredArenaBaseUrl,
} from "./shared.js";

const urlInput = document.getElementById("popup-url-input");
const analyzeBtn = document.getElementById("analyze-url-btn");
const activeTabBtn = document.getElementById("use-active-tab-btn");
const errorBox = document.getElementById("popup-error");
const resultCard = document.getElementById("popup-result");

const actionPill = document.getElementById("res-action-pill");
const pkcePill = document.getElementById("res-pkce-pill");
const scoreEl = document.getElementById("res-score");
const providerLine = document.getElementById("res-provider-line");
const pkceNote = document.getElementById("res-pkce-note");
const flaggedList = document.getElementById("res-flagged-list");
const openGuardBtn = document.getElementById("open-guard-btn");
const arenaLink = document.getElementById("popup-arena-link");

const toggleSettingsBtn = document.getElementById("toggle-settings-btn");
const settingsPanel = document.getElementById("arena-settings");
const arenaUrlInput = document.getElementById("arena-url-input");
const saveArenaBtn = document.getElementById("save-arena-btn");

let currentArenaBaseUrl = "http://localhost:3000";
let currentEvaluatedUrl = SAMPLE_OAUTH_URLS.google_pkce_trap;

function renderError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
  resultCard.classList.add("hidden");
}

function evaluateAndRender(rawUrl) {
  const candidate = (rawUrl || "").trim();
  urlInput.value = candidate;
  errorBox.classList.add("hidden");

  let parsed;
  let decision;
  try {
    parsed = parseOAuthUrl(candidate);
    decision = evaluatePreConsent(parsed);
  } catch (err) {
    renderError(err instanceof Error ? err.message : "Invalid OAuth authorization URL.");
    return;
  }

  currentEvaluatedUrl = candidate;

  const meta = ACTION_META[decision.action] ?? ACTION_META.WARN;
  actionPill.className = `pill ${meta.pillClass} mono`;
  actionPill.textContent = meta.badgeText;

  pkcePill.textContent = decision.pkce_protected
    ? `PKCE ${parsed.code_challenge_method ?? "S256"}`
    : "NO PKCE";
  pkcePill.className = `pill ${decision.pkce_protected ? "badge-sky" : "badge-warn"} mono`;

  scoreEl.textContent = `${decision.risk_score} / 100`;
  scoreEl.style.color =
    decision.risk_score >= 80
      ? "#fda4af"
      : decision.risk_score >= 45
        ? "#fcd34d"
        : "#6ee7b7";

  providerLine.textContent = `${PROVIDER_LABELS[decision.provider]} · client: ${parsed.client_id ?? "unknown"}${parsed.access_type ? ` · ${parsed.access_type}` : ""}`;
  pkceNote.textContent = decision.pkce_rewrite_warning;

  flaggedList.replaceChildren();
  if (decision.flagged_scopes.length === 0) {
    const clean = document.createElement("div");
    clean.className = "card-inner subtext";
    clean.textContent =
      decision.recommended_scopes.length > 0
        ? `Least-privilege baseline verified (${decision.recommended_scopes.join(", ")}).`
        : "No flagged scopes detected.";
    flaggedList.appendChild(clean);
  } else {
    for (const item of decision.flagged_scopes) {
      const row = document.createElement("div");
      row.className = "scope-row";

      const oldEl = document.createElement("div");
      oldEl.className = "scope-old mono";
      oldEl.textContent = `[${item.severity.toUpperCase()}] ${item.scope_id}`;

      const newEl = document.createElement("div");
      const arrow = document.createElement("span");
      arrow.className = "subtext";
      arrow.textContent = "Downgrade → ";
      const pill = document.createElement("span");
      pill.className = "scope-new mono";
      pill.textContent = item.recommended_scope_id;
      newEl.append(arrow, pill);

      row.append(oldEl, newEl);
      flaggedList.appendChild(row);
    }
  }

  arenaLink.href = buildArenaDeepLink(currentArenaBaseUrl, candidate);
  resultCard.classList.remove("hidden");
}

async function init() {
  currentArenaBaseUrl = await getStoredArenaBaseUrl();
  arenaUrlInput.value = currentArenaBaseUrl;

  toggleSettingsBtn.addEventListener("click", () => {
    settingsPanel.classList.toggle("hidden");
  });

  saveArenaBtn.addEventListener("click", async () => {
    currentArenaBaseUrl = await saveStoredArenaBaseUrl(arenaUrlInput.value);
    arenaUrlInput.value = currentArenaBaseUrl;
    arenaLink.href = buildArenaDeepLink(currentArenaBaseUrl, currentEvaluatedUrl);
    saveArenaBtn.textContent = "Saved!";
    setTimeout(() => {
      saveArenaBtn.textContent = "Save";
    }, 1200);
  });

  analyzeBtn.addEventListener("click", () => {
    evaluateAndRender(urlInput.value);
  });

  for (const btn of document.querySelectorAll(".sample-btn")) {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-sample");
      if (key && SAMPLE_OAUTH_URLS[key]) {
        evaluateAndRender(SAMPLE_OAUTH_URLS[key]);
      }
    });
  }

  openGuardBtn.addEventListener("click", () => {
    const guardUrl = chrome.runtime.getURL(
      `guard.html?url=${encodeURIComponent(currentEvaluatedUrl)}`,
    );
    chrome.tabs.create({ url: guardUrl });
  });

  activeTabBtn.addEventListener("click", async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url && /^https?:\/\//.test(tab.url)) {
        if (tab.url.startsWith(chrome.runtime.getURL("guard.html"))) {
          const inner = new URL(tab.url).searchParams.get("url");
          if (inner) {
            evaluateAndRender(inner);
            return;
          }
        }
        evaluateAndRender(tab.url);
      } else {
        renderError("Active tab does not contain an HTTP(S) OAuth URL.");
      }
    } catch {
      renderError("Unable to inspect active tab URL.");
    }
  });

  // Auto-load active tab OAuth URL, last intercepted URL, or Google PKCE trap demo.
  let initialUrl = SAMPLE_OAUTH_URLS.google_pkce_trap;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url?.startsWith(chrome.runtime.getURL("guard.html"))) {
      const inner = new URL(tab.url).searchParams.get("url");
      if (inner) initialUrl = inner;
    } else if (tab?.url && isMonitoredOAuthUrl(tab.url)) {
      initialUrl = tab.url;
    } else {
      const stored = await chrome.storage.local.get(["lastIntercepted"]);
      if (stored?.lastIntercepted?.url) {
        initialUrl = stored.lastIntercepted.url;
      }
    }
  } catch {
    // Running standalone or storage unavailable — keep sample default
  }

  evaluateAndRender(initialUrl);
}

void init();

