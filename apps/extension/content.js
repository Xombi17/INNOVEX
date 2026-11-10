(() => {
  if (window.top !== window.self) return;

  const BANNER_HOST_ID = "scopebomb-preconsent-host";

  function createEl(tag, styles, text) {
    const el = document.createElement(tag);
    if (styles) Object.assign(el.style, styles);
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function renderBanner(evaluation, currentUrl, arenaBaseUrl) {
    const { decision, bypassed } = evaluation;
    if (decision.action === "ALLOW" && !bypassed) return;
    if (document.getElementById(BANNER_HOST_ID)) return;

    const host = document.createElement("div");
    host.id = BANNER_HOST_ID;
    host.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:2147483647;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;";

    const shadow = host.attachShadow({ mode: "closed" });
    const bar = createEl("div", {
      background:
        decision.action === "BLOCK_PRE_CONSENT"
          ? "linear-gradient(90deg,#3b0718,#190913)"
          : "linear-gradient(90deg,#2a1805,#13100a)",
      color: "#f8fafc",
      borderBottom:
        decision.action === "BLOCK_PRE_CONSENT"
          ? "2px solid #f43f5e"
          : "2px solid #f59e0b",
      padding: "10px 16px",
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "10px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
      fontSize: "12px",
    });

    const left = createEl("div", {
      display: "flex",
      flexDirection: "column",
      gap: "3px",
      maxWidth: "780px",
    });

    const titleRow = createEl("div", {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "8px",
    });

    const badge = createEl(
      "span",
      {
        background: decision.action === "BLOCK_PRE_CONSENT" ? "#e11d48" : "#d97706",
        color: "#ffffff",
        fontWeight: "700",
        padding: "2px 7px",
        borderRadius: "4px",
        fontSize: "10px",
        letterSpacing: "0.04em",
      },
      `SCOPEBOMB ${decision.action} · RISK ${decision.risk_score}/100`,
    );

    const headline = createEl(
      "strong",
      { color: "#f8fafc", fontSize: "12px" },
      bypassed
        ? "Bypassed pre-consent block — review flagged scopes before clicking Allow."
        : "Over-scoped OAuth consent detected before authorization.",
    );

    titleRow.append(badge, headline);

    const downgrades =
      decision.flagged_scopes.length > 0
        ? decision.flagged_scopes
            .map((s) => `${s.scope_id} -> ${s.recommended_scope_id}`)
            .join(" | ")
        : "Review requested scopes before consenting.";

    const sub = createEl(
      "div",
      { color: "#cbd5e1", fontSize: "11px", lineHeight: "1.4" },
      `${decision.pkce_protected ? "PKCE detected: mid-flight scope rewriting breaks code_challenge. " : ""}${downgrades}`,
    );

    left.append(titleRow, sub);

    const actions = createEl("div", {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "8px",
    });

    const guardBtn = createEl(
      "button",
      {
        background: "#1e293b",
        color: "#e2e8f0",
        border: "1px solid #475569",
        borderRadius: "6px",
        padding: "6px 10px",
        fontSize: "11px",
        fontWeight: "600",
        cursor: "pointer",
      },
      "Open Guard Details",
    );
    guardBtn.type = "button";
    guardBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "OPEN_GUARD", url: currentUrl });
    });

    const arenaLink = createEl(
      "a",
      {
        background: "#0284c7",
        color: "#ffffff",
        textDecoration: "none",
        borderRadius: "6px",
        padding: "6px 10px",
        fontSize: "11px",
        fontWeight: "600",
      },
      "Open in ScopeBomb Arena ↗",
    );
    arenaLink.href = `${arenaBaseUrl.replace(/\/+$/, "")}/?oauth_url=${encodeURIComponent(currentUrl)}`;
    arenaLink.target = "_blank";
    arenaLink.rel = "noopener noreferrer";

    const dismissBtn = createEl(
      "button",
      {
        background: "transparent",
        color: "#94a3b8",
        border: "1px solid #334155",
        borderRadius: "6px",
        padding: "5px 8px",
        fontSize: "11px",
        cursor: "pointer",
      },
      "Dismiss",
    );
    dismissBtn.type = "button";
    dismissBtn.addEventListener("click", () => host.remove());

    actions.append(guardBtn, arenaLink, dismissBtn);
    bar.append(left, actions);
    shadow.append(bar);

    const attach = () => {
      (document.body || document.documentElement).prepend(host);
    };
    if (document.body || document.documentElement) {
      attach();
    } else {
      window.addEventListener("DOMContentLoaded", attach, { once: true });
    }
  }

  const currentUrl = window.location.href;
  chrome.runtime.sendMessage({ type: "EVALUATE_OAUTH_URL", url: currentUrl }, (res) => {
    if (chrome.runtime.lastError || !res || !res.ok) return;
    chrome.storage.local.get(["arenaBaseUrl"], (stored) => {
      const base =
        typeof stored?.arenaBaseUrl === "string" && stored.arenaBaseUrl.trim()
          ? stored.arenaBaseUrl.trim()
          : "https://scopebomb.vercel.app";
      renderBanner(res, currentUrl, base);
    });
  });
})();

