"use client";
import React, { useState } from "react";

export function ToolsCenter() {
  const [copiedAction, setCopiedAction] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);

  const ghActionYaml = `name: ScopeBomb Security Gate

on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main ]

jobs:
  scopebomb-audit:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Run ScopeBomb NHI Gate
        uses: ./
        with:
          scan-path: '.'
          fail-on-risk: 80
          markdown-output: true`;

  const copyActionYaml = () => {
    navigator.clipboard.writeText(ghActionYaml);
    setCopiedAction(true);
    setTimeout(() => setCopiedAction(false), 2000);
  };

  const copyCliCmd = () => {
    navigator.clipboard.writeText("npx @scopebomb/cli scan . --fail-on-risk 80");
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-slate-100 sm:px-6">
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-0.5 text-xs font-medium text-blue-400">
          <span>Enterprise Toolchain</span>
          <span className="font-mono text-[10px] text-blue-300">CLI & MV3 Extension</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Automate Non-Human Identity Audits Across Your SDLC
        </h1>
        <p className="text-sm text-slate-400">
          Enforce blast radius limits before code merges with the ScopeBomb CI/CD gate, or intercept permissions in the browser with the Chrome MV3 guard.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* CLI Section */}
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Standalone CLI Scanner</h2>
            <span className="rounded bg-blue-500/20 px-2 py-0.5 font-mono text-[11px] text-blue-300 font-medium">Node.js ESM</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Zero-dependency CLI using pure native APIs (`URL`, `URLSearchParams`, stdlib). Audits `.env`, `.mcp.json`, and OAuth manifests.
          </p>

          <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-slate-950 p-3 font-mono text-xs">
            <span className="text-slate-300">$ npx @scopebomb/cli scan . --fail-on-risk 80</span>
            <button
              type="button"
              onClick={copyCliCmd}
              className="rounded border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-white/10"
            >
              {copiedCli ? "✓ Copied" : "Copy"}
            </button>
          </div>

          <div className="mt-6 space-y-3">
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">Supported CLI Flags</h3>
            <div className="space-y-2 text-xs">
              <div className="rounded border border-white/5 bg-slate-950/40 p-2.5">
                <span className="font-mono text-teal-400">--fail-on-risk &lt;score&gt;</span>
                <p className="mt-1 text-slate-400">Exits with code 1 if composite blast score meets or exceeds threshold (e.g. 80).</p>
              </div>
              <div className="rounded border border-white/5 bg-slate-950/40 p-2.5">
                <span className="font-mono text-teal-400">--json</span>
                <p className="mt-1 text-slate-400">Emits pure JSON machine-readable audit report for piping into jq or SIEM.</p>
              </div>
              <div className="rounded border border-white/5 bg-slate-950/40 p-2.5">
                <span className="font-mono text-teal-400">--markdown</span>
                <p className="mt-1 text-slate-400">Outputs GitHub Flavored Markdown summary ready for Pull Request comments.</p>
              </div>
            </div>
          </div>
        </div>

        {/* GitHub Action CI/CD Gate */}
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">GitHub Actions CI/CD Gate</h2>
            <button
              type="button"
              onClick={copyActionYaml}
              className="rounded border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 hover:bg-white/10"
            >
              {copiedAction ? "✓ Copied YAML" : "Copy Workflow"}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Drop into <code>.github/workflows/scopebomb.yml</code> to guard all PRs automatically against over-scoped agent integrations.
          </p>

          <pre className="mt-4 max-h-[320px] overflow-x-auto rounded-lg border border-white/10 bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-slate-300">
            {ghActionYaml}
          </pre>
        </div>
      </div>

      {/* Chrome Extension MV3 Pre-Consent Guard */}
      <div className="mt-8 rounded-xl border border-teal-500/20 bg-teal-500/[0.03] p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded bg-teal-500/20 px-2 py-0.5 font-mono text-[10px] text-teal-300 font-semibold">
              <span>MANIFEST V3</span>
              <span>·</span>
              <span>PKCE-SAFE</span>
            </div>
            <h2 className="mt-2 text-lg font-bold text-white">Chrome MV3 Pre-Consent Guard Extension</h2>
            <p className="mt-1 text-xs text-slate-400 max-w-2xl">
              Inspects OAuth authorization URLs in real time. Flags over-scoped AI agents before the user clicks “Allow”, without modifying parameters or breaking PKCE cryptographic verifiers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-white/10 bg-slate-900/80 px-4 py-2 text-center">
              <div className="font-mono text-xs text-teal-400 font-semibold">apps/extension</div>
              <div className="text-[10px] text-slate-400">Unpacked MV3</div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-white/5 pt-5 text-xs">
          <div>
            <div className="font-semibold text-white">1. Load Unpacked</div>
            <p className="mt-1 text-slate-400">Navigate to <code>chrome://extensions</code>, toggle Developer Mode, and click “Load unpacked”.</p>
          </div>
          <div>
            <div className="font-semibold text-white">2. Select Extension Dir</div>
            <p className="mt-1 text-slate-400">Select the <code>apps/extension</code> directory from this repository.</p>
          </div>
          <div>
            <div className="font-semibold text-white">3. Automatic Defense</div>
            <p className="mt-1 text-slate-400">The guard automatically intercepts Google, GitHub, and Slack OAuth consent popups.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
