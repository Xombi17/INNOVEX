"use client";
import React from "react";
import type { IncidentPresetSummary } from "@/lib/auditAdapter";

const PRESET_SHORT_NAMES: Record<string, string> = {
  rohan_mcp_oauth_trap: "Shadow-AI MCP + OAuth",
  midnight_blizzard_2024: "Midnight Blizzard",
  salesloft_drift_2025: "Salesloft Drift fan-out",
  context_ai_vercel_2026: "Context.ai Workspace",
  litellm_ci_2026: "LiteLLM CI key leak",
};

interface PresetStripProps {
  presets: IncidentPresetSummary[];
  activePresetId: string | null;
  onSelectPreset: (preset: IncidentPresetSummary) => void;
}

export function PresetStrip({
  presets,
  activePresetId,
  onSelectPreset,
}: PresetStripProps) {
  return (
    <div className="border-t border-[#1e2636] px-5 py-3.5">
      <div className="mb-2 text-[13px] font-medium text-slate-400">
        Choose an illustrative scenario (not a forensic reconstruction):
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((preset) => {
          const isActive = activePresetId === preset.preset_id;
          return (
            <button
              key={preset.preset_id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              aria-pressed={isActive}
              className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-3.5 text-[13px] whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? "border-teal-400 bg-teal-500 text-[#03211b] font-semibold shadow-sm shadow-teal-500/25"
                  : "border-[#2b3548] bg-[#141924] text-slate-300 hover:border-slate-600 hover:bg-[#1a2130] hover:text-white"
              }`}
            >
              {PRESET_SHORT_NAMES[preset.preset_id] ?? preset.title} ·{" "}
              {preset.year}
            </button>
          );
        })}
      </div>
    </div>
  );
}
