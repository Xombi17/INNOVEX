export const DEFAULT_ARENA_URL = "https://scopebomb.vercel.app";

export const PROVIDER_LABELS = {
  google: "Google",
  github: "GitHub",
  microsoft: "Microsoft Entra",
  slack: "Slack",
  salesforce: "Salesforce",
  vercel: "Vercel",
  anthropic: "Anthropic",
  openai: "OpenAI",
  generic: "Generic OAuth",
};

export const ACTION_META = {
  BLOCK_PRE_CONSENT: {
    label: "BLOCKED PRE-CONSENT",
    badgeText: "BLOCK",
    badgeColor: "#c4242a",
    pillClass: "badge-block",
  },
  WARN: {
    label: "PRE-CONSENT WARNING",
    badgeText: "WARN",
    badgeColor: "#92400e",
    pillClass: "badge-warn",
  },
  ALLOW: {
    label: "NO CATALOG SCOPE WARNING",
    badgeText: "LOW",
    badgeColor: "#1e7b4f",
    pillClass: "badge-allow",
  },
};

export const SAMPLE_OAUTH_URLS = {
  google_pkce_trap:
    "https://accounts.google.com/o/oauth2/v2/auth?client_id=9481203-shadowai.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fscopebomb.vercel.app%2Foauth-callback&response_type=code&scope=https%3A%2F%2Fmail.google.com%2F%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&access_type=offline&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256&state=mv3_guard_demo",
  github_ci_trap:
    "https://github.com/login/oauth/authorize?client_id=178c6fc778ccc68e1d6a&scope=repo%20workflow%20admin:org&redirect_uri=http%3A%2F%2F127.0.0.1%3A0%2Fcallback&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256&state=gh_guard_demo",
  entra_app_admin:
    "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=legacy-test-oauth-app-001&response_type=code&redirect_uri=https%3A%2F%2Fscopebomb.vercel.app%2Fentra-callback&scope=Application.ReadWrite.All%20Mail.ReadWrite%20offline_access",
  google_safe_min:
    "https://accounts.google.com/o/oauth2/v2/auth?client_id=safe-login-app.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fscopebomb.vercel.app%2Foauth-callback&response_type=code&scope=openid%20email%20profile&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256&state=safe_demo",
};

export function isMonitoredOAuthUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== "https:") return false;
    if (u.hostname === "accounts.google.com" && u.pathname === "/o/oauth2/v2/auth") {
      return true;
    }
    if (u.hostname === "github.com" && u.pathname === "/login/oauth/authorize") {
      return true;
    }
    if (
      u.hostname === "login.microsoftonline.com" &&
      /^\/[^/]+\/oauth2\/v2\.0\/authorize$/.test(u.pathname)
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function normalizeArenaBaseUrl(raw) {
  const candidate = (raw || "").trim() || DEFAULT_ARENA_URL;
  try {
    const u = new URL(candidate);
    if (u.protocol === "http:" || u.protocol === "https:") {
      return u.origin + u.pathname.replace(/\/+$/, "");
    }
  } catch {
    // Fall back to default local arena URL if invalid
  }
  return DEFAULT_ARENA_URL;
}

export function buildArenaDeepLink(arenaBaseUrl, oauthUrl) {
  const base = normalizeArenaBaseUrl(arenaBaseUrl);
  return `${base}/?oauth_url=${encodeURIComponent(oauthUrl)}`;
}

export function buildCleanInitiationTemplate(rawUrl, recommendedScopes) {
  if (!rawUrl || !Array.isArray(recommendedScopes) || recommendedScopes.length === 0) {
    return null;
  }
  try {
    const clean = new URL(rawUrl);
    clean.searchParams.set("scope", recommendedScopes.join(" "));
    // Never retain stale PKCE code_challenge or state across scope changes.
    clean.searchParams.delete("code_challenge");
    clean.searchParams.delete("code_challenge_method");
    clean.searchParams.delete("state");
    return clean.toString();
  } catch {
    return null;
  }
}

export async function getStoredArenaBaseUrl() {
  try {
    const res = await chrome.storage.local.get(["arenaBaseUrl"]);
    return normalizeArenaBaseUrl(res?.arenaBaseUrl);
  } catch {
    return DEFAULT_ARENA_URL;
  }
}

export async function saveStoredArenaBaseUrl(raw) {
  const normalized = normalizeArenaBaseUrl(raw);
  try {
    await chrome.storage.local.set({ arenaBaseUrl: normalized });
  } catch {
    // Storage optional in standalone preview tests
  }
  return normalized;
}

