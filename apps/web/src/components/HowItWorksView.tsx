"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Browser,
  Check,
  Copy,
  ShieldCheck,
  TerminalWindow,
} from "@phosphor-icons/react";

interface HowItWorksViewProps {
  onOpenSimulator: () => void;
  onOpenPkceGuard: () => void;
  onLoadMcpSample: () => void;
}

export function HowItWorksView({
  onOpenSimulator,
  onOpenPkceGuard,
  onLoadMcpSample,
}: HowItWorksViewProps) {
  const [copiedCli, setCopiedCli] = useState(false);

  const cliCommand = "node packages/engine/cli.ts . --json";

  const handleCopyCli = async () => {
    try {
      await navigator.clipboard.writeText(cliCommand);
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(false), 1600);
    } catch {
      // Clipboard optional in headless browsers
    }
  };

  return (
    <div className="space-y-6 text-slate-200">
      <div className="max-w-[70ch]">
        <h2 className="text-base font-semibold leading-relaxed text-white">
          What we built and how the three tools fit together
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
          When someone connects an AI assistant or third-party app to Google,
          GitHub, or Vercel, a single OAuth permission often unlocks secrets or
          workflows on other platforms. Clicking Revoke inside one account
          usually returns an <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-emerald-400">HTTP 200 OK</code> response, even while
          attacker access stays alive on other services. ScopeBomb prevents and
          traces that chain across three connected local tools.
        </p>
      </div>

      {/* Plain-English 3-Step Story Strip (unboxed divided hairline grid) */}
      <div className="grid grid-cols-1 divide-y divide-white/10 border-y border-white/10 md:grid-cols-3 md:divide-x md:divide-y-0">
        <div className="py-5 md:pr-5">
          <div className="text-xs font-mono font-medium uppercase tracking-wider text-slate-400">
            Step one: The hidden trap
          </div>
          <div className="mt-1 text-base font-semibold text-white">
            One grant crosses multiple apps
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            A broad permission like <code className="text-teal-300">gmail.modify</code> or{" "}
            <code className="text-teal-300">drive</code> exposes OTP password-reset emails or exported{" "}
            <code className="text-teal-300">.env</code> secrets. Those leaked keys give attackers direct
            entry into GitHub repositories, CI pipelines, and AWS production roles.
          </p>
        </div>

        <div className="py-5 md:px-5">
          <div className="text-xs font-mono font-medium uppercase tracking-wider text-slate-400">
            Step two: Why one revoke fails
          </div>
          <div className="mt-1 text-base font-semibold text-white">
            HTTP 200 OK is not containment
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Under RFC 7009, <code className="text-rose-400">POST /revoke</code> returns{" "}
            <code className="text-emerald-400">200 OK</code> even when short-lived JWTs remain valid and
            without touching separate issuers like GitHub OAuth grants, OpenAI
            keys, or Vercel tokens.
          </p>
        </div>

        <div className="py-5 md:pl-5">
          <div className="text-xs font-mono font-medium uppercase tracking-wider text-slate-400">
            Step three: Ordered defense
          </div>
          <div className="mt-1 text-base font-semibold text-white">
            Block early or revoke by issuer
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Before you click Allow, the Chrome guard intercepts dangerous scopes
            safely without corrupting PKCE hashes. After a leak, ScopeBomb
            orders the exact API revocations across every affected provider.
          </p>
        </div>
      </div>

      {/* Three Built Surfaces List (unboxed, clean horizontal rows) */}
      <section>
        <div className="border-b border-white/10 pb-3">
          <h3 className="text-base font-semibold text-white">
            The three ScopeBomb surfaces sharing one engine
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            All three run deterministically on your machine with zero logins,
            zero external databases, and local secret masking.
          </p>
        </div>

        <div className="divide-y divide-white/10">
          {/* Surface 1 */}
          <div className="flex flex-col justify-between gap-4 py-5 md:flex-row md:items-center">
            <div className="flex max-w-[68ch] items-start gap-3">
              <Browser
                size={22}
                weight="regular"
                className="mt-0.5 shrink-0 text-blue-400"
              />
              <div>
                <div className="text-sm font-semibold text-white">
                  Web Demo Arena & Threat Cockpit
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  Replays five real 2024 to 2026 security incidents, or analyzes
                  any pasted OAuth URL, <code className="text-teal-300">.mcp.json</code>, <code className="text-teal-300">.env</code>,
                  or Google Takeout grant file. Switch between Naive Revoke and
                  Full Multi-Issuer Plan to watch persisting paths clear in real
                  time.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={onOpenSimulator}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500 active:scale-95"
              >
                Open cockpit
                <ArrowRight size={14} />
              </button>
              <button
                type="button"
                onClick={onLoadMcpSample}
                className="inline-flex h-9 items-center rounded-lg border border-white/15 bg-white/5 px-3.5 text-xs font-medium text-slate-200 transition hover:bg-white/10 active:scale-95"
              >
                Scan sample .mcp.json
              </button>
            </div>
          </div>

          {/* Surface 2 */}
          <div className="flex flex-col justify-between gap-4 py-5 md:flex-row md:items-center">
            <div className="flex max-w-[68ch] items-start gap-3">
              <ShieldCheck
                size={22}
                weight="regular"
                className="mt-0.5 shrink-0 text-teal-400"
              />
              <div>
                <div className="text-sm font-semibold text-white">
                  Chrome MV3 Pre-Consent Guard (<code className="text-teal-300">apps/extension</code>)
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  Watches Google, GitHub, and Microsoft Entra authorization pages
                  inside Chrome. When a link demands dangerous access like{" "}
                  <code className="text-rose-400">mail.google.com</code> or GitHub <code className="text-rose-400">workflow</code>,
                  it pauses before consent, preserves PKCE verification integrity,
                  builds a safer least-privilege scope list, and links straight
                  here via <code className="text-teal-300">?oauth_url=</code>.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={onOpenPkceGuard}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-500/10 px-3.5 text-xs font-medium text-teal-300 transition hover:bg-teal-500/20 active:scale-95"
              >
                Test PKCE guard
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Surface 3 */}
          <div className="flex flex-col justify-between gap-4 py-5 md:flex-row md:items-center">
            <div className="flex max-w-[68ch] items-start gap-3">
              <TerminalWindow
                size={22}
                weight="regular"
                className="mt-0.5 shrink-0 text-emerald-400"
              />
              <div>
                <div className="text-sm font-semibold text-white">
                  Offline Local CLI (<code className="text-teal-300">packages/engine/cli.ts</code>)
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  Walks a local repository in Node 24 to find{" "}
                  <code className="text-teal-300">.mcp.json</code> and <code className="text-teal-300">.env</code> secrets, masks
                  every raw key before modeling exposure, and emits the exact same
                  contract-verified report in plain text or JSON.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <code className="rounded-lg border border-white/10 bg-slate-950 px-3 py-1.5 font-mono text-xs text-slate-300">
                {cliCommand}
              </code>
              <button
                type="button"
                onClick={handleCopyCli}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 text-xs font-medium text-slate-200 transition hover:bg-white/10 active:scale-95"
              >
                {copiedCli ? <Check size={14} /> : <Copy size={14} />}
                {copiedCli ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
