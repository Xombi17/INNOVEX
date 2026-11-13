"use client";
import React, { useState } from "react";

interface LandingPageProps {
  onLaunchCockpit: () => void;
  onDetonateSimulation: () => void;
  onOpenSwarm: () => void;
  onOpenRemediation: () => void;
  onOpenTools: () => void;
}

export function LandingPage({
  onLaunchCockpit,
  onDetonateSimulation,
  onOpenSwarm,
  onOpenRemediation,
  onOpenTools,
}: LandingPageProps) {
  const [copiedCli, setCopiedCli] = useState(false);
  const [activeTabPreview, setActiveTabPreview] = useState<"domino" | "swarm" | "rfc7009">("domino");

  const copyCliCommand = () => {
    navigator.clipboard.writeText("npx @scopebomb/cli scan . --fail-on-risk 80");
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div className="relative w-full overflow-hidden text-slate-100">
      {/* Ambient background glow & grid */}
      <div className="pointer-events-none absolute inset-0 bg-deepseek-grid opacity-25" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-96 right-10 h-[400px] w-[600px] rounded-full bg-teal-500/8 blur-[100px]" />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-6xl px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-medium text-blue-400 backdrop-blur-md transition hover:border-blue-500/50">
            <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            <span>ScopeBomb v1.2 Enterprise · Non-Human Identity (NHI) Defense</span>
            <span className="rounded bg-blue-500/20 px-1.5 py-0.2 font-mono text-[10px] text-blue-300">RFC 7009</span>
          </div>

          {/* Punchy Headline */}
          <h1 className="mt-6 max-w-4xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl sm:leading-[1.15] lg:text-6xl">
            Your AI Bot Crosses <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">4 Trust Boundaries</span>.<br />
            Revoke Only Cleans 1.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            When OAuth returns <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm text-emerald-400">HTTP 200 OK</code>, developers assume their cloud is secure. Under RFC 7009, self-contained JWTs and local MCP tokens keep running across GitHub and AWS. ScopeBomb detonates and maps the full cross-issuer blast radius.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={onLaunchCockpit}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:brightness-110 active:scale-[0.98]"
            >
              <span>🚀 Launch Security Cockpit</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>

            <button
              type="button"
              onClick={onDetonateSimulation}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-300 backdrop-blur-md transition hover:bg-rose-500/20 active:scale-[0.98]"
            >
              <span>💥 Detonate Live Attack</span>
            </button>
          </div>

          {/* 1-Click Copyable CLI Pill */}
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900/80 px-3.5 py-1.5 font-mono text-xs text-slate-300 backdrop-blur-md">
            <span className="text-teal-400">$</span>
            <span className="truncate">npx @scopebomb/cli scan . --fail-on-risk 80</span>
            <button
              type="button"
              onClick={copyCliCommand}
              aria-label="Copy CLI command"
              className="ml-2 rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300 transition hover:bg-white/10"
            >
              {copiedCli ? "✓ Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* Interactive Feature Visual Teaser Card (DeepSeek/Harness Card Style) */}
        <div className="mt-14 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-1 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between border-b border-white/10 px-4 py-3 bg-slate-900/60">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-xs text-slate-400">scopebomb-detonator-core.mjs</span>
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-950 p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTabPreview("domino")}
                className={`rounded px-2.5 py-1 transition ${activeTabPreview === "domino" ? "bg-blue-600 text-white font-medium" : "text-slate-400 hover:text-white"}`}
              >
                Cascading Domino
              </button>
              <button
                type="button"
                onClick={() => setActiveTabPreview("swarm")}
                className={`rounded px-2.5 py-1 transition ${activeTabPreview === "swarm" ? "bg-blue-600 text-white font-medium" : "text-slate-400 hover:text-white"}`}
              >
                4-Agent Defense Swarm
              </button>
              <button
                type="button"
                onClick={() => setActiveTabPreview("rfc7009")}
                className={`rounded px-2.5 py-1 transition ${activeTabPreview === "rfc7009" ? "bg-blue-600 text-white font-medium" : "text-slate-400 hover:text-white"}`}
              >
                RFC 7009 Containment
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {activeTabPreview === "domino" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white">4-Hop Non-Human Identity Breach Chain</h3>
                    <p className="text-xs text-slate-400">Simulating Rohan MCP OAuth Trap across 4 independent security issuers</p>
                  </div>
                  <span className="rounded bg-rose-500/20 border border-rose-500/40 px-2 py-0.5 font-mono text-xs text-rose-300">
                    Blast Score: 94 / 100 (CRITICAL)
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-4">
                    <div className="text-[10px] font-mono uppercase text-teal-400">Hop 1 · Personal Identity</div>
                    <div className="mt-1 font-semibold text-white text-sm">OAuth Grant</div>
                    <div className="mt-2 text-xs text-slate-300">User approves Google Drive search scope for AI coworker assistant.</div>
                    <div className="mt-3 font-mono text-[10px] text-teal-300/80">Issuer: accounts.google.com</div>
                  </div>

                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                    <div className="text-[10px] font-mono uppercase text-amber-400">Hop 2 · Developer Local</div>
                    <div className="mt-1 font-semibold text-white text-sm">Unchecked File Read</div>
                    <div className="mt-2 text-xs text-slate-300">Bot accesses `.env.backup` file containing developer credentials.</div>
                    <div className="mt-3 font-mono text-[10px] text-amber-300/80">Path: /Developer/configs</div>
                  </div>

                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
                    <div className="text-[10px] font-mono uppercase text-rose-400">Hop 3 · Vendor SaaS</div>
                    <div className="mt-1 font-semibold text-white text-sm">GitHub Secret Pivot</div>
                    <div className="mt-2 text-xs text-slate-300">Bot clones private enterprise repositories via extracted PAT.</div>
                    <div className="mt-3 font-mono text-[10px] text-rose-300/80">Issuer: api.github.com</div>
                  </div>

                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 shadow-lg shadow-red-500/5">
                    <div className="text-[10px] font-mono uppercase text-red-400">Hop 4 · Production Cloud</div>
                    <div className="mt-1 font-semibold text-white text-sm">AWS STS Takeover</div>
                    <div className="mt-2 text-xs text-slate-300">CI/CD secrets leveraged to assume production admin IAM role.</div>
                    <div className="mt-3 font-mono text-[10px] text-red-300/80">Role: arn:aws:iam::prod:admin</div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-900/40 p-3 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping" />
                    <span>Clicking “Disconnect” on Google only revokes Hop 1. Hops 2, 3, and 4 remain completely compromised.</span>
                  </div>
                  <button
                    type="button"
                    onClick={onLaunchCockpit}
                    className="font-medium text-blue-400 hover:text-blue-300 underline underline-offset-2"
                  >
                    Open in Full Blast Graph →
                  </button>
                </div>
              </div>
            )}

            {activeTabPreview === "swarm" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white">4-Agent Autonomous Deliberation SOC</h3>
                    <p className="text-xs text-slate-400">Autonomous consensus triage streaming in real-time</p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenSwarm}
                    className="rounded bg-blue-500/20 border border-blue-500/40 px-3 py-1 text-xs font-semibold text-blue-300 hover:bg-blue-500/30"
                  >
                    Open Live Swarm SOC →
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-teal-400">
                      <span className="h-2 w-2 rounded-full bg-teal-400" />
                      IAM & Scope Auditor
                    </div>
                    <p className="mt-2 text-xs text-slate-300">
                      Identified <code>drive.readonly</code> escalation vector. Over-privileged scope allows read access to unconstrained file indices.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      Threat Modeler (STRIDE / MITRE)
                    </div>
                    <p className="mt-2 text-xs text-slate-300">
                      Mapped to MITRE ATT&CK T1566 & T1552. Lateral pivot from SaaS identity provider into CI/CD build pipelines.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-rose-400">
                      <span className="h-2 w-2 rounded-full bg-rose-400" />
                      RFC 7009 Compliance & Revocation Engine
                    </div>
                    <p className="mt-2 text-xs text-slate-300">
                      Standard Revoke endpoint reports 200 OK without downstream token invalidation. Cascade execution required across 3 issuers.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-indigo-400">
                      <span className="h-2 w-2 rounded-full bg-indigo-400" />
                      Incident Commander (Synthesizer)
                    </div>
                    <p className="mt-2 text-xs text-slate-300">
                      Consensus reached. Final blast rating: CRITICAL (94/100). Signed containment order dispatched to active remediation queue.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTabPreview === "rfc7009" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white">Multi-Cloud Invalidation & Cryptographic Audit Receipts</h3>
                    <p className="text-xs text-slate-400">True downstream session destruction vs cosmetic OAuth disconnect</p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenRemediation}
                    className="rounded bg-teal-500/20 border border-teal-500/40 px-3 py-1 text-xs font-semibold text-teal-300 hover:bg-teal-500/30"
                  >
                    Open Containment Center →
                  </button>
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4 font-mono text-xs">
                  <div className="text-slate-400">// Sample Audit Receipt emitted by ScopeBomb Containment Engine</div>
                  <div className="mt-2 text-emerald-400">{`{`}</div>
                  <div className="ml-4 text-slate-300">{`"receipt_id": "SCOPEBOMB-REMED-20261113-AF89E",`}</div>
                  <div className="ml-4 text-slate-300">{`"target_action": "revoke_oauth_app",`}</div>
                  <div className="ml-4 text-slate-300">{`"provider": "github",`}</div>
                  <div className="ml-4 text-slate-300">{`"endpoint_hit": "DELETE /applications/Iv1.8a2b3c/grant",`}</div>
                  <div className="ml-4 text-slate-300">{`"rfc_7009_status": "TRUE_DOWNSTREAM_CONTAINMENT",`}</div>
                  <div className="ml-4 text-slate-300">{`"invalidated_sessions": 3,`}</div>
                  <div className="ml-4 text-slate-300">{`"sha256_proof": "a8f5b2...9e41d8"`}</div>
                  <div className="text-emerald-400">{`}`}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5 Core Capability Pillars Grid (Harness/DeepSeek clean cards) */}
      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-blue-400">Comprehensive Defense Architecture</span>
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
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">Cross-Issuer Domino Graph</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Traverses across personal Google identities, local developer environments, GitHub organizations, and AWS IAM roles with sub-50ms topological blast radius computation.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="glow-card-cyan rounded-xl p-6 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">4-Agent Autonomous Swarm</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Parallel Gemini 3.x Flash agents simultaneously audit permissions, model MITRE attack vectors, check RFC 7009 compliance, and synthesize remediation orders.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="glow-card-blue rounded-xl p-6 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">RFC 7009 True Containment</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Direct API integrations for GitHub grant revocation and AWS STS credential invalidation with cryptographic SHA-256 audit receipts that satisfy SOC2 criteria.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="glow-card-cyan rounded-xl p-6 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">Chrome MV3 Pre-Consent Guard</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Intercepts OAuth consent screens in the browser before the user clicks “Allow”. Zero PKCE corruption, 100% pre-token visibility.
            </p>
          </div>

          {/* Pillar 5 */}
          <div className="glow-card-blue rounded-xl p-6 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">CI/CD Enterprise Gate & CLI</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Lightweight zero-dependency CLI (<code>npx @scopebomb/cli scan .</code>) and official GitHub Action to automatically fail pull requests on high risk scores.
            </p>
          </div>

          {/* Pillar 6 */}
          <div className="glow-card-cyan rounded-xl p-6 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">Zero-Knowledge Local Parsing</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              All URL inspection, AST tokens, and config audits occur client-side in pure TypeScript without secret leakage to third-party endpoints.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Table: Status Quo vs ScopeBomb */}
      <section className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-teal-400">Architecture Evaluation</span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Why Standard OAuth Disconnect Fails
          </h2>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 shadow-xl backdrop-blur-md">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-white/10 bg-slate-900/60 text-slate-400 font-mono text-[11px] uppercase">
              <tr>
                <th className="px-4 py-3 sm:px-6">Security Dimension</th>
                <th className="px-4 py-3 text-slate-400 sm:px-6">Status Quo ("Disconnect" Button)</th>
                <th className="px-4 py-3 text-blue-400 sm:px-6">ScopeBomb Defense Mesh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              <tr>
                <td className="px-4 py-3.5 font-medium text-white sm:px-6">Cross-Issuer Awareness</td>
                <td className="px-4 py-3.5 text-rose-400/90 sm:px-6">❌ Blind to downstream tokens</td>
                <td className="px-4 py-3.5 text-emerald-400 font-medium sm:px-6">✓ Full 4-boundary topological graph</td>
              </tr>
              <tr>
                <td className="px-4 py-3.5 font-medium text-white sm:px-6">RFC 7009 Invalidation</td>
                <td className="px-4 py-3.5 text-rose-400/90 sm:px-6">❌ Returns 200 OK without cascading</td>
                <td className="px-4 py-3.5 text-emerald-400 font-medium sm:px-6">✓ Cascading grant & session destruction</td>
              </tr>
              <tr>
                <td className="px-4 py-3.5 font-medium text-white sm:px-6">Pre-Consent Interception</td>
                <td className="px-4 py-3.5 text-rose-400/90 sm:px-6">❌ Post-breach discovery only</td>
                <td className="px-4 py-3.5 text-emerald-400 font-medium sm:px-6">✓ Chrome MV3 pre-consent warning</td>
              </tr>
              <tr>
                <td className="px-4 py-3.5 font-medium text-white sm:px-6">Incident Triage</td>
                <td className="px-4 py-3.5 text-rose-400/90 sm:px-6">❌ Manual SecOps investigation</td>
                <td className="px-4 py-3.5 text-emerald-400 font-medium sm:px-6">✓ 4-Agent consensus with MITRE mapping</td>
              </tr>
              <tr>
                <td className="px-4 py-3.5 font-medium text-white sm:px-6">CI/CD Enforcement</td>
                <td className="px-4 py-3.5 text-rose-400/90 sm:px-6">❌ Not present</td>
                <td className="px-4 py-3.5 text-emerald-400 font-medium sm:px-6">✓ Automated GitHub Action fail-on-risk</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Real-World Threat Matrix */}
      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-rose-400">Threat Matrix (2024–2026)</span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Proven Attack Scenarios Handled
            </h2>
          </div>
          <button
            type="button"
            onClick={onLaunchCockpit}
            className="mt-4 sm:mt-0 text-xs font-semibold text-blue-400 hover:text-blue-300"
          >
            Audit Your Own OAuth Link →
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
            <span className="rounded bg-rose-500/20 px-2 py-0.5 font-mono text-[10px] text-rose-300">Incident 01</span>
            <h3 className="mt-3 text-sm font-semibold text-white">Rohan MCP OAuth Trap</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              An agent requesting innocent Google Drive search accesses developer config backups, extracting GitHub PATs to steal proprietary code.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
            <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] text-amber-300">Incident 02</span>
            <h3 className="mt-3 text-sm font-semibold text-white">Slack AI Prompt Exfiltration</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Indirect prompt injection tricking an enterprise Slack bot into reading private channel messages and leaking secrets via webhook.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-5">
            <span className="rounded bg-teal-500/20 px-2 py-0.5 font-mono text-[10px] text-teal-300">Incident 03</span>
            <h3 className="mt-3 text-sm font-semibold text-white">Over-Scoped Google Drive Bot</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Requesting <code>https://www.googleapis.com/auth/drive</code> when only read-only metadata was needed, granting unlimited write and delete capabilities.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom Launch Banner */}
      <section className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-900/40 via-slate-900/60 to-teal-900/40 p-8 sm:p-12 text-center shadow-2xl backdrop-blur-xl">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
            Stop guessing your non-human blast radius.
          </h2>
          <p className="mt-4 text-sm text-slate-300 max-w-xl mx-auto">
            Test any OAuth URL, inspect your repositories, or detonate the live attack simulation in the security cockpit right now.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={onLaunchCockpit}
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-500 active:scale-95"
            >
              Launch Security Cockpit
            </button>
            <button
              type="button"
              onClick={onOpenTools}
              className="rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-95"
            >
              View CLI & CI/CD Docs
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
