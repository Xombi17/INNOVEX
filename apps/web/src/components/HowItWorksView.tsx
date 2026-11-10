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
    <div className="space-y-6">
      <div className="max-w-[70ch]">
        <h2 className="text-[16px] font-semibold leading-[1.4] text-[#131416]">
          What we built and how the three tools fit together
        </h2>
        <p className="mt-1.5 text-[14px] leading-[1.55] text-[#5d5f60]">
          When someone connects an AI assistant or third-party app to Google,
          GitHub, or Vercel, a single OAuth permission often unlocks secrets or
          workflows on other platforms. Clicking Revoke inside one account
          usually returns an <code>HTTP 200 OK</code> response, even while
          attacker access stays alive on other services. ScopeBomb prevents and
          traces that chain across three connected local tools.
        </p>
      </div>

      {/* Plain-English 3-Step Story Strip (unboxed divided hairline grid) */}
      <div className="grid grid-cols-1 divide-y divide-[#e8eaec] border-y border-[#e8eaec] md:grid-cols-3 md:divide-x md:divide-y-0">
        <div className="py-5 md:pr-5">
          <div className="text-[13px] font-medium text-[#5d5f60]">
            Step one: The hidden trap
          </div>
          <div className="mt-1 text-[16px] font-semibold leading-[1.4] text-[#131416]">
            One grant crosses multiple apps
          </div>
          <p className="mt-2 text-[14px] leading-[1.55] text-[#5d5f60]">
            A broad permission like <code>gmail.modify</code> or{" "}
            <code>drive</code> exposes OTP password-reset emails or exported{" "}
            <code>.env</code> secrets. Those leaked keys give attackers direct
            entry into GitHub repositories, CI pipelines, and Vercel production
            deployments.
          </p>
        </div>

        <div className="py-5 md:px-5">
          <div className="text-[13px] font-medium text-[#5d5f60]">
            Step two: Why one revoke fails
          </div>
          <div className="mt-1 text-[16px] font-semibold leading-[1.4] text-[#131416]">
            HTTP 200 OK is not containment
          </div>
          <p className="mt-2 text-[14px] leading-[1.55] text-[#5d5f60]">
            Under RFC 7009, <code>POST /revoke</code> returns{" "}
            <code>200 OK</code> even when short-lived JWTs remain valid and
            without touching separate issuers like GitHub OAuth grants, OpenAI
            keys, or Vercel tokens.
          </p>
        </div>

        <div className="py-5 md:pl-5">
          <div className="text-[13px] font-medium text-[#5d5f60]">
            Step three: Ordered defense
          </div>
          <div className="mt-1 text-[16px] font-semibold leading-[1.4] text-[#131416]">
            Block early or revoke by issuer
          </div>
          <p className="mt-2 text-[14px] leading-[1.55] text-[#5d5f60]">
            Before you click Allow, the Chrome guard intercepts dangerous scopes
            safely without corrupting PKCE hashes. After a leak, ScopeBomb
            orders the exact API revocations across every affected provider.
          </p>
        </div>
      </div>

      {/* Three Built Surfaces List (unboxed, clean horizontal rows) */}
      <section>
        <div className="border-b border-[#e8eaec] pb-3">
          <h3 className="text-[16px] font-semibold leading-[1.4] text-[#131416]">
            The three ScopeBomb surfaces sharing one engine
          </h3>
          <p className="mt-0.5 text-[14px] leading-[1.5] text-[#5d5f60]">
            All three run deterministically on your machine with zero logins,
            zero external databases, and local secret masking.
          </p>
        </div>

        <div className="divide-y divide-[#f0f1f2]">
          {/* Surface 1 */}
          <div className="flex flex-col justify-between gap-4 py-5 md:flex-row md:items-center">
            <div className="flex max-w-[68ch] items-start gap-3">
              <Browser
                size={20}
                weight="regular"
                className="mt-0.5 shrink-0 text-[#1b6c80]"
              />
              <div>
                <div className="text-[14px] font-semibold leading-[1.45] text-[#131416]">
                  Web Demo Arena (this interface)
                </div>
                <p className="mt-1 text-[14px] leading-[1.55] text-[#5d5f60]">
                  Replays five real 2024 to 2026 security incidents, or analyzes
                  any pasted OAuth URL, <code>.mcp.json</code>, <code>.env</code>,
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
                className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[#131416] px-3 text-[13px] font-medium text-[#ffffff] transition hover:bg-[#2a2c30]"
              >
                Open simulator
                <ArrowRight size={14} />
              </button>
              <button
                type="button"
                onClick={onLoadMcpSample}
                className="inline-flex h-8 items-center rounded-[6px] border border-[#cdced1] bg-[#ffffff] px-3 text-[13px] font-medium text-[#131416] transition hover:bg-[#f4f6f8]"
              >
                Scan sample .mcp.json
              </button>
            </div>
          </div>

          {/* Surface 2 */}
          <div className="flex flex-col justify-between gap-4 py-5 md:flex-row md:items-center">
            <div className="flex max-w-[68ch] items-start gap-3">
              <ShieldCheck
                size={20}
                weight="regular"
                className="mt-0.5 shrink-0 text-[#1b6c80]"
              />
              <div>
                <div className="text-[14px] font-semibold leading-[1.45] text-[#131416]">
                  Chrome MV3 Pre-Consent Guard (<code>apps/extension</code>)
                </div>
                <p className="mt-1 text-[14px] leading-[1.55] text-[#5d5f60]">
                  Watches Google, GitHub, and Microsoft Entra authorization pages
                  inside Chrome. When a link demands dangerous access like{" "}
                  <code>mail.google.com</code> or GitHub <code>workflow</code>,
                  it pauses before consent, preserves PKCE verification integrity,
                  builds a safer least-privilege scope list, and links straight
                  here via <code>?oauth_url=</code>.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={onOpenPkceGuard}
                className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[#cdced1] bg-[#ffffff] px-3 text-[13px] font-medium text-[#131416] transition hover:bg-[#f4f6f8]"
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
                size={20}
                weight="regular"
                className="mt-0.5 shrink-0 text-[#1b6c80]"
              />
              <div>
                <div className="text-[14px] font-semibold leading-[1.45] text-[#131416]">
                  Offline Local CLI (<code>packages/engine/cli.ts</code>)
                </div>
                <p className="mt-1 text-[14px] leading-[1.55] text-[#5d5f60]">
                  Walks a local repository in Node 24 to find{" "}
                  <code>.mcp.json</code> and <code>.env</code> secrets, masks
                  every raw key before modeling exposure, and emits the exact same
                  contract-verified report in plain text or JSON.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <code className="rounded-[6px] bg-[#f4f6f8] px-2.5 py-1.5 text-[13px] text-[#131416]">
                {cliCommand}
              </code>
              <button
                type="button"
                onClick={handleCopyCli}
                className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-[#cdced1] bg-[#ffffff] px-2.5 text-[13px] font-medium text-[#131416] transition hover:bg-[#f4f6f8]"
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
