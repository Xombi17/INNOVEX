"use client";

import React, { useEffect, useState } from "react";
import type { AuditInput, AuditReport, InputMode } from "@contracts/index";
import type { IncidentPresetSummary } from "@/lib/auditAdapter";
import { PROVIDER_LABELS, SEVERITY_META } from "./uiTokens";

export const DEMO_PKCE_TRAP_URL =
  "https://accounts.google.com/o/oauth2/v2/auth?client_id=9481203-shadowai.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fai-helper.example.com%2Fcallback&response_type=code&scope=https%3A%2F%2Fmail.google.com%2F%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&access_type=offline&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256&state=mv3_guard_demo";

const SAMPLE_TAKEOUT_JSON = JSON.stringify(
  [
    {
      displayName: "Shadow AI Inbox Assistant",
      clientId: "9481203-shadowai.apps.googleusercontent.com",
      scopes: [
        "https://www.googleapis.com/auth/gmail.modify",
        "https://www.googleapis.com/auth/drive",
      ],
    },
  ],
  null,
  2,
);

interface InputAndPresetBarProps {
  presets: IncidentPresetSummary[];
  activePresetId: string | null;
  activeInputMode: InputMode;
  report: AuditReport;
  inputError: string | null;
  externalOAuthUrl: string | null;
  onClearError: () => void;
  onRunAudit: (input: AuditInput) => void;
}

export function InputAndPresetBar({
  presets,
  activePresetId,
  activeInputMode,
  report,
  inputError,
  externalOAuthUrl,
  onClearError,
  onRunAudit,
}: InputAndPresetBarProps) {
  const [selectedTab, setSelectedTab] = useState<InputMode>(activeInputMode);
  const [oauthUrlInput, setOauthUrlInput] = useState<string>(
    presets[0]?.sample_oauth_url ?? DEMO_PKCE_TRAP_URL,
  );
  const [mcpInput, setMcpInput] = useState<string>(
    presets[0]?.sample_mcp_config ?? "",
  );
  const [takeoutInput, setTakeoutInput] = useState<string>(SAMPLE_TAKEOUT_JSON);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (externalOAuthUrl) {
      setSelectedTab("oauth_url");
      setOauthUrlInput(externalOAuthUrl);
    }
  }, [externalOAuthUrl]);

  const handleSelectPreset = (preset: IncidentPresetSummary) => {
    onClearError();
    setSelectedTab("incident_preset");
    setOauthUrlInput(preset.sample_oauth_url);
    if (preset.sample_mcp_config) {
      setMcpInput(preset.sample_mcp_config);
    }
    onRunAudit({
      mode: "incident_preset",
      raw_payload: preset.sample_oauth_url,
      preset_id: preset.preset_id,
      simulation_mode: "naive_single_revoke",
    });
  };

  const handleInspectOAuthUrl = (urlToInspect?: string) => {
    const payload = (urlToInspect ?? oauthUrlInput).trim();
    setSelectedTab("oauth_url");
    setOauthUrlInput(payload);
    onRunAudit({
      mode: "oauth_url",
      raw_payload: payload,
      preset_id: null,
      simulation_mode: "naive_single_revoke",
    });
  };

  const handleInspectMcp = (configText?: string) => {
    const payload = (configText ?? mcpInput).trim();
    setSelectedTab("mcp_config");
    setMcpInput(payload);
    onRunAudit({
      mode: "mcp_config",
      raw_payload: payload,
      preset_id: null,
      simulation_mode: "naive_single_revoke",
    });
  };

  const handleInspectTakeout = (jsonText?: string) => {
    const payload = (jsonText ?? takeoutInput).trim();
    setSelectedTab("takeout_grant");
    setTakeoutInput(payload);
    onRunAudit({
      mode: "takeout_grant",
      raw_payload: payload,
      preset_id: null,
      simulation_mode: "naive_single_revoke",
    });
  };

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const text = await file.text();
    handleInspectMcp(text);
  };

  return (
    <section
      aria-label="Incident Presets and Multi-Surface Input Inspector"
      className="rounded-xl border border-slate-800 bg-[#0d1424] p-4 shadow-lg"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            1. Trigger Surface — Incident Presets & Live Input Scanner
          </h2>
          <p className="text-xs text-slate-400">
            Select a grounded 2024–2026 post-mortem pattern or paste any OAuth
            consent URL /{" "}
            <code className="text-slate-300">.mcp.json</code> /{" "}
            <code className="text-slate-300">.env</code> (100% local deterministic
            parsing — secrets never leave your browser).
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Input mode">
          {(
            [
              { id: "incident_preset", label: "5 Incident Presets" },
              { id: "oauth_url", label: "Live OAuth URL" },
              { id: "mcp_config", label: ".mcp.json / .env" },
              { id: "takeout_grant", label: "Takeout Grant JSON" },
            ] as const
          ).map((tab) => {
            const active = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setSelectedTab(tab.id);
                  onClearError();
                }}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-sky-500/60 bg-sky-500/15 text-sky-200"
                    : "border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5 Incident Presets Strip */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {presets.map((preset) => {
          const isActive =
            report.input_mode === "incident_preset" &&
            activePresetId === preset.preset_id;
          return (
            <button
              key={preset.preset_id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`group flex flex-col justify-between rounded-lg border p-2.5 text-left transition ${
                isActive
                  ? "border-rose-500/70 bg-rose-950/25 ring-1 ring-rose-500/30"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              <div>
                <div className="mb-1 flex items-center justify-between gap-1.5">
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-300">
                    {preset.year}
                  </span>
                  {isActive && (
                    <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-rose-300">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="line-clamp-2 text-xs font-semibold text-slate-100">
                  {preset.title.split(":")[0]}
                </div>
              </div>
              <div className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-slate-400">
                {preset.classification}
              </div>
            </button>
          );
        })}
      </div>

      {/* Mode-specific input panel */}
      {selectedTab === "oauth_url" && (
        <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="oauth-url-input"
              className="text-xs font-medium text-slate-300"
            >
              Paste Google, GitHub, Microsoft Entra, Slack, or Salesforce OAuth
              Authorize URL
            </label>
            <button
              type="button"
              onClick={() => handleInspectOAuthUrl(DEMO_PKCE_TRAP_URL)}
              className="rounded border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300 hover:bg-amber-500/20"
            >
              Load PKCE Trap Sample (drive + mail.google.com)
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="oauth-url-input"
              type="url"
              value={oauthUrlInput}
              onChange={(e) => {
                setOauthUrlInput(e.target.value);
                if (inputError) onClearError();
              }}
              placeholder="https://accounts.google.com/o/oauth2/v2/auth?client_id=...&scope=..."
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleInspectOAuthUrl()}
              className="shrink-0 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-500"
            >
              Inspect OAuth URL
            </button>
          </div>
        </div>
      )}

      {selectedTab === "mcp_config" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          className={`mt-3 rounded-lg border p-3 transition ${
            isDragging
              ? "border-violet-400 bg-violet-950/20"
              : "border-slate-800 bg-slate-950/70"
          }`}
        >
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="mcp-config-input"
              className="text-xs font-medium text-slate-300"
            >
              Drop or paste <code className="text-violet-300">.mcp.json</code>{" "}
              / <code className="text-violet-300">.env</code> (raw tokens
              masked immediately in-browser)
            </label>
            <button
              type="button"
              onClick={() => {
                const sample = presets[0]?.sample_mcp_config ?? "";
                if (sample) handleInspectMcp(sample);
              }}
              className="rounded border border-violet-500/40 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-300 hover:bg-violet-500/20"
            >
              Load Rohan .mcp.json Sample
            </button>
          </div>
          <textarea
            id="mcp-config-input"
            rows={4}
            value={mcpInput}
            onChange={(e) => {
              setMcpInput(e.target.value);
              if (inputError) onClearError();
            }}
            placeholder='{"mcpServers": {"github": {"env": {"GITHUB_TOKEN": "ghp_..."}}}}'
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2.5 font-mono text-xs text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-emerald-400">
              Zero-Exfil Guarantee: secrets are masked locally before graph
              modeling.
            </span>
            <button
              type="button"
              onClick={() => handleInspectMcp()}
              className="shrink-0 whitespace-nowrap rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-500"
            >
              Scan Config Locally
            </button>
          </div>
        </div>
      )}

      {selectedTab === "takeout_grant" && (
        <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="takeout-grant-input"
              className="text-xs font-medium text-slate-300"
            >
              Paste Google Takeout OAuth Grant Export JSON
            </label>
            <button
              type="button"
              onClick={() => handleInspectTakeout(SAMPLE_TAKEOUT_JSON)}
              className="rounded border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 text-[11px] font-medium text-sky-300 hover:bg-sky-500/20"
            >
              Load Sample Takeout JSON
            </button>
          </div>
          <textarea
            id="takeout-grant-input"
            rows={4}
            value={takeoutInput}
            onChange={(e) => {
              setTakeoutInput(e.target.value);
              if (inputError) onClearError();
            }}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2.5 font-mono text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => handleInspectTakeout()}
              className="rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-500"
            >
              Analyze Takeout Grants
            </button>
          </div>
        </div>
      )}

      {/* Sanitized Inline Input Validation Alert */}
      {inputError && (
        <div
          role="alert"
          className="mt-3 flex flex-wrap items-start justify-between gap-2 rounded-lg border border-rose-500/60 bg-rose-950/40 px-3 py-2.5 text-xs text-rose-200"
        >
          <div>
            <div className="font-semibold text-rose-300">
              Input Validation Rejected (Previous Valid Audit Preserved)
            </div>
            <p className="mt-0.5 text-rose-100/90">{inputError}</p>
            <p className="mt-1 text-[11px] text-rose-200/75">
              {selectedTab === "oauth_url"
                ? "Provide an HTTPS authorize URL with client_id or scope query parameters (no fragment or userinfo)."
                : selectedTab === "mcp_config"
                  ? "Provide valid JSON (.mcp.json / service account) or KEY=VALUE lines (.env) without bare comments-only syntax errors."
                  : "Provide a JSON object or array containing OAuth grant records with scope / scopes / requested_scopes."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClearError}
            className="shrink-0 rounded border border-rose-400/50 bg-rose-900/50 px-2 py-0.5 text-[11px] font-medium text-rose-200 hover:bg-rose-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Report Forensic Strip */}
      <div className="mt-3 grid grid-cols-1 gap-3 border-t border-slate-800/80 pt-3 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Exact Incident Framing
          </div>
          <div className="mt-1 text-sm font-medium text-slate-100">
            {report.summary.headline}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            {report.summary.incident_framing_note}
          </p>
        </div>

        <div className="lg:col-span-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Parsed OAuth Surface
          </div>
          {report.parsed_oauth ? (
            <div className="mt-1.5 space-y-1 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-mono text-[11px] text-slate-200">
                  {PROVIDER_LABELS[report.parsed_oauth.provider]}
                </span>
                <span
                  className={`rounded border px-1.5 py-0.5 font-mono text-[11px] ${
                    report.parsed_oauth.has_pkce
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {report.parsed_oauth.has_pkce
                    ? `PKCE ${report.parsed_oauth.code_challenge_method ?? "S256"}`
                    : "No PKCE"}
                </span>
                {report.parsed_oauth.access_type === "offline" && (
                  <span className="rounded border border-rose-500/40 bg-rose-500/10 px-1.5 py-0.5 font-mono text-[11px] text-rose-300">
                    offline refresh
                  </span>
                )}
              </div>
              <div className="truncate font-mono text-[11px] text-slate-400">
                client: {report.parsed_oauth.client_id ?? "unknown"}
              </div>
              <div className="flex flex-wrap gap-1">
                {report.parsed_oauth.requested_scopes.map((sc) => (
                  <span
                    key={sc}
                    className="rounded bg-slate-800/90 px-1.5 py-0.5 font-mono text-[10px] text-slate-300"
                  >
                    {sc.replace("https://www.googleapis.com/auth/", "")}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-1.5 text-xs text-slate-500">
              No OAuth URL payload in current scan.
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Masked Non-Human Credentials ({report.shadow_secrets.length})
          </div>
          {report.shadow_secrets.length > 0 ? (
            <div className="mt-1.5 space-y-1.5">
              {report.shadow_secrets.map((sec, i) => (
                <div
                  key={`${sec.key_name}-${i}`}
                  className="flex items-center justify-between gap-2 rounded border border-slate-800 bg-slate-900/70 px-2 py-1"
                >
                  <div className="min-w-0">
                    <div className="truncate font-mono text-[11px] font-semibold text-slate-200">
                      {sec.key_name}
                    </div>
                    <div className="truncate text-[10px] text-slate-400">
                      {sec.rotation_issuer} ·{" "}
                      <span className="font-mono text-amber-300">
                        {sec.masked_preview}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] font-semibold ${SEVERITY_META[sec.severity].badgeClass}`}
                  >
                    {SEVERITY_META[sec.severity].label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-1.5 text-xs text-slate-500">
              No local `.mcp.json` / `.env` static secrets attached.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
