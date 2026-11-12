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
    <div className="mt-6 rounded-xl border-2 border-[#131416] bg-white p-5 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8eaec] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#e6f2f5] px-3 py-0.5 text-xs font-semibold text-[#155768]">
            <span className="inline-block h-2 w-2 rounded-full bg-[#1b6c80] animate-pulse" />
            Autonomous Defensive Swarm · {providerBadge === "gemini-3.x" ? "Gemini 3.x Active" : "Deterministic Fallback"}
          </div>
          <h2 className="mt-1.5 text-lg font-bold text-[#131416]">
            ScopeBomb Agent Operations Center (SOC)
          </h2>
          <p className="text-xs text-[#5d5f60]">
            4 specialized AI agents collaborate to discover perimeter risks, map attack paths, simulate adversary impact, and enforce surgical containment.
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => runSwarmAnalysis()}
          className="control control-primary shrink-0 px-4 py-2 text-xs font-semibold disabled:opacity-60"
        >
          {loading ? "Swarm Conferring…" : "⚡ Convene Agent Swarm"}
        </button>
      </div>

      {/* 4 Agent Personas Pill Bar */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(Object.keys(AGENT_PERSONAS) as AgentRole[]).map((role) => {
          const p = AGENT_PERSONAS[role];
          const hasMessage = messages.some((m) => m.agent === role);
          return (
            <div
              key={role}
              onClick={() => messages.length > 0 && setActiveTab(activeTab === role ? "all" : role)}
              className={`cursor-pointer rounded-lg border p-2.5 transition ${
                activeTab === role
                  ? "border-[#131416] bg-[#f4f6f8] shadow-sm"
                  : "border-[#e8eaec] bg-[#f9fbfc] hover:border-[#cdced1]"
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#131416]">
                <span>{p.avatar}</span>
                <span className="truncate">{p.name.replace(" Agent", "")}</span>
              </div>
              <div className="mt-0.5 truncate text-[11px] text-[#5d5f60]">
                {p.badge}
              </div>
              {hasMessage && (
                <div className="mt-1 inline-block rounded bg-[#dcfce7] px-1.5 py-0.2 text-[10px] font-semibold text-[#166534]">
                  Delivered
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Messages Feed */}
      {messages.length > 0 ? (
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-medium text-[#5d5f60]">
            <span>Swarm Deliberation Log ({filteredMessages.length} updates)</span>
            {activeTab !== "all" && (
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className="text-[#1b6c80] hover:underline"
              >
                Show all 4 agents
              </button>
            )}
          </div>

          <div className="space-y-3 rounded-lg border border-[#e8eaec] bg-[#fafafa] p-4">
            {filteredMessages.map((m) => {
              const persona = AGENT_PERSONAS[m.agent];
              return (
                <div
                  key={m.agent}
                  className="rounded-md border border-[#e8eaec] bg-white p-3.5 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-[#f0f1f2] pb-1.5 text-xs">
                    <div className="flex items-center gap-1.5 font-bold" style={{ color: persona.color }}>
                      <span>{persona.avatar}</span>
                      <span>{persona.name}</span>
                      <span className="font-normal text-[#5d5f60]">· {persona.badge}</span>
                    </div>
                    <span className="text-[11px] text-[#8a8d91]">Verified Protocol</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[#131416]">
                    {m.content}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-[#cdced1] bg-[#f9fbfc] p-6 text-center">
          <div className="text-2xl">🤖 🛡️ 🕸️ ⚔️</div>
          <h3 className="mt-2 text-sm font-semibold text-[#131416]">
            Agent Swarm Ready on Standby
          </h3>
          <p className="mx-auto mt-1 max-w-[50ch] text-xs text-[#5d5f60]">
            Click <strong>“Convene Agent Swarm”</strong> above or choose a question below to have Sentinel, Threat Modeler, Red Team, and Containment Commander evaluate this target simultaneously.
          </p>
        </div>
      )}

      {/* Ask the Swarm Interactive Box */}
      <div className="mt-5 border-t border-[#e8eaec] pt-4">
        <label htmlFor="swarm-prompt" className="text-xs font-semibold text-[#131416]">
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
            className="h-9 w-full rounded-md border border-[#cdced1] bg-white px-3 text-xs text-[#131416] placeholder:text-[#8a8d91]"
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
          <span className="self-center text-[11px] text-[#5d5f60]">Quick prompts:</span>
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                setCustomQuestion(prompt);
                runSwarmAnalysis(prompt);
              }}
              className="rounded-full border border-[#dce0e3] bg-[#f4f6f8] px-2.5 py-0.5 text-[11px] text-[#131416] transition hover:border-[#131416] hover:bg-white"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-md bg-[#fee2e2] p-2.5 text-xs text-[#991b1b]">
          Swarm communication notice: {error}
        </div>
      )}
    </div>
  );
}
