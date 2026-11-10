import { evaluatePreConsent, parseOAuthUrl } from "./engine/index.js";
import { ACTION_META, isMonitoredOAuthUrl } from "./shared.js";

const BYPASS_TTL_MS = 60_000;
const memoryBypass = new Map();
const recentTabNav = new Map();

function bypassKey(tabId) {
  return `bypass_${tabId}`;
}

async function setBypassOnce(tabId, url) {
  const entry = { url, expiresAt: Date.now() + BYPASS_TTL_MS };
  memoryBypass.set(tabId, entry);
  try {
    if (chrome.storage?.session) {
      await chrome.storage.session.set({ [bypassKey(tabId)]: entry });
    }
  } catch {
    // Fallback to in-memory map only
  }
}

async function isBypassed(tabId, url) {
  const now = Date.now();
  let entry = memoryBypass.get(tabId);
  if (!entry) {
    try {
      if (chrome.storage?.session) {
        const stored = await chrome.storage.session.get([bypassKey(tabId)]);
        entry = stored?.[bypassKey(tabId)];
      }
    } catch {
      // Ignore session storage errors
    }
  }
  if (!entry) return false;
  if (entry.expiresAt < now || entry.url !== url) {
    memoryBypass.delete(tabId);
    try {
      await chrome.storage?.session?.remove(bypassKey(tabId));
    } catch {
      // Ignore
    }
    return false;
  }
  return true;
}

function safeEvaluate(url) {
  const parsed = parseOAuthUrl(url);
  const decision = evaluatePreConsent(parsed);
  return { parsed, decision };
}

async function setBadge(tabId, action) {
  const meta = ACTION_META[action] ?? ACTION_META.WARN;
  try {
    await chrome.action.setBadgeText({ tabId, text: meta.badgeText });
    await chrome.action.setBadgeBackgroundColor({ tabId, color: meta.badgeColor });
  } catch {
    // Tab may have closed
  }
}

async function handleMonitoredNavigation(tabId, url) {
  if (!tabId || tabId < 0 || !isMonitoredOAuthUrl(url)) return;

  const prev = recentTabNav.get(tabId);
  if (prev && prev.url === url && Date.now() - prev.ts < 800) {
    return;
  }
  recentTabNav.set(tabId, { url, ts: Date.now() });

  let evaluation;
  try {
    evaluation = safeEvaluate(url);
  } catch (err) {
    try {
      await chrome.storage.local.set({
        lastIntercepted: {
          url,
          error: err instanceof Error ? err.message : "Invalid OAuth URL",
          interceptedAt: Date.now(),
        },
      });
    } catch {
      // Ignore storage errors
    }
    return;
  }

  const { parsed, decision } = evaluation;
  await setBadge(tabId, decision.action);

  try {
    await chrome.storage.local.set({
      lastIntercepted: {
        url,
        parsed,
        decision,
        interceptedAt: Date.now(),
      },
    });
  } catch {
    // Ignore storage errors
  }

  const bypassed = await isBypassed(tabId, url);
  if (decision.action === "BLOCK_PRE_CONSENT" && !bypassed) {
    const guardUrl = chrome.runtime.getURL(
      `guard.html?url=${encodeURIComponent(url)}&tabId=${encodeURIComponent(String(tabId))}`,
    );
    try {
      await chrome.tabs.update(tabId, { url: guardUrl });
    } catch {
      // Tab may no longer exist
    }
  }
}

chrome.webNavigation.onBeforeNavigate.addListener(
  (details) => {
    if (details.frameId !== 0) return;
    void handleMonitoredNavigation(details.tabId, details.url);
  },
  {
    url: [
      { hostEquals: "accounts.google.com", pathEquals: "/o/oauth2/v2/auth" },
      { hostEquals: "github.com", pathEquals: "/login/oauth/authorize" },
      { hostEquals: "login.microsoftonline.com", pathContains: "/oauth2/v2.0/authorize" },
    ],
  },
);

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url && isMonitoredOAuthUrl(changeInfo.url)) {
    void handleMonitoredNavigation(tabId, changeInfo.url);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  memoryBypass.delete(tabId);
  recentTabNav.delete(tabId);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") return false;

  if (message.type === "EVALUATE_OAUTH_URL") {
    const url = typeof message.url === "string" ? message.url : "";
    const tabId = sender.tab?.id ?? -1;
    (async () => {
      try {
        const { parsed, decision } = safeEvaluate(url);
        const bypassed = tabId >= 0 ? await isBypassed(tabId, url) : false;
        if (tabId >= 0) await setBadge(tabId, decision.action);
        sendResponse({ ok: true, parsed, decision, bypassed });
      } catch (err) {
        sendResponse({
          ok: false,
          error: err instanceof Error ? err.message : "Failed to parse OAuth URL.",
        });
      }
    })();
    return true;
  }

  if (message.type === "BYPASS_ONCE") {
    const rawTabId = Number(message.tabId);
    const tabId = Number.isInteger(rawTabId) && rawTabId >= 0 ? rawTabId : (sender.tab?.id ?? -1);
    const url = typeof message.url === "string" ? message.url : "";
    (async () => {
      if (tabId >= 0 && url) {
        await setBypassOnce(tabId, url);
      }
      sendResponse({ ok: true });
    })();
    return true;
  }

  if (message.type === "OPEN_GUARD") {
    const url = typeof message.url === "string" ? message.url : "";
    const guardUrl = chrome.runtime.getURL(`guard.html?url=${encodeURIComponent(url)}`);
    chrome.tabs.create({ url: guardUrl }).then(
      () => sendResponse({ ok: true }),
      () => sendResponse({ ok: false }),
    );
    return true;
  }

  return false;
});
