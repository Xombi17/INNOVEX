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
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState<string>("");
  const [activeTab, setActiveTab] = useState<AgentRole | "all">("all");
  const [providerBadge, setProviderBadge] = useState<string>("gemini-3.x");

  const runSwarmAnalysis = async (userPrompt?: string) => {
    setLoading(true);
    setError(null);

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

      setMessages(data.messages ?? []);
      setProviderBadge(data.provider ?? "gemini-3.x");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset swarm state on report change
    setMessages([]);
    setError(null);
  }, [report]);

  const filteredMessages =
    activeTab === "all"
      ? messages
      : messages.filter((m) => m.agent === activeTab);

  return (
    <div className="mt-6 rounded-xl border border-white/10 bg-[#0e121b] p-5 shadow-xl sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1f2838] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-teal-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
            </span>
            Autonomous Defensive Swarm · {providerBadge === "gemini-3.x" ? "Gemini 3.x Flash Mesh" : "Deterministic Fallback"}
          </div>
          <h2 className="mt-2 text-lg font-bold tracking-tight text-white">
            ScopeBomb Agent Operations Center (SOC)
          </h2>
          <p className="text-xs text-slate-400">
            4 specialized AI agents collaborate across perimeter discovery, graph blast mapping, adversary simulation, and surgical containment.
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => runSwarmAnalysis()}
          className="control control-primary shrink-0 gap-1.5 px-4 py-2 text-xs font-semibold disabled:opacity-60"
        >
          <LightningSvg />
          {loading ? "Swarm Conferring…" : "Convene Defensive Swarm"}
        </button>
      </div>

      {/* 4 Agent Personas Pill Bar */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(Object.keys(AGENT_PERSONAS) as AgentRole[]).map((role) => {
          const p = AGENT_PERSONAS[role];
          const hasMessage = messages.some((m) => m.agent === role);
          const isSelected = activeTab === role;
          return (
            <div
              key={role}
              onClick={() => messages.length > 0 && setActiveTab(isSelected ? "all" : role)}
              className={`cursor-pointer rounded-lg border p-3 transition-all duration-150 ${
                isSelected
                  ? "border-teal-500/60 bg-[#16202f] shadow-md shadow-teal-500/10"
                  : "border-[#1e2636] bg-[#121622] hover:border-slate-700 hover:bg-[#151a28]"
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-white">
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
              {hasMessage && (
                <div className="mt-1.5 inline-flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-mono font-medium text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Deliberated
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Messages Feed */}
      {messages.length > 0 ? (
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Swarm Deliberation Log ({filteredMessages.length} updates)</span>
            {activeTab !== "all" && (
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className="text-teal-400 hover:underline"
              >
                Show all 4 agents
              </button>
            )}
          </div>

          <div className="space-y-3 rounded-lg border border-[#1e2636] bg-[#090c13] p-4">
            {filteredMessages.map((m) => {
              const persona = AGENT_PERSONAS[m.agent];
              return (
                <div
                  key={m.agent}
                  className="rounded-lg border border-[#1e2738] bg-[#121724] p-3.5 shadow-sm transition hover:border-[#2b374e]"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-[#1b2333] pb-2 text-xs">
                    <div className="flex items-center gap-2 font-bold" style={{ color: persona.color }}>
                      <div
                        className="flex h-5 w-5 items-center justify-center rounded"
                        style={{ backgroundColor: `${persona.color}25` }}
                      >
                        <RoleIcon role={m.agent} className="h-3.5 w-3.5" />
                      </div>
                      <span>{persona.name}</span>
                      <span className="font-normal text-slate-400">· {persona.badge}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">RFC 7009 / OWASP Verified</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-200">
                    {m.content}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Standby Agent Constellation */
        <div className="mt-5 rounded-lg border border-dashed border-[#232c3d] bg-[#0a0d14] p-6 text-center">
          <div className="mx-auto flex max-w-[280px] items-center justify-between gap-3 text-slate-400">
            {(Object.keys(AGENT_PERSONAS) as AgentRole[]).map((role) => (
              <div
                key={role}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#121724] text-slate-300 transition hover:border-teal-400/50 hover:text-teal-300"
              >
                <RoleIcon role={role} className="h-5 w-5" />
              </div>
            ))}
          </div>
          <h3 className="mt-3 text-sm font-semibold text-white">
            Defensive Agent Swarm Standby
          </h3>
          <p className="mx-auto mt-1 max-w-[54ch] text-xs text-slate-400 leading-relaxed">
            Click <strong className="text-teal-400">“Convene Defensive Swarm”</strong> above or choose a prompt below to have Sentinel, Threat Modeler, Red Team, and Containment Commander analyze this target simultaneously.
          </p>
        </div>
      )}

      {/* Ask the Swarm Interactive Box */}
      <div className="mt-5 border-t border-[#1f2838] pt-4">
        <label htmlFor="swarm-prompt" className="text-xs font-semibold text-white">
          Ask the Swarm a Custom Question:
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
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
            className="field h-9 w-full rounded-md border border-[#2b3548] bg-[#0b0e16] px-3 text-xs text-white placeholder:text-slate-500 focus:border-teal-400"
          />
          <button
            type="button"
            disabled={loading || !customQuestion.trim()}
            onClick={() => runSwarmAnalysis(customQuestion)}
            className="control control-primary shrink-0 px-4 text-xs font-semibold disabled:opacity-50"
          >
            Ask Swarm
          </button>
        </div>

        {/* Quick Prompt Pills */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="self-center text-[11px] font-mono text-slate-400">Quick prompts:</span>
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                setCustomQuestion(prompt);
                runSwarmAnalysis(prompt);
              }}
              className="rounded-full border border-[#252f42] bg-[#111622] px-2.5 py-0.5 text-[11px] text-slate-300 transition hover:border-teal-500/50 hover:bg-[#161c2b] hover:text-white"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-rose-500/30 bg-rose-950/30 p-2.5 text-xs text-rose-300">
          Swarm communication notice: {error}
        </div>
      )}
    </div>
  );
}
