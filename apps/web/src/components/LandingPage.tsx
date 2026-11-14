"use client";
import React, { useState } from "react";

interface LandingPageProps {
  onLaunchCockpit: () => void;
  onDetonateSimulation: () => void;
  onOpenSwarm: () => void;
  onOpenRemediation: () => void;
  onOpenTools: () => void;
  onCheckConfiguration?: () => void;
}

export function LandingPage({
  onLaunchCockpit,
  onDetonateSimulation,
  onOpenSwarm,
  onOpenRemediation,
  onOpenTools,
  onCheckConfiguration,
}: LandingPageProps) {
  const [copiedCli, setCopiedCli] = useState(false);
  const [activeTabPreview, setActiveTabPreview] = useState<"intro" | "domino" | "swarm" | "rfc7009" | "presets">("intro");
  const [simulatedHop, setSimulatedHop] = useState<number | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showThoughts, setShowThoughts] = useState(true);

  const copyCliCommand = () => {
    navigator.clipboard.writeText("npx @scopebomb/cli scan . --fail-on-risk 80");
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const runInCardSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulatedHop(1);
    setTimeout(() => setSimulatedHop(2), 600);
    setTimeout(() => setSimulatedHop(3), 1200);
    setTimeout(() => {
      setSimulatedHop(4);
      setIsSimulating(false);
    }, 1800);
  };

  const resetInCardSimulation = () => {
    setSimulatedHop(null);
    setIsSimulating(false);
  };

  return (
    <div className="relative w-full overflow-hidden text-slate-100 pb-20">
      {/* DeepSeek Harness signature radiant ambient bloom - pure oceanic twilight */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[750px] w-[1300px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(28,64,118,0.65)_0%,rgba(14,32,60,0.3)_45%,transparent_75%)] blur-[90px]" />

      {/* Hero Section matching DeepSeek Harness */}
      <section className="relative mx-auto max-w-6xl px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24 lg:px-8">
        <div className="flex flex-col items-center text-center">


          {/* DeepSeek Signature Crisp White Headline */}
          <h1 className="max-w-4xl text-4xl sm:text-5xl lg:text-[62px] font-medium tracking-tight text-white sm:leading-[1.14] text-center">
            ScopeBomb Harness<br />
            <span className="text-white/95">Ready to defend. Right now.</span>
          </h1>

          {/* DeepSeek Signature Balanced Subtitle */}
          <p className="mt-5 max-w-2xl text-base sm:text-lg text-[#9ab3d0] leading-relaxed text-center mx-auto font-normal">
            Everyday tasks, coding, or your own harness: defense starts here.<br className="hidden sm:inline" />
            ScopeBomb Harness is now in public preview worldwide and open source, with composable defense that extends what agents can secure.
          </p>

          {/* DeepSeek Signature White Pill Primary CTA & Frosted Secondary CTA */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <button
              type="button"
              aria-label="Start guided tour"
              onClick={onLaunchCockpit}
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm sm:text-base font-medium text-[#09111e] hover:bg-[#edf3fa] shadow-lg shadow-black/25 transition-colors hover:bg-[#edf3fa]"
            >
              <span>Start guided tour</span>
            </button>

            <button
              type="button"
              onClick={onCheckConfiguration ?? onLaunchCockpit}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm sm:text-base font-medium text-white hover:bg-white/15 transition-colors"
            >
              <span>Check my configuration</span>
            </button>
          </div>

          {/* 1-Click Copyable CLI Terminal Pill */}
          <div className="mt-5 flex items-center justify-center">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-[#0e1626]/70 px-4 py-1.5 font-mono text-xs text-[#8ca4c3] backdrop-blur-md">
              <span className="text-[#567a9e]">$</span>
              <span>npx @scopebomb/cli scan . --fail-on-risk 80</span>
              <button
                type="button"
                onClick={copyCliCommand}
                aria-label="Copy CLI command"
                className="ml-2 text-xs text-[#7fa3cc] hover:text-white transition-colors"
              >
                {copiedCli ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* DeepSeek Harness Signature Interactive Desktop App Window */}
        <div className="mt-14 harness-window overflow-hidden max-w-5xl mx-auto rounded-2xl border border-white/10 bg-[#13151b] shadow-2xl shadow-black/80">
          <div className="flex flex-col md:flex-row min-h-[520px] md:h-[580px]">
            {/* Left Desktop App Sidebar matching DeepSeek Harness */}
            <div className="w-full md:w-64 bg-[#101217] border-b md:border-b-0 md:border-r border-white/10 p-4 flex flex-col justify-between shrink-0">
              <div>
                {/* macOS traffic light window controls */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                  <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
                </div>

                {/* App title */}
                <div className="flex items-center gap-2 px-1 mb-4">
                  <span className="font-semibold text-white tracking-tight text-sm">scopebomb</span>
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-300 border border-white/10 font-sans">
                    harness
                  </span>
                </div>

                {/* New Session Button */}
                <button
                  type="button"
                  onClick={onDetonateSimulation}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 py-1.5 px-3 text-xs font-medium text-white/90 hover:bg-white/10 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <span className="text-sm font-light">+</span>
                  <span>New Session</span>
                </button>

                {/* Sidebar Nav Items */}
                <div className="mt-4 space-y-1">
                  <button
                    type="button"
                    onClick={onLaunchCockpit}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                    <span>Plugins</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenRemediation}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                    <span>Automation</span>
                  </button>
                </div>

                {/* Workspace section matching DeepSeek Harness */}
                <div className="mt-5">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 px-3 mb-2">
                    <span>Workspaces</span>
                    <span className="text-[10px] text-slate-500 font-mono">5 active</span>
                  </div>
                  <nav aria-label="Desktop Workspaces" className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => setActiveTabPreview("intro")}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${activeTabPreview === "intro" ? "bg-[#252834] text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                      <span className="truncate">Meet ScopeBomb Harness</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTabPreview("domino")}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${activeTabPreview === "domino" ? "bg-[#252834] text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
                      <span className="truncate">4-Hop OAuth Breach</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTabPreview("swarm")}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${activeTabPreview === "swarm" ? "bg-[#252834] text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span className="truncate">4-Agent SOC Deliberation</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTabPreview("rfc7009")}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${activeTabPreview === "rfc7009" ? "bg-[#252834] text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-400 shrink-0" />
                      <span className="truncate">RFC 7009 Containment</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTabPreview("presets")}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${activeTabPreview === "presets" ? "bg-[#252834] text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                      <span className="truncate">Threat Presets</span>
                    </button>
                  </nav>
                </div>
              </div>

              {/* Bottom subtle status */}
              <div className="pt-4 border-t border-white/10 text-xs text-slate-400 flex items-center justify-between px-1">
                <span className="font-mono text-[11px]">v1.2.0</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 motion-safe:animate-pulse motion-reduce:animate-none" />
                  Engine ready
                </span>
              </div>
            </div>

            {/* Right Main Window Content matching DeepSeek Harness */}
            <div className="flex-1 bg-[#14161f] p-5 sm:p-6 flex flex-col justify-between overflow-y-auto">
              <div>
                {/* Window Top Bar with Navigation Pills */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">
                      {activeTabPreview === "intro" && "Meet ScopeBomb Harness"}
                      {activeTabPreview === "domino" && "4-Hop Lateral Path Simulation"}
                      {activeTabPreview === "swarm" && "4-Agent SOC Deliberation"}
                      {activeTabPreview === "rfc7009" && "RFC 7009 Multi-Cloud Containment"}
                      {activeTabPreview === "presets" && "Curated Attack Presets"}
                    </span>
                    <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-mono text-slate-400 border border-white/5">
                      session://active
                    </span>
                  </div>

                  {/* Top Bar Switcher */}
                  <div role="tablist" aria-label="Workbench Views" className="flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTabPreview === "intro"}
                      onClick={() => setActiveTabPreview("intro")}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${activeTabPreview === "intro" ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"}`}
                    >
                      Intro
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTabPreview === "domino"}
                      onClick={() => setActiveTabPreview("domino")}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${activeTabPreview === "domino" ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"}`}
                    >
                      4-Hop Chain
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTabPreview === "swarm"}
                      onClick={() => setActiveTabPreview("swarm")}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${activeTabPreview === "swarm" ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"}`}
                    >
                      4-Agent SOC
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTabPreview === "rfc7009"}
                      onClick={() => setActiveTabPreview("rfc7009")}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${activeTabPreview === "rfc7009" ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"}`}
                    >
                      RFC 7009
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTabPreview === "presets"}
                      onClick={() => setActiveTabPreview("presets")}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${activeTabPreview === "presets" ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"}`}
                    >
                      Presets
                    </button>
                    <button
                      type="button"
                      onClick={onLaunchCockpit}
                      title="Open full cockpit"
                      aria-label="Open full cockpit"
                      className="ml-2 p-1 text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    >
                      <span className="text-xs">⤢</span>
                    </button>
                  </div>
                </div>

                {/* VIEW 0: Meet ScopeBomb Harness (Intro matching DeepSeek Harness) */}
                {activeTabPreview === "intro" && (
                  <div className="space-y-4">
                    {/* User Question Bubble matching DeepSeek Harness */}
                    <div className="flex justify-end mb-3">
                      <div className="rounded-2xl rounded-tr-sm bg-[#252833] border border-white/5 px-4 py-2 text-xs sm:text-sm text-white/90 max-w-md shadow-sm">
                        Could you introduce yourself?
                      </div>
                    </div>

                    {/* Assistant Response with Collapsible Thought */}
                    <div className="space-y-3">
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowThoughts(!showThoughts)}
                          className="inline-flex items-center gap-1.5 text-xs text-[#7e99b8] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        >
                          <span>Thought for a while</span>
                          <span className="text-[10px]">{showThoughts ? "▾" : "›"}</span>
                        </button>
                        {showThoughts && (
                          <div className="mt-2 rounded-lg bg-black/40 border border-white/10 p-3 font-mono text-xs text-slate-300 space-y-1">
                            <div>• Initializing non-human identity defense graph (30 AST nodes)</div>
                            <div>• Verified zero-dependency runtime in pure TypeScript</div>
                            <div>• Prepared lateral breach chain simulation across 4 trust boundaries</div>
                          </div>
                        )}
                      </div>

                      <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal space-y-2">
                        <p>
                          I’m <strong className="text-white font-medium">ScopeBomb Harness</strong>, an open-source non-human identity defense harness built on Cordis’s “everything is a plugin” architecture. Run me as a desktop app or launch the web UI from code.
                        </p>
                        <p className="text-slate-300">
                          I can help with:
                        </p>
                        <ol className="list-decimal list-inside text-slate-300 space-y-1 pl-1 text-xs sm:text-sm">
                          <li><strong className="text-white font-medium">Everyday work</strong>: Discover orphaned OAuth tokens, analyze scope explosion, and draft blast radius reports.</li>
                          <li><strong className="text-white font-medium">Coding</strong>: Explore repos, fix overbroad permissions, build features, and run tests.</li>
                          <li><strong className="text-white font-medium">Research</strong>: Find information, verify RFC 7009 compliance, and cite cryptographic receipts.</li>
                        </ol>
                      </div>

                      {/* Interactive DeepSeek-style quick prompt cards */}
                      <div className="pt-2">
                        <div className="text-[11px] font-medium text-slate-400 mb-2">Explore active capabilities:</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveTabPreview("domino")}
                            className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                          >
                            <div>
                              <div className="text-xs font-semibold text-white">4-Hop Breach Simulation</div>
                              <div className="text-[11px] text-slate-400 mt-0.5">Watch OAuth grant pivot to AWS STS root</div>
                            </div>
                            <span className="text-xs text-rose-400 font-mono">Simulate</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveTabPreview("swarm")}
                            className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                          >
                            <div>
                              <div className="text-xs font-semibold text-white">4-Agent Autonomous SOC</div>
                              <div className="text-[11px] text-slate-400 mt-0.5">IAM, STRIDE, RFC 7009, Synthesizer</div>
                            </div>
                            <span className="text-xs text-amber-400 font-mono">Triage</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveTabPreview("rfc7009")}
                            className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                          >
                            <div>
                              <div className="text-xs font-semibold text-white">RFC 7009 Containment Proof</div>
                              <div className="text-[11px] text-slate-400 mt-0.5">True downstream session destruction</div>
                            </div>
                            <span className="text-xs text-teal-400 font-mono">Receipt</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveTabPreview("presets")}
                            className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                          >
                            <div>
                              <div className="text-xs font-semibold text-white">Curated Incident Presets</div>
                              <div className="text-[11px] text-slate-400 mt-0.5">Midnight Blizzard, Slack AI, CircleCI</div>
                            </div>
                            <span className="text-xs text-blue-400 font-mono">Load</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Prompt Bar matching DeepSeek Harness */}
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                      <div className="flex-1 flex items-center rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-400">
                        <span className="truncate">Ask ScopeBomb Harness to audit your non-human identities…</span>
                      </div>
                      <button
                        type="button"
                        onClick={onDetonateSimulation}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                      >
                        Detonate
                      </button>
                    </div>
                  </div>
                )}

                {/* VIEW 1: Domino Blast Graph */}
                {activeTabPreview === "domino" && (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white">4-Hop Non-Human Identity Breach Chain</h3>
                        <p className="text-xs text-slate-400">Simulating lateral movement from Google OAuth into production AWS STS admin</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-lg bg-rose-500/20 border border-rose-500/40 px-3 py-1 font-mono text-xs text-rose-300 font-bold">
                          Blast score: 94 / 100 (CRITICAL)
                        </span>
                        <button
                          type="button"
                          onClick={simulatedHop ? resetInCardSimulation : runInCardSimulation}
                          className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-colors shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${isSimulating
                              ? "bg-amber-500/25 text-amber-300 border border-amber-500/50 motion-safe:animate-pulse motion-reduce:animate-none"
                              : simulatedHop === 4
                                ? "bg-slate-800 text-slate-200 border border-white/20 hover:bg-slate-700"
                                : "bg-gradient-to-r from-rose-600 to-red-600 text-white hover:brightness-110 active:scale-95"
                            }`}
                        >
                          <span>{isSimulating ? "Cascading explosion…" : simulatedHop === 4 ? "↺ Reset simulation" : "Detonate chain simulation"}</span>
                        </button>
                      </div>
                    </div>

                    {/* 4 Connected Hops with Visual Movement */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 relative">
                      {/* Hop 1 */}
                      <div className={`rounded-xl border p-4 transition-colors duration-300 ${simulatedHop && simulatedHop >= 1
                          ? "border-teal-400 bg-teal-500/20 shadow-xl shadow-teal-500/15 ring-2 ring-teal-400/40"
                          : "border-teal-500/30 bg-teal-950/20"
                        }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-teal-400">Hop 1: Personal identity</span>
                          {simulatedHop && simulatedHop >= 1 && (
                            <span className="h-2 w-2 rounded-full bg-teal-400 motion-safe:animate-ping motion-reduce:animate-none" />
                          )}
                        </div>
                        <div className="mt-2 font-bold text-white text-sm">OAuth Grant</div>
                        <div className="mt-1.5 text-xs text-slate-300 leading-relaxed">User approves Google Drive scope for AI assistant.</div>
                        <div className="mt-3 font-mono text-[11px] text-teal-300/90">Issuer: accounts.google.com</div>
                        <div className="mt-2.5 pt-2 border-t border-teal-500/20 text-[11px] font-mono font-medium text-teal-400">
                          {simulatedHop && simulatedHop >= 1 ? "● AUTHORIZED (drive.readonly)" : "Status: Dormant"}
                        </div>
                      </div>

                      {/* Hop 2 */}
                      <div className={`rounded-xl border p-4 transition-colors duration-300 ${simulatedHop && simulatedHop >= 2
                          ? "border-amber-400 bg-amber-500/20 shadow-xl shadow-amber-500/15 ring-2 ring-amber-400/40"
                          : "border-amber-500/30 bg-amber-950/20"
                        }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-amber-400">Hop 2: Dev local</span>
                          {simulatedHop && simulatedHop >= 2 && (
                            <span className="h-2 w-2 rounded-full bg-amber-400 motion-safe:animate-ping motion-reduce:animate-none" />
                          )}
                        </div>
                        <div className="mt-2 font-bold text-white text-sm">Unchecked File Read</div>
                        <div className="mt-1.5 text-xs text-slate-300 leading-relaxed">Bot accesses `.env.backup` containing developer keys.</div>
                        <div className="mt-3 font-mono text-[11px] text-amber-300/90">Path: /Developer/configs</div>
                        <div className="mt-2.5 pt-2 border-t border-amber-500/20 text-[11px] font-mono font-medium text-amber-400">
                          {simulatedHop && simulatedHop >= 2 ? "● EXFILTRATED (PAT Found)" : "Status: Waiting"}
                        </div>
                      </div>

                      {/* Hop 3 */}
                      <div className={`rounded-xl border p-4 transition-colors duration-300 ${simulatedHop && simulatedHop >= 3
                          ? "border-rose-400 bg-rose-500/20 shadow-xl shadow-rose-500/15 ring-2 ring-rose-400/40"
                          : "border-rose-500/30 bg-rose-950/20"
                        }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-rose-400">Hop 3: Vendor SaaS</span>
                          {simulatedHop && simulatedHop >= 3 && (
                            <span className="h-2 w-2 rounded-full bg-rose-400 motion-safe:animate-ping motion-reduce:animate-none" />
                          )}
                        </div>
                        <div className="mt-2 font-bold text-white text-sm">GitHub Secret Pivot</div>
                        <div className="mt-1.5 text-xs text-slate-300 leading-relaxed">Bot clones private enterprise repos via extracted PAT.</div>
                        <div className="mt-3 font-mono text-[11px] text-rose-300/90">Issuer: api.github.com</div>
                        <div className="mt-2.5 pt-2 border-t border-rose-500/20 text-[11px] font-mono font-medium text-rose-400">
                          {simulatedHop && simulatedHop >= 3 ? "● REPOS CLONED (CI Leaked)" : "Status: Waiting"}
                        </div>
                      </div>

                      {/* Hop 4 */}
                      <div className={`rounded-xl border p-4 transition-colors duration-300 ${simulatedHop && simulatedHop >= 4
                          ? "border-red-500 bg-red-600/30 shadow-2xl shadow-red-500/30 ring-2 ring-red-400"
                          : "border-red-500/40 bg-red-950/20"
                        }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-red-400">Hop 4: Cloud production</span>
                          {simulatedHop && simulatedHop >= 4 && (
                            <span className="h-2 w-2 rounded-full bg-red-500 motion-safe:animate-ping motion-reduce:animate-none" />
                          )}
                        </div>
                        <div className="mt-2 font-bold text-white text-sm">AWS STS Takeover</div>
                        <div className="mt-1.5 text-xs text-slate-300 leading-relaxed">CI/CD secrets leveraged to assume production admin IAM role.</div>
                        <div className="mt-3 font-mono text-[11px] text-red-300/90">Role: arn:aws:iam::prod:admin</div>
                        <div className="mt-2.5 pt-2 border-t border-red-500/20 text-[11px] font-mono font-medium text-red-400">
                          {simulatedHop && simulatedHop >= 4 ? "● PRODUCTION ROOT EXPLOIT" : "Status: Waiting"}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-900/60 p-4 text-xs text-slate-300">
                      <div className="flex items-center gap-3">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-400 motion-safe:animate-ping motion-reduce:animate-none shrink-0" />
                        <span className="font-medium">
                          The RFC 7009 flaw: Clicking “Disconnect” on Google only revokes Hop 1. Hops 2, 3, and 4 remain completely active in production.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={onLaunchCockpit}
                        className="font-bold text-blue-400 hover:text-blue-300 underline underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                      >
                        Open in Full Blast Graph
                      </button>
                    </div>
                  </div>
                )}

                {/* VIEW 2: Swarm SOC */}
                {activeTabPreview === "swarm" && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white">4-Agent Autonomous Deliberation SOC</h3>
                        <p className="text-xs text-slate-400">Autonomous consensus triage streaming in parallel across 4 specialized roles</p>
                      </div>
                      <button
                        type="button"
                        onClick={onOpenSwarm}
                        className="rounded-lg bg-blue-600/25 border border-blue-500/40 px-3.5 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-600/35 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                      >
                        Open Live Swarm SOC
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-teal-400">
                          <span className="h-2 w-2 rounded-full bg-teal-400" />
                          IAM & Scope Auditor
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-slate-300">
                          Identified <code className="text-teal-300 font-mono">drive.readonly</code> escalation vector. Over-privileged scope allows read access to unconstrained file indices.
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                          <span className="h-2 w-2 rounded-full bg-amber-400" />
                          Threat Modeler (STRIDE / MITRE)
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-slate-300">
                          Mapped to MITRE ATT&CK T1566 & T1552. Lateral pivot from SaaS identity provider into CI/CD build pipelines.
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                          <span className="h-2 w-2 rounded-full bg-rose-400" />
                          RFC 7009 Compliance & Revocation Engine
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-slate-300">
                          Standard Revoke endpoint reports 200 OK without downstream token invalidation. Cascade execution required across 3 issuers.
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                          <span className="h-2 w-2 rounded-full bg-indigo-400" />
                          Incident Commander (Synthesizer)
                        </div>
                        <p className="mt-2 text-xs leading-relaxed text-slate-300">
                          Consensus reached. Final blast rating: CRITICAL (94/100). Signed containment order dispatched to active remediation queue.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* VIEW 3: RFC 7009 Containment */}
                {activeTabPreview === "rfc7009" && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white">Multi-Cloud Invalidation & Cryptographic Audit Receipts</h3>
                        <p className="text-xs text-slate-400">True downstream session destruction vs cosmetic OAuth disconnect</p>
                      </div>
                      <button
                        type="button"
                        onClick={onOpenRemediation}
                        className="rounded-lg bg-teal-500/25 border border-teal-500/40 px-3.5 py-1.5 text-xs font-bold text-teal-300 hover:bg-teal-500/35 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                      >
                        Open Containment Center
                      </button>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-slate-900/90 p-4 font-mono text-xs">
                      <div className="text-slate-400">// Sample Audit Receipt emitted by ScopeBomb Containment Engine</div>
                      <div className="mt-2 text-emerald-400">{`{`}</div>
                      <div className="ml-4 text-slate-300">{`"receipt_id": "SCOPEBOMB-REMED-20261113-AF89E",`}</div>
                      <div className="ml-4 text-slate-300">{`"target_action": "revoke_oauth_app",`}</div>
                      <div className="ml-4 text-slate-300">{`"provider": "github",`}</div>
                      <div className="ml-4 text-slate-300">{`"endpoint_hit": "DELETE /applications/Iv1.8a2b3c/grant",`}</div>
                      <div className="ml-4 text-slate-300">{`"rfc_7009_status": "TRUE_DOWNSTREAM_CONTAINMENT",`}</div>
                      <div className="ml-4 text-slate-300">{`"invalidated_sessions": 3,`}</div>
                      <div className="ml-4 text-slate-300">{`"sha256_proof": "a8f5b2…9e41d8"`}</div>
                      <div className="text-emerald-400">{`}`}</div>
                    </div>
                  </div>
                )}

                {/* VIEW 4: Threat Presets */}
                {activeTabPreview === "presets" && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white">Curated Real-World Attack Scenarios (2024–2026)</h3>
                        <p className="text-xs text-slate-400">Load authentic non-human identity incident vectors into the threat cockpit</p>
                      </div>
                      <button
                        type="button"
                        onClick={onLaunchCockpit}
                        className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                      >
                        Load in Cockpit
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">Rohan MCP OAuth Trap</span>
                          <span className="rounded bg-rose-500/20 px-2 py-0.5 font-mono text-[10px] text-rose-300 font-bold">94 CRITICAL</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                          Innocent Google Drive search access leads to .env backup exfiltration and lateral takeover of AWS IAM production admin.
                        </p>
                        <button
                          type="button"
                          onClick={onLaunchCockpit}
                          className="mt-3 text-xs font-bold text-rose-400 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                        >
                          Audit Scenario
                        </button>
                      </div>

                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">Slack AI Prompt Exfiltration</span>
                          <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] text-amber-300 font-bold">78 HIGH</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                          Indirect prompt injection tricking an enterprise Slack bot into reading private channel messages and leaking secrets via webhook.
                        </p>
                        <button
                          type="button"
                          onClick={onLaunchCockpit}
                          className="mt-3 text-xs font-bold text-amber-400 hover:text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                        >
                          Audit Scenario
                        </button>
                      </div>

                      <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">Over-Scoped Google Drive Bot</span>
                          <span className="rounded bg-teal-500/20 px-2 py-0.5 font-mono text-[10px] text-teal-300 font-bold">82 HIGH</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                          Requesting <code className="text-teal-300 font-mono">drive</code> full scope when only read-only metadata was needed, granting full write & deletion.
                        </p>
                        <button
                          type="button"
                          onClick={onLaunchCockpit}
                          className="mt-3 text-xs font-bold text-teal-400 hover:text-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                        >
                          Audit Scenario
                        </button>
                      </div>

                      <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">CI/CD Pipeline GitHub Gate</span>
                          <span className="rounded bg-blue-500/20 px-2 py-0.5 font-mono text-[10px] text-blue-300 font-bold">88 HIGH</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                          Pull request secret scanning detecting orphaned PATs and blocking PR merge before production deployment.
                        </p>
                        <button
                          type="button"
                          onClick={onOpenTools}
                          className="mt-3 text-xs font-bold text-blue-400 hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        >
                          View GitHub Action
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DeepSeek Harness Style Architectural Topology & Slot Pipeline */}
      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="text-center">
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Pure TypeScript Architecture with Sub-15ms DAG Traversal
          </h2>
          <p className="mt-3 text-sm text-slate-400 max-w-2xl mx-auto">
            ScopeBomb is designed around modular slot-based execution with zero-dependency native APIs.
          </p>
        </div>

        {/* Execution Flow Diagram */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>LAYER 01</span>
              <span className="text-teal-400 font-semibold">PRE-CONSENT</span>
            </div>
            <h3 className="mt-3 text-sm font-bold text-white">Client Ingestion</h3>
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              Chrome MV3 guard pauses OAuth consent dialogs with zero PKCE hash corruption; CLI parses local repositories.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>LAYER 02</span>
              <span className="text-blue-400 font-semibold">PURE TS</span>
            </div>
            <h3 className="mt-3 text-sm font-bold text-white">Core DAG Engine</h3>
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              Deterministic 30-node catalog modeling cross-issuer blast radius across 4 trust boundaries in under 15ms.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>LAYER 03</span>
              <span className="text-amber-400 font-semibold">4-AGENT MESH</span>
            </div>
            <h3 className="mt-3 text-sm font-bold text-white">Autonomous SOC Swarm</h3>
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              Parallel Gemini 3.x Flash agents deliberate on IAM permissions, MITRE tactics, and RFC 7009 compliance.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>LAYER 04</span>
              <span className="text-emerald-400 font-semibold">SHA-256</span>
            </div>
            <h3 className="mt-3 text-sm font-bold text-white">Multi-Cloud Gate</h3>
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              Dispatches cascading revocations to GitHub, Google, and AWS with tamper-proof cryptographic audit receipts.
            </p>
          </div>
        </div>
      </section>

      {/* 6 Core Capability Pillars Grid (Harness/DeepSeek clean cards) */}
      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="text-center">
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Engineered for Modern Non-Human Identities (NHI)
          </h2>
          <p className="mt-3 text-sm text-slate-400 max-w-2xl mx-auto">
            Traditional IAM tools only inspect human login sessions. ScopeBomb defends the automated agent pipeline across every tier.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Pillar 1 */}
          <div className="glow-card-blue rounded-xl p-6 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-bold text-white">Cross-Issuer Domino Graph</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              Traverses across personal Google identities, local developer environments, GitHub organizations, and AWS IAM roles with sub-15ms topological blast radius computation.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="glow-card-cyan rounded-xl p-6 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-bold text-white">4-Agent Autonomous Swarm</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              Parallel Gemini 3.x Flash agents simultaneously audit permissions, model MITRE attack vectors, check RFC 7009 compliance, and synthesize remediation orders.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="glow-card-blue rounded-xl p-6 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-bold text-white">RFC 7009 True Containment</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              Direct API integrations for GitHub grant revocation and AWS STS credential invalidation with cryptographic SHA-256 audit receipts that satisfy SOC2 criteria.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="glow-card-cyan rounded-xl p-6 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-bold text-white">Chrome MV3 Pre-Consent Guard</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              Intercepts OAuth consent screens in the browser before the user clicks “Allow”. Zero PKCE corruption, 100% pre-token visibility.
            </p>
          </div>

          {/* Pillar 5 */}
          <div className="glow-card-blue rounded-xl p-6 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-bold text-white">CI/CD Enterprise Gate & CLI</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              Lightweight zero-dependency CLI (<code>npx @scopebomb/cli scan .</code>) and official GitHub Action to automatically fail pull requests on high risk scores.
            </p>
          </div>

          {/* Pillar 6 */}
          <div className="glow-card-cyan rounded-xl p-6 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-bold text-white">Zero-Knowledge Local Parsing</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              All URL inspection, AST tokens, and config audits occur client-side in pure TypeScript without secret leakage to third-party endpoints.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table: Status Quo vs ScopeBomb */}
      <section className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="text-center">
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Why Standard OAuth Disconnect Fails
          </h2>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-slate-950/70 shadow-xl backdrop-blur-md">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-white/10 bg-slate-900/80 text-slate-400 text-xs font-medium">
              <tr>
                <th className="px-4 py-3 sm:px-6">Security Dimension</th>
                <th className="px-4 py-3 text-slate-400 sm:px-6">Status Quo ("Disconnect" Button)</th>
                <th className="px-4 py-3 text-blue-400 sm:px-6">ScopeBomb Defense Mesh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              <tr>
                <td className="px-4 py-3.5 font-medium text-white sm:px-6">Cross-Issuer Awareness</td>
                <td className="px-4 py-3.5 text-rose-400/90 sm:px-6">Blind to downstream tokens</td>
                <td className="px-4 py-3.5 text-emerald-400 font-medium sm:px-6">Full 4-boundary topological graph</td>
              </tr>
              <tr>
                <td className="px-4 py-3.5 font-medium text-white sm:px-6">RFC 7009 Invalidation</td>
                <td className="px-4 py-3.5 text-rose-400/90 sm:px-6">Returns 200 OK without cascading</td>
                <td className="px-4 py-3.5 text-emerald-400 font-medium sm:px-6">Cascading grant & session destruction</td>
              </tr>
              <tr>
                <td className="px-4 py-3.5 font-medium text-white sm:px-6">Pre-Consent Interception</td>
                <td className="px-4 py-3.5 text-rose-400/90 sm:px-6">Post-breach discovery only</td>
                <td className="px-4 py-3.5 text-emerald-400 font-medium sm:px-6">Chrome MV3 pre-consent warning</td>
              </tr>
              <tr>
                <td className="px-4 py-3.5 font-medium text-white sm:px-6">Incident Triage</td>
                <td className="px-4 py-3.5 text-rose-400/90 sm:px-6">Manual SecOps investigation</td>
                <td className="px-4 py-3.5 text-emerald-400 font-medium sm:px-6">4-Agent consensus with MITRE mapping</td>
              </tr>
              <tr>
                <td className="px-4 py-3.5 font-medium text-white sm:px-6">CI/CD Enforcement</td>
                <td className="px-4 py-3.5 text-rose-400/90 sm:px-6">Not present</td>
                <td className="px-4 py-3.5 text-emerald-400 font-medium sm:px-6">Automated GitHub Action fail-on-risk</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom Launch Banner */}
      <section className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-900/40 via-slate-900/70 to-teal-900/40 p-8 sm:p-12 text-center shadow-2xl backdrop-blur-xl">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
            Stop guessing your non-human blast radius.
          </h2>
          <p className="mt-4 text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Test any OAuth URL, inspect your repositories, or detonate the live attack simulation in the security cockpit right now.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={onLaunchCockpit}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-blue-500/30 transition hover:brightness-110 active:scale-95"
            >
              Launch Security Cockpit
            </button>
            <button
              type="button"
              onClick={onOpenTools}
              className="rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-white/10 active:scale-95"
            >
              View CLI & CI/CD Docs
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
