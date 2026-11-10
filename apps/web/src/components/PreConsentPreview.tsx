"use client";

import React, { useState } from "react";
import type { AuditReport } from "@contracts/index";
import { DEMO_PKCE_TRAP_URL } from "./InputAndPresetBar";
import { PROVIDER_LABELS, SEVERITY_META } from "./uiTokens";

interface PreConsentPreviewProps {
  report: AuditReport;
  onInspectUrl: (url: string) => void;
}

export function PreConsentPreview({
  report,
  onInspectUrl,
}: PreConsentPreviewProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const guard = report.pre_consent_guard;

  const actionStyles =
    guard.action === "BLOCK_PRE_CONSENT"
      ? "border-rose-500/60 bg-rose-500/15 text-rose-300"
      : guard.action === "WARN"
        ? "border-amber-500/60 bg-amber-500/15 text-amber-300"
        : "border-emerald-500/60 bg-emerald-500/15 text-emerald-300";

  const handleCopySafeUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1500);
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
                ? "PKCE S256 Protected"
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
          All requested scopes match least-privilege baselines (no high/critical
          scope downgrades required).
        </div>
      )}

      {/* Clean Replacement Initiation URL */}
      <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Clean Replacement Initiation URL (Fresh Handshake Safe)
          </span>
          {guard.safe_replacement_url && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopySafeUrl(guard.safe_replacement_url!)}
                className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-300 hover:border-slate-500 hover:text-white"
              >
                {copiedUrl ? "Copied!" : "Copy Safe URL"}
              </button>
              <button
                type="button"
                onClick={() => onInspectUrl(guard.safe_replacement_url!)}
                className="rounded border border-emerald-500/50 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/25"
              >
                Re-Audit Clean URL →
              </button>
            </div>
          )}
        </div>

        {guard.safe_replacement_url ? (
          <div className="overflow-x-auto rounded border border-slate-800 bg-[#070b14] px-2.5 py-2 font-mono text-[11px] text-emerald-300">
            {guard.safe_replacement_url}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>
              Preset summary loaded without raw URL parameters. Trigger the MV3
              Guard against the PKCE Trap URL to inspect the live replacement
              handshake URL.
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
