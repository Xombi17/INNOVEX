"use client";

import React, { useMemo, useState } from "react";
import type { AuditReport } from "@contracts/index";
import { DEMO_PKCE_TRAP_URL } from "./InputAndPresetBar";
import { PROVIDER_LABELS, SEVERITY_META } from "./uiTokens";

interface PreConsentPreviewProps {
  report: AuditReport;
  activeOAuthUrl: string | null;
  onInspectUrl: (url: string) => void;
}

function buildFreshInitiationPreview(
  rawUrl: string | null,
  recommendedScopes: string[],
): string | null {
  if (!rawUrl || recommendedScopes.length === 0) return null;
  try {
    const clean = new URL(rawUrl);
    clean.searchParams.set("scope", recommendedScopes.join(" "));
    // Strip stale PKCE & state: only the initiating client can mint a fresh verifier/challenge + state.
    clean.searchParams.delete("code_challenge");
    clean.searchParams.delete("code_challenge_method");
    clean.searchParams.delete("state");
    return clean.toString();
  } catch {
    return null;
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
      guard.safe_replacement_url ??
      (report.parsed_oauth
        ? buildFreshInitiationPreview(activeOAuthUrl, guard.recommended_scopes)
        : null),
    [guard.safe_replacement_url, guard.recommended_scopes, report.parsed_oauth, activeOAuthUrl],
  );

  const actionStyles =
    guard.action === "BLOCK_PRE_CONSENT"
      ? "border-rose-500/60 bg-rose-500/15 text-rose-300"
      : guard.action === "WARN"
        ? "border-amber-500/60 bg-amber-500/15 text-amber-300"
        : "border-emerald-500/60 bg-emerald-500/15 text-emerald-300";

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 1500);
    } catch {
      // Clipboard optional in headless browsers
    }
  };

  return (
    <section
      aria-label="PKCE-Safe Pre-Consent Guard Preview"
      className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 shadow-lg"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              4. Chrome MV3 Pre-Consent Guard (PKCE-Safe Preview)
            </h2>
            <span
              className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold ${actionStyles}`}
            >
              {guard.action}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 font-mono text-[11px] font-medium ${
                guard.pkce_protected
                  ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
                  : "border-slate-700 bg-slate-900 text-slate-300"
              }`}
            >
              {guard.pkce_protected
                ? "PKCE Parameters Detected"
                : "No PKCE code_challenge"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Intercepts over-scoped grants <strong>before</strong> user clicks
            Allow on {PROVIDER_LABELS[guard.provider]} — without corrupting live
            PKCE <code className="text-slate-300">code_challenge</code> pairs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onInspectUrl(DEMO_PKCE_TRAP_URL)}
          className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
        >
          Trigger MV3 Guard on PKCE Trap URL
        </button>
      </div>

      {/* PKCE Technical Integrity Banner */}
      <div className="mb-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="rounded-lg border border-sky-500/35 bg-sky-950/20 p-3 lg:col-span-8">
          <div className="text-[11px] font-bold uppercase tracking-wide text-sky-300">
            PKCE-Safe Interception Rationale
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-200">
            {guard.pkce_rewrite_warning}
          </p>
        </div>

        <div className="flex flex-col justify-center rounded-lg border border-slate-800 bg-slate-950/80 p-3 lg:col-span-4">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Pre-Consent Guard Score
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={`font-mono text-2xl font-bold ${
                guard.risk_score >= 80
                  ? "text-rose-400"
                  : guard.risk_score >= 45
                    ? "text-amber-300"
                    : "text-emerald-400"
              }`}
            >
              {guard.risk_score}
            </span>
            <span className="font-mono text-xs text-slate-500">/ 100</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {guard.flagged_scopes.length} scope downgrade(s) recommended
          </div>
        </div>
      </div>

      {/* Flagged Scopes -> Least Privilege Downgrades */}
      {guard.flagged_scopes.length > 0 ? (
        <div className="mb-3 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Blocked Over-Scoped Permissions → Least-Privilege Replacements
          </div>
          {guard.flagged_scopes.map((item) => (
            <div
              key={item.scope_id}
              className="grid grid-cols-1 gap-2 rounded-lg border border-slate-800 bg-slate-950/75 p-2.5 md:grid-cols-12 md:items-center"
            >
              <div className="min-w-0 md:col-span-5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold ${SEVERITY_META[item.severity].badgeClass}`}
                  >
                    {SEVERITY_META[item.severity].label}
                  </span>
                  <span className="break-all font-mono text-xs text-rose-300 line-through">
                    {item.scope_id}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-300 md:col-span-3">
                {item.reason}
              </div>

              <div className="flex items-center gap-1.5 md:col-span-4 md:justify-end">
                <span className="shrink-0 text-xs text-slate-500">→</span>
                <span className="break-all rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-300">
                  {item.recommended_scope_id}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-3 rounded-lg border border-emerald-500/35 bg-emerald-950/20 p-3 text-xs text-emerald-200">
          {report.parsed_oauth
            ? "All requested scopes match least-privilege baselines (no high/critical scope downgrades required)."
            : "Static configuration scan active — paste or trigger an OAuth authorization URL to inspect pre-consent scope downgrades."}
        </div>
      )}

      {/* Recommended Scope Set & Fresh Client Initiation Preview */}
      <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Least-Privilege Scope Set & Fresh Client Initiation Preview
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {guard.recommended_scopes.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  handleCopy("scopes", guard.recommended_scopes.join(" "))
                }
                className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-300 hover:border-slate-500 hover:text-white"
              >
                {copiedKey === "scopes" ? "Copied Scopes!" : "Copy Scopes"}
              </button>
            )}
            {initiationTemplate && (
              <>
                <button
                  type="button"
                  onClick={() => handleCopy("url", initiationTemplate)}
                  className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-300 hover:border-slate-500 hover:text-white"
                >
                  {copiedKey === "url" ? "Copied!" : "Copy Clean Template"}
                </button>
                {guard.flagged_scopes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onInspectUrl(initiationTemplate)}
                    className="rounded border border-emerald-500/50 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/25"
                  >
                    Re-Audit Downgraded Scopes →
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {guard.recommended_scopes.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {guard.recommended_scopes.map((sc) => (
              <span
                key={sc}
                className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-300"
              >
                {sc}
              </span>
            ))}
          </div>
        )}

        {initiationTemplate ? (
          <div className="space-y-1.5">
            <div className="overflow-x-auto break-all rounded border border-slate-800 bg-[#070b14] px-2.5 py-2 font-mono text-[11px] text-emerald-300">
              {initiationTemplate}
            </div>
            <p className="text-[11px] text-slate-400">
              Engine keeps{" "}
              <code className="text-slate-300">safe_replacement_url: null</code>{" "}
              to prevent replaying stale{" "}
              <code className="text-slate-300">code_challenge</code> or{" "}
              <code className="text-slate-300">state</code>. This template
              strips those parameters so the initiating client can mint a fresh
              PKCE verifier/challenge pair.
            </p>
          </div>
        ) : (
          <div className="text-xs text-slate-400">
            No OAuth authorization URL loaded. Trigger the MV3 Guard against the
            PKCE Trap URL to preview downgraded scopes and fresh initiation
            parameters.
          </div>
        )}
      </div>
    </section>
  );
}
