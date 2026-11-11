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
    <div className="border-t border-[#f0f1f2] px-5 py-3.5">
      <div className="mb-2 text-[13px] font-medium text-[#5d5f60]">
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
              className={`inline-flex min-h-11 shrink-0 items-center rounded-[9999px] border px-3 text-[13px] whitespace-nowrap transition ${
                isActive
                  ? "border-[#131416] bg-[#131416] text-[#ffffff]"
                  : "border-[#cdced1] bg-[#ffffff] text-[#5d5f60] hover:bg-[#f4f6f8] hover:text-[#131416]"
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
