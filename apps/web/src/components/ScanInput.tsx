"use client";
import React, { useEffect, useRef, useState } from "react";
import { analyzeInput, type Analysis } from "@/lib/analysis";
import type { RepositoryResult } from "@/lib/repositoryScan";

type InputType = "mcp_config" | "oauth_url" | "github_repo" | "takeout_grant";
const INPUTS: { id: InputType; label: string }[] = [
  { id: "mcp_config", label: "Configuration file" },
  { id: "oauth_url", label: "App permission link" },
  { id: "github_repo", label: "Public repository" },
];
interface Props {
  initialUrl?: string | null;
  onAnalyze: (analysis: Analysis, oauthUrl?: string) => void;
  onInvalidate: () => void;
  onBusy: (busy: boolean) => void;
}
export function ScanInput({
  initialUrl,
  onAnalyze,
  onInvalidate,
  onBusy,
}: Props) {
  const [type, setType] = useState<InputType>(
    initialUrl ? "oauth_url" : "mcp_config",
  );
  const [drafts, setDrafts] = useState<Record<InputType, string>>({
    mcp_config: "",
    oauth_url: initialUrl ?? "",
    github_repo: "",
    takeout_grant: "",
  });
  const [source, setSource] = useState("Pasted configuration");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const focusInput = () =>
    requestAnimationFrame(() =>
      form.current
        ?.querySelector<HTMLElement>("input:not([type=file]), textarea")
        ?.focus(),
    );
  const invalidate = () => {
    generation.current += 1;
    controller.current?.abort();
    setBusy(false);
    onBusy(false);
    setError("");
    setStatus("");
    onInvalidate();
  };
  const chooseType = (next: InputType) => {
    invalidate();
    setType(next);
    focusInput();
  };
  const update = (value: string) => {
    invalidate();
    setDrafts((previous) => ({ ...previous, [type]: value }));
    if (type === "mcp_config") setSource("Pasted configuration");
  };
  const readFile = async (file?: File) => {
    if (!file) return;
    invalidate();
    const version = generation.current;
    if (file.size > 1_000_000) {
      setError("Choose a text configuration file smaller than 1 MB.");
      return;
    }
    try {
      const text = await file.text();
      if (generation.current !== version) return;
      if (text.includes("\u0000")) throw new Error();
      setType("mcp_config");
      setSource(file.name);
      setDrafts((previous) => ({ ...previous, mcp_config: text }));
      setStatus(
        "File ready. Choose Check configuration to analyze it locally.",
      );
    } catch {
      setError(
        "This file could not be read as text. Choose an .env or MCP JSON file.",
      );
    }
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    invalidate();
    const version = generation.current;
    const payload = drafts[type].trim();
    if (!payload) {
      setError("Add input before starting the check.");
      focusInput();
      return;
    }
    try {
      if (type === "github_repo") {
        const abort = new AbortController();
        controller.current = abort;
        setBusy(true);
        onBusy(true);
        setStatus("Inspecting selected public configuration files…");
        const response = await fetch("/api/scan-repo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repo: payload }),
          signal: abort.signal,
        });
        const data = (await response.json()) as RepositoryResult & {
          error?: string;
        };
        if (generation.current !== version || abort.signal.aborted) return;
        if (!response.ok || !data.ok || !data.analysis)
          throw new Error(data.error ?? "Repository check failed. Try again.");
        onAnalyze(data.analysis);
        setStatus(data.message);
        setBusy(false);
        onBusy(false);
      } else {
        const label =
          type === "mcp_config"
            ? source
            : type === "oauth_url"
              ? "Supplied permission link"
              : "Supplied grant export";
        onAnalyze(
          analyzeInput(
            {
              mode: type,
              raw_payload: payload,
              preset_id: null,
              simulation_mode: "naive_single_revoke",
            },
            label,
          ),
          type === "oauth_url" ? payload : undefined,
        );
        setStatus(
          "Check complete. Results describe this input; no account access was tested.",
        );
      }
    } catch (cause) {
      if (generation.current !== version) return;
      setBusy(false);
      onBusy(false);
      setStatus("");
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to check this input. Try again.",
      );
      focusInput();
    }
  };
  return (
    <section aria-label="Choose input" className="space-y-5">
      <div
        role="group"
        aria-label="Input type"
        className="flex flex-wrap gap-2"
      >
        {INPUTS.map((input) => (
          <button
            type="button"
            key={input.id}
            aria-pressed={type === input.id}
            onClick={() => chooseType(input.id)}
            className={type === input.id ? "control control-active" : "control"}
          >
            {input.label}
          </button>
        ))}
      </div>
      <form
        noValidate
        onSubmit={submit}
        ref={form}
        aria-busy={busy}
        className="space-y-3"
      >
        <label htmlFor="scan-input" className="block font-medium text-white">
          {type === "mcp_config"
            ? "Paste .env assignments or MCP JSON"
            : type === "oauth_url"
              ? "Paste an app’s authorization URL"
              : type === "github_repo"
                ? "GitHub repository URL or owner/repo"
                : "Paste a grant export as JSON"}
        </label>
        <p id="input-help" className="muted max-w-[75ch] text-slate-400">
          {type === "mcp_config"
            ? "Find .env or .mcp.json in your project folder. Environment references and example placeholders are listed separately from credential-like values."
            : type === "oauth_url"
              ? "Copy the URL from the permission page before choosing Allow. A link shows requested access; it cannot prove what access was granted."
              : type === "github_repo"
                ? "Only public repositories are supported. We inspect selected configuration and workflow files, not the full repository or its history."
                : "Advanced: supply JSON records with a scopes array and optional provider/clientId fields. Export formats without these fields are unsupported."}
        </p>
        <div
          onDragOver={(event) => {
            if (type === "mcp_config") {
              event.preventDefault();
              setDragging(true);
            }
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (type === "mcp_config")
              void readFile(event.dataTransfer.files[0]);
          }}
          className={dragging ? "rounded-lg border-2 border-dashed border-teal-400 bg-teal-500/10 p-2" : ""}
        >
          {type === "mcp_config" || type === "takeout_grant" ? (
            <textarea
              id="scan-input"
              name="configuration"
              value={drafts[type]}
              onChange={(event) => update(event.target.value)}
              rows={5}
              spellCheck={false}
              aria-invalid={!!error}
              aria-describedby={`input-help input-privacy${error ? " input-error" : ""}`}
              className="field font-mono text-xs"
              placeholder={
                type === "mcp_config"
                  ? "OPENAI_API_KEY=${OPENAI_API_KEY}"
                  : '[{"provider":"google","scopes":["openid","email"]}]'
              }
            />
          ) : (
            <input
              id="scan-input"
              name={type}
              type={type === "oauth_url" ? "url" : "text"}
              value={drafts[type]}
              onChange={(event) => update(event.target.value)}
              aria-invalid={!!error}
              aria-describedby={`input-help input-privacy${error ? " input-error" : ""}`}
              autoComplete="off"
              spellCheck={false}
              className="field font-mono text-xs"
              placeholder={
                type === "oauth_url"
                  ? "https://accounts.google.com/o/oauth2/v2/auth?…"
                  : "https://github.com/owner/repo"
              }
            />
          )}
        </div>
        <p id="input-privacy" className="muted text-[13px] text-slate-400">
          {type === "github_repo"
            ? "Our server retrieves files from GitHub and returns only redacted findings and coverage. File contents are not sent to an AI service."
            : "Parsed in this browser. File contents and credential values are not uploaded. An optional AI summary uses only provider names and counts, after you request it."}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {type === "mcp_config" && (
            <>
              <input
                ref={fileInput}
                type="file"
                id="configuration-file"
                aria-label="Choose configuration file"
                className="sr-only"
                tabIndex={-1}
                onChange={(event) => {
                  void readFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                className="control"
                onClick={() => fileInput.current?.click()}
              >
                Choose file
              </button>
              <span className="muted text-[13px] text-slate-400">or drop a text file</span>
            </>
          )}
          <button
            type="submit"
            className="control control-primary sm:ml-auto"
            disabled={busy}
          >
            {busy
              ? "Checking…"
              : type === "mcp_config"
                ? "Check configuration"
                : type === "github_repo"
                  ? "Check public repository"
                  : "Check permissions"}
          </button>
          {busy && (
            <button type="button" className="control" onClick={invalidate}>
              Cancel check
            </button>
          )}
        </div>
        <p role="status" className="muted text-[13px] text-teal-300">
          {status}
        </p>
        {error && (
          <p role="alert" id="input-error" className="text-rose-400">
            {error} Results from earlier input have been cleared.
          </p>
        )}
      </form>
      <details className="border-t border-[#1e2636] pt-3">
        <summary className="cursor-pointer text-teal-400 hover:text-teal-300">
          Advanced input
        </summary>
        <button
          type="button"
          className="control mt-3"
          onClick={() => chooseType("takeout_grant")}
        >
          Use a grant export
        </button>
      </details>
    </section>
  );
}
