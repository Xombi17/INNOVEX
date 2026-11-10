"use client";

import React, { useEffect, useState } from "react";
import { GitBranch, UploadSimple } from "@phosphor-icons/react";
import type { AuditInput, AuditReport, InputMode } from "@contracts/index";
import type { IncidentPresetSummary } from "@/lib/auditAdapter";
import { PROVIDER_LABELS, SEVERITY_META, formatScopeShort } from "./uiTokens";

export const DEMO_PKCE_TRAP_URL =
  "https://accounts.google.com/o/oauth2/v2/auth?client_id=9481203-shadowai.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fscopebomb.vercel.app%2Foauth-callback&response_type=code&scope=https%3A%2F%2Fmail.google.com%2F%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive&access_type=offline&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&code_challenge_method=S256&state=mv3_guard_demo";

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

type ActiveTab = InputMode | "github_repo";

interface InputAndPresetBarProps {
  presets: IncidentPresetSummary[];
  activePresetId: string | null;
  activeInputMode: InputMode;
  report: AuditReport;
  inputError: string | null;
  externalOAuthUrl: string | null;
  scannerOpen?: boolean;
  onToggleScanner?: (open: boolean) => void;
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
  const [selectedTab, setSelectedTab] = useState<ActiveTab>(
    activeInputMode === "incident_preset" ? "oauth_url" : activeInputMode,
  );
  const [oauthUrlInput, setOauthUrlInput] = useState<string>(
    presets[0]?.sample_oauth_url ?? DEMO_PKCE_TRAP_URL,
  );
  const [mcpInput, setMcpInput] = useState<string>(
    presets[0]?.sample_mcp_config ?? "",
  );
  const [takeoutInput, setTakeoutInput] = useState<string>(SAMPLE_TAKEOUT_JSON);
  const [repoInput, setRepoInput] = useState<string>("Xombi17/INNOVEX");
  const [repoMsg, setRepoMsg] = useState<string | null>(null);
  const [repoLoading, setRepoLoading] = useState(false);
  const [scannedFilesList, setScannedFilesList] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (externalOAuthUrl) {
      setSelectedTab("oauth_url");
      setOauthUrlInput(externalOAuthUrl);
    }
  }, [externalOAuthUrl]);

  const handleSelectPreset = (preset: IncidentPresetSummary) => {
    onClearError();
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

  const handleInspectRepo = async (repoName?: string) => {
    const target = (repoName ?? repoInput).trim();
    if (!target) return;
    setRepoInput(target);
    setRepoLoading(true);
    setRepoMsg(null);
    setScannedFilesList([]);

    try {
      const res = await fetch("/api/scan-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: target }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setRepoMsg(`Scan error: ${data.error ?? "Failed to scan repository"}`);
        return;
      }

      setScannedFilesList(data.scannedFiles ?? []);
      setRepoMsg(data.message ?? `Scanned ${target}`);

      if (data.syntheticMcpPayload) {
        onRunAudit({
          mode: "mcp_config",
          raw_payload: data.syntheticMcpPayload,
          preset_id: null,
          simulation_mode: "naive_single_revoke",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setRepoMsg(`Scan request failed: ${msg}`);
    } finally {
      setRepoLoading(false);
    }
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
      aria-label="Incident framing and local input scanner"
      className="space-y-4"
    >
      {/* Mobile Preset Selector */}
      <div className="lg:hidden">
        <label
          htmlFor="mobile-preset-select"
          className="mb-1.5 block text-[13px] font-medium text-[#5d5f60]"
        >
          Incident scenario
        </label>
        <select
          id="mobile-preset-select"
          value={
            report.input_mode === "incident_preset" && activePresetId
              ? activePresetId
              : ""
          }
          onChange={(e) => {
            const preset = presets.find((p) => p.preset_id === e.target.value);
            if (preset) handleSelectPreset(preset);
          }}
          className="h-9 w-full rounded-[6px] border border-[#cdced1] bg-[#ffffff] px-3 text-[14px] text-[#131416]"
        >
          <option value="" disabled>
            Custom input active
          </option>
          {presets.map((preset) => (
            <option key={preset.preset_id} value={preset.preset_id}>
              {preset.year} · {preset.title.split(":")[0]}
            </option>
          ))}
        </select>
      </div>

      {/* Always-Visible Custom Input Panel */}
      <div className="border-y border-[#e8eaec] py-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#e8eaec] pb-2.5">
          <div
            className="flex flex-wrap gap-4"
            role="tablist"
            aria-label="Custom scan input type"
          >
            {(
              [
                { id: "oauth_url", label: "OAuth consent URL" },
                { id: "mcp_config", label: ".mcp.json / .env dropzone" },
                { id: "takeout_grant", label: "Google Takeout JSON" },
                { id: "github_repo", label: "GitHub Repo URL" },
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
                    setRepoMsg(null);
                  }}
                  className={`relative pb-1.5 text-[14px] font-medium transition ${
                    active
                      ? "text-[#131416]"
                      : "text-[#5d5f60] hover:text-[#131416]"
                  }`}
                >
                  {tab.label}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-[11px] h-[2px] bg-[#1b6c80]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {selectedTab === "oauth_url" && (
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="oauth-url-input"
                className="text-[14px] font-medium leading-[1.45] text-[#131416]"
              >
                Paste Google, GitHub, Microsoft Entra, Slack, or Salesforce
                authorize URL
              </label>
              <button
                type="button"
                onClick={() => handleInspectOAuthUrl(DEMO_PKCE_TRAP_URL)}
                className="text-[13px] font-medium text-[#1b6c80] hover:underline"
              >
                Load PKCE trap sample
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
                placeholder="https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
                className="h-9 w-full rounded-[6px] border border-[#cdced1] bg-[#ffffff] px-3 text-[14px] text-[#131416] placeholder:text-[#5d5f60]"
              />
              <button
                type="button"
                onClick={() => handleInspectOAuthUrl()}
                className="h-9 shrink-0 rounded-[6px] bg-[#131416] px-4 text-[13px] font-medium text-[#ffffff] transition hover:bg-[#2a2c30]"
              >
                Inspect URL
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
            className={`rounded-[6px] p-3 transition ${
              isDragging ? "bg-[#e6f2f5]" : "bg-[#ffffff]"
            }`}
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="mcp-config-input"
                className="inline-flex items-center gap-1.5 text-[14px] font-medium leading-[1.45] text-[#131416]"
              >
                <UploadSimple size={15} className="text-[#1b6c80]" />
                Drop or paste <code>.mcp.json</code> / <code>.env</code> (raw
                secrets masked locally)
              </label>
              <button
                type="button"
                onClick={() => {
                  const sample = presets[0]?.sample_mcp_config ?? "";
                  if (sample) handleInspectMcp(sample);
                }}
                className="text-[13px] font-medium text-[#1b6c80] hover:underline"
              >
                Load Rohan sample config
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
              className="w-full rounded-[6px] border border-[#cdced1] bg-[#f9fbfc] p-2.5 text-[13px] leading-[1.45] text-[#131416]"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[13px] text-[#1e7b4f]">
                Parsed 100% locally in your browser with zero network calls.
              </span>
              <button
                type="button"
                onClick={() => handleInspectMcp()}
                className="h-8 rounded-[6px] bg-[#131416] px-3.5 text-[13px] font-medium text-[#ffffff] transition hover:bg-[#2a2c30]"
              >
                Scan config locally
              </button>
            </div>
          </div>
        )}

        {selectedTab === "takeout_grant" && (
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="takeout-grant-input"
                className="text-[14px] font-medium leading-[1.45] text-[#131416]"
              >
                Paste Google Takeout OAuth grant export JSON
              </label>
              <button
                type="button"
                onClick={() => handleInspectTakeout(SAMPLE_TAKEOUT_JSON)}
                className="text-[13px] font-medium text-[#1b6c80] hover:underline"
              >
                Load sample Takeout export
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
              className="w-full rounded-[6px] border border-[#cdced1] bg-[#ffffff] p-2.5 text-[13px] leading-[1.45] text-[#131416]"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => handleInspectTakeout()}
                className="h-8 rounded-[6px] bg-[#131416] px-3.5 text-[13px] font-medium text-[#ffffff] transition hover:bg-[#2a2c30]"
              >
                Analyze Takeout grants
              </button>
            </div>
          </div>
        )}

        {selectedTab === "github_repo" && (
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="github-repo-input"
                className="inline-flex items-center gap-1.5 text-[14px] font-medium leading-[1.45] text-[#131416]"
              >
                <GitBranch size={15} className="text-[#1b6c80]" />
                Public GitHub repository (<code className="font-mono">owner/repo</code> or URL)
              </label>
              <button
                type="button"
                onClick={() => handleInspectRepo("Xombi17/INNOVEX")}
                className="text-[13px] font-medium text-[#1b6c80] hover:underline"
              >
                Try Xombi17/INNOVEX
              </button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="github-repo-input"
                type="text"
                value={repoInput}
                onChange={(e) => {
                  setRepoInput(e.target.value);
                  setRepoMsg(null);
                }}
                placeholder="owner/repo or https://github.com/owner/repo"
                className="h-9 w-full rounded-[6px] border border-[#cdced1] bg-[#ffffff] px-3 text-[14px] text-[#131416] placeholder:text-[#5d5f60]"
              />
              <button
                type="button"
                disabled={repoLoading}
                onClick={() => handleInspectRepo()}
                className="h-9 shrink-0 rounded-[6px] bg-[#131416] px-4 text-[13px] font-medium text-[#ffffff] transition hover:bg-[#2a2c30] disabled:opacity-60"
              >
                {repoLoading ? "Scanning..." : "Scan repository"}
              </button>
            </div>
            {repoMsg && (
              <div className="mt-2.5 rounded-[6px] bg-[#f4f6f8] px-3 py-2 text-[13px] text-[#5d5f60]">
                <div>{repoMsg}</div>
                {scannedFilesList.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {scannedFilesList.map((file) => (
                      <span
                        key={file}
                        className="rounded-[4px] bg-[#ffffff] border border-[#e8eaec] px-2 py-0.5 font-mono text-[11px] text-[#131416]"
                      >
                        {file}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {inputError && (
          <div
            role="alert"
            className="mt-3 flex flex-wrap items-start justify-between gap-3 border-t border-[#f0c8ca] pt-3 text-[14px] leading-[1.45] text-[#831c1e]"
          >
            <div>
              <div className="font-semibold">
                Input rejected (previous valid audit kept)
              </div>
              <p className="mt-0.5 text-[13px] leading-[1.45]">{inputError}</p>
            </div>
            <button
              type="button"
              onClick={onClearError}
              className="text-[13px] font-medium underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Unboxed Forensic Summary Band */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <div className="text-[13px] font-medium text-[#5d5f60]">
            Incident framing &amp; root mechanism
          </div>
          <div className="mt-1 text-[14px] font-semibold leading-[1.45] text-[#131416]">
            {report.summary.headline}
          </div>
          <p className="mt-1 text-[14px] leading-[1.55] text-[#5d5f60]">
            {report.summary.incident_framing_note}
          </p>
        </div>

        <div className="lg:border-l lg:border-[#f0f1f2] lg:pl-5 lg:col-span-3">
          <div className="text-[13px] font-medium text-[#5d5f60]">
            Parsed OAuth request
          </div>
          {report.parsed_oauth ? (
            <div className="mt-1.5 space-y-2">
              <div className="flex flex-wrap items-center gap-1.5 text-[13px] leading-[1.45]">
                <span className="font-medium text-[#131416]">
                  {PROVIDER_LABELS[report.parsed_oauth.provider]}
                </span>
                <span className="text-[#5d5f60]">·</span>
                <span
                  className="font-medium"
                  style={{
                    color: report.parsed_oauth.has_pkce ? "#04250e" : "#92400e",
                  }}
                >
                  {report.parsed_oauth.has_pkce
                    ? `PKCE ${report.parsed_oauth.code_challenge_method ?? "S256"}`
                    : "No PKCE"}
                </span>
                {report.parsed_oauth.access_type === "offline" && (
                  <>
                    <span className="text-[#5d5f60]">·</span>
                    <span className="font-medium text-[#831c1e]">
                      Offline refresh
                    </span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {report.parsed_oauth.requested_scopes.map((sc) => (
                  <code
                    key={sc}
                    className="rounded-[4px] bg-[#f4f6f8] px-2 py-0.5 text-[13px] text-[#131416]"
                  >
                    {formatScopeShort(sc)}
                  </code>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-1.5 text-[14px] leading-[1.5] text-[#5d5f60]">
              Static secret scan active (no OAuth URL attached).
            </p>
          )}
        </div>

        <div className="lg:border-l lg:border-[#f0f1f2] lg:pl-5 lg:col-span-3">
          <div className="text-[13px] font-medium text-[#5d5f60]">
            Masked local credentials ({report.shadow_secrets.length})
          </div>
          {report.shadow_secrets.length > 0 ? (
            <div className="mt-1.5 divide-y divide-[#f0f1f2]">
              {report.shadow_secrets.slice(0, 3).map((sec, i) => (
                <div
                  key={`${sec.key_name}-${i}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-1.5"
                >
                  <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-[13px] leading-[1.4]">
                    <code className="font-medium text-[#131416]">
                      {sec.key_name}
                    </code>
                    <span className="text-[#5d5f60]">
                      ({sec.masked_preview})
                    </span>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-0.5 text-[13px] font-medium"
                    style={{
                      backgroundColor: SEVERITY_META[sec.severity].bg,
                      color: SEVERITY_META[sec.severity].ink,
                    }}
                  >
                    {SEVERITY_META[sec.severity].label}
                  </span>
                </div>
              ))}
              {report.shadow_secrets.length > 3 && (
                <div className="pt-1.5 text-[13px] text-[#5d5f60]">
                  +{report.shadow_secrets.length - 3} more masked credentials
                </div>
              )}
            </div>
          ) : (
            <p className="mt-1.5 text-[14px] leading-[1.5] text-[#5d5f60]">
              No embedded tokens found in local config.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
