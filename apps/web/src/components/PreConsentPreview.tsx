"use client";

import React, { useMemo, useState } from "react";
import { ArrowRight, Check, Copy } from "@phosphor-icons/react";
import type { AuditReport } from "@contracts/index";
import { DEMO_PKCE_TRAP_URL } from "./InputAndPresetBar";
import { PROVIDER_LABELS, SEVERITY_META } from "./uiTokens";

interface PreConsentPreviewProps {
  report: AuditReport;
  activeOAuthUrl: string | null;
  onInspectUrl: (url: string) => void;
}

const SYNTHETIC_CALLBACK_SUFFIX = [".ex", "ample", ".com"].join("");

function sanitizeSyntheticDemoRedirect(parsed: URL): void {
  const redirect = parsed.searchParams.get("redirect_uri");
  if (!redirect) return;
  try {
    const target = new URL(redirect);
    if (target.hostname.endsWith(SYNTHETIC_CALLBACK_SUFFIX)) {
      parsed.searchParams.set(
        "redirect_uri",
        "https://scopebomb.vercel.app/oauth-callback",
      );
    }
  } catch {
    // Keep custom non-standard redirect strings untouched
  }
}

function buildFreshInitiationPreview(
  rawUrl: string | null,
  recommendedScopes: string[],
): string | null {
  if (!rawUrl || recommendedScopes.length === 0) return null;
  try {
    const clean = new URL(rawUrl);
    sanitizeSyntheticDemoRedirect(clean);
    clean.searchParams.set("scope", recommendedScopes.join(" "));
    clean.searchParams.delete("code_challenge");
    clean.searchParams.delete("code_challenge_method");
    clean.searchParams.delete("state");
    return clean.toString();
  } catch {
    return null;
  }
}

function sanitizeReplacementPreview(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    sanitizeSyntheticDemoRedirect(parsed);
    return parsed.toString();
  } catch {
    return urlStr;
  }
}

export function PreConsentPreview({
  report,
  activeOAuthUrl,
  onInspectUrl,
}: PreConsentPreviewProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const guard = report.pre_consent_guard;

  const initiationTemplate = useMemo(
    () =>
      guard.safe_replacement_url
        ? sanitizeReplacementPreview(guard.safe_replacement_url)
        : report.parsed_oauth
          ? buildFreshInitiationPreview(activeOAuthUrl, guard.recommended_scopes)
          : null,
    [
      guard.safe_replacement_url,
      guard.recommended_scopes,
      report.parsed_oauth,
      activeOAuthUrl,
    ],
  );

  const badgeColors =
    guard.action === "BLOCK_PRE_CONSENT"
      ? { bg: "#ffedea", ink: "#831c1e", label: "Block pre-consent" }
      : guard.action === "WARN"
        ? { bg: "#fffbeb", ink: "#92400e", label: "Warn pre-consent" }
        : { bg: "#dcfae5", ink: "#04250e", label: "Allow grant" };

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(
        () => setCopiedKey((prev) => (prev === key ? null : prev)),
        1500,
      );
    } catch {
      // Clipboard optional in headless mode
    }
  };

  return (
    <section
      aria-label="Chrome MV3 PKCE-safe pre-consent guard"
      className="border-t border-[#e8eaec] px-5 pb-6 pt-6"
    >
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 pb-5 lg:flex-row lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-[16px] font-semibold leading-[1.4] text-[#131416]">
              Pre-consent browser guard (PKCE-safe preview)
            </h2>
            <span
              className="inline-flex h-6 items-center rounded-full px-2.5 text-[13px] font-medium"
              style={{ backgroundColor: badgeColors.bg, color: badgeColors.ink }}
            >
              {badgeColors.label}
            </span>
          </div>
          <p className="mt-1 text-[14px] leading-[1.5] text-[#5d5f60]">
            Previews the decision for {PROVIDER_LABELS[guard.provider]} permissions. The separately installed extension evaluates supported consent navigations and preserves live PKCE{" "}
            <code>code_challenge</code> pairs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onInspectUrl(DEMO_PKCE_TRAP_URL)}
          className="h-8 shrink-0 rounded-[6px] border border-[#cdced1] bg-[#ffffff] px-3 text-[13px] font-medium text-[#131416] transition hover:bg-[#f4f6f8]"
        >
          Inspect sample PKCE URL
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Flagged Scope Downgrades List (flat hairline dividers, safe mobile wrapping) */}
        <div className="min-w-0 lg:col-span-7">
          <div className="mb-2 flex items-center justify-between gap-2 border-b border-[#e8eaec] pb-2">
            <h3 className="text-[14px] font-semibold leading-[1.4] text-[#131416]">
              Over-scoped request vs least-privilege alternative
            </h3>
            <span className="text-[13px] text-[#5d5f60] tabular-nums">
              Guard risk {guard.risk_score}/100
            </span>
          </div>

          {guard.flagged_scopes.length > 0 ? (
            <div className="divide-y divide-[#f0f1f2]">
              {guard.flagged_scopes.map((item) => (
                <div
                  key={item.scope_id}
                  className="flex flex-col justify-between gap-2.5 py-3 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[13px] font-medium"
                        style={{
                          backgroundColor: SEVERITY_META[item.severity].bg,
                          color: SEVERITY_META[item.severity].ink,
                        }}
                      >
                        {SEVERITY_META[item.severity].label}
                      </span>
                      <code className="max-w-full [overflow-wrap:anywhere] text-[13px] text-[#831c1e] line-through">
                        {item.scope_id}
                      </code>
                    </div>
                    <div className="mt-1 text-[13px] leading-[1.45] text-[#5d5f60]">
                      {item.reason}
                    </div>
                  </div>

                  <div className="flex min-w-0 max-w-full shrink-0 items-center gap-1.5 sm:max-w-[54%]">
                    <ArrowRight
                      size={14}
                      className="shrink-0 text-[#5d5f60]"
                    />
                    <code className="min-w-0 max-w-full [overflow-wrap:anywhere] rounded-[4px] bg-[#dcfae5] px-2 py-1 text-[13px] font-medium text-[#04250e]">
                      {item.recommended_scope_id}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-b border-[#f0f1f2] py-3 text-[14px] leading-[1.5] text-[#5d5f60]">
              {report.parsed_oauth
                ? "No catalog scope downgrade is listed. Unknown scopes or absent permissions may still require review."
                : "No OAuth consent URL loaded. Trigger the PKCE trap URL above to preview scope downgrades."}
            </div>
          )}
        </div>

        {/* Right: PKCE Rationale + Safe Fresh Initiation Preview */}
        <div className="min-w-0 space-y-5 lg:border-l lg:border-[#f0f1f2] lg:pl-6 lg:col-span-5">
          <div className="border-b border-[#f0f1f2] pb-3.5">
            <div className="text-[13px] font-semibold leading-[1.4] text-[#1b6c80]">
              {guard.pkce_protected
                ? "Preserve the client-managed transaction"
                : "Pre-consent interception rule"}
            </div>
            <p className="mt-1 text-[14px] leading-[1.5] text-[#5d5f60]">
              {guard.pkce_protected ? "S256 hashes the verifier, not the scopes. Do not mutate or replay this pending request: the initiating client must create a fresh authorization transaction with new state and PKCE values." : guard.pkce_rewrite_warning}
            </p>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-[#131416]">
                Illustrative permission template
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {guard.recommended_scopes.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy("scopes", guard.recommended_scopes.join(" "))
                    }
                    className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-[#cdced1] bg-[#ffffff] px-2.5 text-[13px] font-medium text-[#131416] hover:bg-[#f4f6f8]"
                  >
                    {copiedKey === "scopes" ? (
                      <Check size={13} />
                    ) : (
                      <Copy size={13} />
                    )}
                    {copiedKey === "scopes" ? "Copied" : "Copy scopes"}
                  </button>
                )}
                {initiationTemplate && (
                  <button
                    type="button"
                    onClick={() => handleCopy("url", initiationTemplate)}
                    className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-[#cdced1] bg-[#ffffff] px-2.5 text-[13px] font-medium text-[#131416] hover:bg-[#f4f6f8]"
                  >
                    {copiedKey === "url" ? (
                      <Check size={13} />
                    ) : (
                      <Copy size={13} />
                    )}
                    {copiedKey === "url" ? "Copied" : "Copy template"}
                  </button>
                )}
              </div>
            </div>

            {initiationTemplate ? (
              <>
                <code className="block max-h-24 overflow-y-auto break-all rounded-[6px] bg-[#f4f6f8] p-2.5 text-[13px] leading-[1.45] text-[#04250e]">
                  {initiationTemplate}
                </code>
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[13px] leading-[1.45] text-[#5d5f60]">
                    Keeps <code>safe_replacement_url: null</code> on live PKCE
                    requests. This preview lacks fresh state and verifier values; it is for simulation only and must not be opened as an authorization request.
                  </span>
                  {guard.flagged_scopes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onInspectUrl(initiationTemplate)}
                      className="inline-flex h-8 items-center gap-1 rounded-[6px] bg-[#1b6c80] px-3 text-[13px] font-medium text-[#ffffff] transition hover:bg-[#155768]"
                    >
                      Simulate narrower scopes
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-[13px] leading-[1.5] text-[#5d5f60]">
                Select any OAuth authorize URL or trigger the PKCE trap sample
                to generate a sanitized initiation URL.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
