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
    <div className="mx-auto max-w-5xl px-4 py-10 text-slate-100 sm:px-6">
      {/* Header matching DeepSeek Harness */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          <span>Enterprise Toolchain</span>
          <span className="text-slate-500 font-mono text-[11px]">CLI & MV3 Extension</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white">
          Automate Non-Human Identity Audits Across Your SDLC
        </h1>
        <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed max-w-3xl">
          Enforce blast radius limits before code merges with the ScopeBomb CI/CD gate, or intercept permissions in the browser with the Chrome MV3 guard.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* CLI Section */}
        <div className="rounded-2xl border border-white/10 bg-[#12141c] p-6 sm:p-7 shadow-xl shadow-black/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Standalone CLI Scanner</h2>
              <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[11px] text-slate-300 font-medium">Node.js ESM</span>
            </div>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed font-normal">
              Zero-dependency CLI using pure native APIs (<code>URL</code>, <code>URLSearchParams</code>, stdlib). Audits <code>.env</code>, <code>.mcp.json</code>, and OAuth manifests.
            </p>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-[#0e1017] p-3 font-mono text-xs">
              <span className="text-slate-300 truncate mr-2">$ npx @scopebomb/cli scan . --fail-on-risk 80</span>
              <button
                type="button"
                onClick={copyCliCmd}
                className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                {copiedCli ? "✓ Copied" : "Copy"}
              </button>
            </div>

            <div className="mt-6 space-y-2.5">
              <div className="text-xs font-medium text-slate-300">Supported CLI flags:</div>
              <div className="space-y-2 text-xs">
                <div className="rounded-xl border border-white/5 bg-[#181b24] p-3">
                  <span className="font-mono text-teal-300 font-medium">--fail-on-risk &lt;score&gt;</span>
                  <p className="mt-1 text-slate-400 font-normal">Exits with code 1 if composite blast score meets or exceeds threshold (e.g. 80).</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-[#181b24] p-3">
                  <span className="font-mono text-teal-300 font-medium">--json</span>
                  <p className="mt-1 text-slate-400 font-normal">Emits pure JSON machine-readable audit report for piping into jq or SIEM.</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-[#181b24] p-3">
                  <span className="font-mono text-teal-300 font-medium">--markdown</span>
                  <p className="mt-1 text-slate-400 font-normal">Outputs GitHub Flavored Markdown summary ready for Pull Request comments.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GitHub Action CI/CD Gate */}
        <div className="rounded-2xl border border-white/10 bg-[#12141c] p-6 sm:p-7 shadow-xl shadow-black/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">GitHub Actions CI/CD Gate</h2>
              <button
                type="button"
                onClick={copyActionYaml}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                {copiedAction ? "✓ Copied YAML" : "Copy workflow"}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed font-normal">
              Drop into <code>.github/workflows/scopebomb.yml</code> to guard all PRs automatically against over-scoped agent integrations.
            </p>

            <pre className="mt-4 max-h-[300px] overflow-x-auto rounded-xl border border-white/10 bg-[#0e1017] p-4 font-mono text-[11px] leading-relaxed text-slate-300">
              {ghActionYaml}
            </pre>
          </div>
        </div>
      </div>

      {/* Chrome Extension MV3 Pre-Consent Guard */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-[#12141c] p-6 sm:p-8 shadow-xl shadow-black/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-0.5 text-xs text-teal-300 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
              <span>Manifest V3</span>
              <span className="text-teal-400/80 font-mono text-[11px]">PKCE-Safe</span>
            </div>
            <h2 className="mt-3 text-lg font-semibold text-white">Chrome MV3 Pre-Consent Guard Extension</h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-2xl font-normal leading-relaxed">
              Inspects OAuth authorization URLs in real time. Flags over-scoped AI agents before the user clicks “Allow”, without modifying parameters or breaking PKCE cryptographic verifiers.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-xl border border-white/10 bg-[#181b24] px-4 py-2 text-center">
              <div className="font-mono text-xs text-teal-300 font-semibold">apps/extension</div>
              <div className="text-[10px] text-slate-400">Unpacked MV3</div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-white/5 pt-5 text-xs">
          <div className="rounded-xl border border-white/5 bg-[#181b24] p-4">
            <div className="font-medium text-white text-sm">1. Load Unpacked</div>
            <p className="mt-1.5 text-slate-400 font-normal leading-relaxed">Navigate to <code>chrome://extensions</code>, toggle Developer Mode, and click “Load unpacked”.</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#181b24] p-4">
            <div className="font-medium text-white text-sm">2. Select Extension Dir</div>
            <p className="mt-1.5 text-slate-400 font-normal leading-relaxed">Select the <code>apps/extension</code> directory from this repository.</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-[#181b24] p-4">
            <div className="font-medium text-white text-sm">3. Automatic Defense</div>
            <p className="mt-1.5 text-slate-400 font-normal leading-relaxed">The guard automatically intercepts Google, GitHub, and Slack OAuth consent popups.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
