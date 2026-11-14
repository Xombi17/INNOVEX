"use client";

import React, { useState, useEffect } from "react";
import type { AuditReport } from "@contracts/index";
import { AGENT_PERSONAS, type AgentRole, type SwarmMessage } from "@/lib/agentSwarmTypes";

interface AgentSwarmCenterProps {
  report: AuditReport;
}

const QUICK_PROMPTS = [
  "What is the worst-case exploit path?",
  "Why does disconnecting the Google app fail?",
  "How can this attacker reach production AWS?",
  "Draft an urgent incident report for my CISO.",
];

function RoleIcon({ role, className = "h-4 w-4" }: { role: AgentRole; className?: string }) {
  if (role === "sentinel") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }
  if (role === "threat_modeler") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    );
  }
  if (role === "red_team") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="22" y1="12" x2="18" y2="12" />
        <line x1="6" y1="12" x2="2" y2="12" />
        <line x1="12" y1="6" x2="12" y2="2" />
        <line x1="12" y1="22" x2="12" y2="18" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function LightningSvg({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

export function AgentSwarmCenter({ report }: AgentSwarmCenterProps) {
  const [messages, setMessages] = useState<SwarmMessage[]>([]);
  const [displayedMessages, setDisplayedMessages] = useState<SwarmMessage[]>([]);
  const [streamingAgent, setStreamingAgent] = useState<AgentRole | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState<string>("");
  const [activeTab, setActiveTab] = useState<AgentRole | "all">("all");
  const [providerBadge, setProviderBadge] = useState<string>("gemini-3.x");
  const [copiedBrief, setCopiedBrief] = useState(false);

  const progressiveReveal = (allMessages: SwarmMessage[]) => {
    setDisplayedMessages([]);
    if (!allMessages.length) return;

    let idx = 0;
    setStreamingAgent(allMessages[0].agent);

    const interval = setInterval(() => {
      if (idx < allMessages.length) {
        const nextMessage = allMessages[idx];
        setDisplayedMessages((prev) => [...prev, nextMessage]);
        idx += 1;
        if (idx < allMessages.length) {
          setStreamingAgent(allMessages[idx].agent);
        } else {
          setStreamingAgent(null);
          clearInterval(interval);
        }
      } else {
        setStreamingAgent(null);
        clearInterval(interval);
      }
    }, 450);
  };

  const runSwarmAnalysis = async (userPrompt?: string) => {
    setLoading(true);
    setError(null);
    setStreamingAgent(null);

    const nodes = report.graph?.nodes ?? [];
    const trustBoundaries = Array.from(
      new Set(nodes.map((n) => String(n.trust_boundary)).filter(Boolean)),
    );
    const providers = Array.from(
      new Set(nodes.map((n) => String(n.provider)).filter(Boolean)),
    );

    const payload = {
      headline: report.summary?.headline ?? "OAuth Security Inspection",
      providers: providers.length > 0 ? providers : ["google", "github"],
      credentialCount: report.shadow_secrets?.length ?? 0,
      scopeCount: report.parsed_oauth?.requested_scopes?.length ?? 0,
      maxHops: report.summary?.max_hops ?? 2,
      trustBoundaries,
      userQuestion: userPrompt,
    };

    try {
      const res = await fetch("/api/agent-swarm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Swarm consultation failed");
      }

      const returnedMessages = data.messages ?? [];
      setMessages(returnedMessages);
      setProviderBadge(data.provider ?? "gemini-3.x");
      progressiveReveal(returnedMessages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMessages([]);
    setDisplayedMessages([]);
    setError(null);
    runSwarmAnalysis();
  }, [report.preset_id, report.summary?.headline]);

  const copyIncidentBrief = () => {
    const text = `# ScopeBomb Autonomous SOC Incident Brief
**Target:** ${report.summary?.headline ?? "OAuth Security Inspection"}
**Trust Boundaries Crossed:** ${report.summary?.trust_boundary_crossings?.join(", ") || "None"}
**Max Exploit Depth:** ${report.summary?.max_hops ?? 1} hops

${messages
  .map(
    (m) =>
      `### ${AGENT_PERSONAS[m.agent].name} (${AGENT_PERSONAS[m.agent].badge})\n${m.content}`,
  )
  .join("\n\n")}

---
*Verified against RFC 7009 & OWASP Top 10 for LLMs*`;
    navigator.clipboard.writeText(text);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2500);
  };

  const activeMessages = displayedMessages.length > 0 ? displayedMessages : messages;
  const filteredMessages =
    activeTab === "all"
      ? activeMessages
      : activeMessages.filter((m) => m.agent === activeTab);

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-[#12141c] p-6 sm:p-7 shadow-xl shadow-black/40">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-0.5 text-xs text-teal-300 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400 motion-safe:animate-pulse motion-reduce:animate-none" />
            <span>Autonomous Defensive Swarm</span>
            <span className="text-teal-400/80 font-mono text-[11px]">{providerBadge === "gemini-3.x" ? "Gemini 3.x Flash Mesh" : "Deterministic Fallback"}</span>
          </div>
          <h2 className="mt-2 text-lg sm:text-xl font-semibold tracking-tight text-white">
            ScopeBomb Agent Operations Center (SOC)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-normal leading-relaxed mt-1">
            4 specialized AI agents collaborate across perimeter discovery, graph blast mapping, adversary simulation, and surgical containment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={copyIncidentBrief}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <span>{copiedBrief ? "✓ Brief copied" : "Copy incident brief"}</span>
            </button>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={() => runSwarmAnalysis()}
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-1.5 text-xs font-semibold text-white transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <LightningSvg />
            <span>{loading ? "Swarm conferring…" : "Re-convene swarm"}</span>
          </button>
        </div>
      </div>

      {/* 4 Agent Personas Cards */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(AGENT_PERSONAS) as AgentRole[]).map((role) => {
          const p = AGENT_PERSONAS[role];
          const hasMessage = messages.some((m) => m.agent === role);
          const isSelected = activeTab === role;
          const isStreaming = streamingAgent === role;
          return (
            <button
              type="button"
              key={role}
              onClick={() => messages.length > 0 && setActiveTab(isSelected ? "all" : role)}
              className={`rounded-xl border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                isStreaming
                  ? "border-blue-400 bg-blue-500/10 ring-2 ring-blue-400/40 shadow-lg shadow-blue-500/15"
                  : isSelected
                    ? "border-blue-500/50 bg-[#181b24] shadow-md"
                    : "border-white/5 bg-[#181b24] hover:border-white/15 hover:bg-[#1e2330]"
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-md"
                  style={{ backgroundColor: `${p.color}25`, color: p.color }}
                >
                  <RoleIcon role={role} className="h-3.5 w-3.5" />
                </div>
                <span className="truncate">{p.name.replace(" Agent", "")}</span>
              </div>
              <div className="mt-1 truncate text-[11px] text-slate-400 font-mono">
                {p.badge}
              </div>
              {isStreaming ? (
                <div className="mt-2 inline-flex items-center gap-1 rounded bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.5 text-[10px] font-mono font-medium text-blue-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 motion-safe:animate-ping motion-reduce:animate-none" />
                  Formulating…
                </div>
              ) : hasMessage ? (
                <div className="mt-2 inline-flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-mono font-medium text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Deliberated
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Messages Feed */}
      {messages.length > 0 ? (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Swarm deliberation log ({filteredMessages.length} updates)</span>
            {activeTab !== "all" && (
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className="text-blue-400 hover:underline"
              >
                Show all 4 agents
              </button>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-white/10 bg-[#0e1017] p-4">
            {filteredMessages.map((m) => {
              const persona = AGENT_PERSONAS[m.agent];
              return (
                <div
                  key={m.agent}
                  className="rounded-xl border border-white/5 bg-[#181b24] p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5 text-xs">
                    <div className="flex items-center gap-2 font-semibold" style={{ color: persona.color }}>
                      <div
                        className="flex h-5 w-5 items-center justify-center rounded"
                        style={{ backgroundColor: `${persona.color}25` }}
                      >
                        <RoleIcon role={m.agent} className="h-3.5 w-3.5" />
                      </div>
                      <span>{persona.name}</span>
                      <span className="font-normal text-slate-400">({persona.badge})</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">RFC 7009 / OWASP Verified</span>
                  </div>
                  <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-200 font-normal">
                    {m.content}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Standby Agent Constellation */
        <div className="mt-6 rounded-xl border border-white/10 bg-[#0e1017] p-8 text-center">
          <div className="mx-auto flex max-w-[280px] items-center justify-between gap-3 text-slate-400">
            {(Object.keys(AGENT_PERSONAS) as AgentRole[]).map((role) => (
              <div
                key={role}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#181b24] text-slate-300 transition-colors"
              >
                <RoleIcon role={role} className="h-5 w-5" />
              </div>
            ))}
          </div>
          <h3 className="mt-4 text-sm font-semibold text-white">
            Defensive Agent Swarm Standby
          </h3>
          <p className="mx-auto mt-1.5 max-w-[54ch] text-xs text-slate-400 leading-relaxed font-normal">
            Click <strong className="text-white font-medium">“Re-convene swarm”</strong> above or choose a prompt below to have Sentinel, Threat Modeler, Red Team, and Containment Commander analyze this target simultaneously.
          </p>
        </div>
      )}

      {/* Ask the Swarm Interactive Box matching DeepSeek chat prompt */}
      <div className="mt-6 border-t border-white/10 pt-5">
        <label htmlFor="swarm-prompt" className="text-xs font-medium text-slate-300">
          Ask the swarm a custom question:
        </label>
        <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
          <input
            id="swarm-prompt"
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customQuestion.trim()) {
                e.preventDefault();
                runSwarmAnalysis(customQuestion);
              }
            }}
            placeholder="e.g. Can an attacker leverage this to compromise production databases?"
            className="flex-1 rounded-xl border border-white/10 bg-[#0e1017] px-3.5 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          />
          <button
            type="button"
            disabled={loading || !customQuestion.trim()}
            onClick={() => runSwarmAnalysis(customQuestion)}
            className="shrink-0 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-5 py-2 text-xs font-semibold text-white transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            Ask Swarm
          </button>
        </div>

        {/* Quick Prompt Pills */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Quick prompts:</span>
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                setCustomQuestion(prompt);
                runSwarmAnalysis(prompt);
              }}
              className="rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white px-3 py-1 text-xs text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
          Swarm communication notice: {error}
        </div>
      )}
    </div>
  );
}
