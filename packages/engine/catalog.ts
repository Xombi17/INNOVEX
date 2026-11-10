import data from "../../data/scope_catalog.json" with { type: "json" };
import type { ProviderId, ScopeCatalogEntry, Severity } from "../../contracts/index.d.ts";

// Keep the frozen catalog as the only source of scope capabilities and presets.
export const catalog = data as {
  version: string;
  scopes: ScopeCatalogEntry[];
  incident_presets: typeof data.incident_presets;
};

export const riskScores: Record<Severity, number> = { low: 15, medium: 50, high: 75, critical: 95 };

export function findScope(provider: ProviderId, scope: string): ScopeCatalogEntry | undefined {
  return catalog.scopes.find(entry => entry.provider === provider && entry.scope_id === scope);
}

export function scopeSeverity(provider: ProviderId, scope: string): Severity {
  const entry = findScope(provider, scope);
  if (entry) return entry.severity;
  if ((provider === "google" && scope === "https://www.googleapis.com/auth/gmail.readonly") ||
      (provider === "microsoft" && scope === "Mail.Read")) return "high";
  const baseline: Partial<Record<ProviderId, string[]>> = {
    google: ["openid", "email", "profile"],
    github: ["read:user", "read:org"],
    microsoft: ["openid", "email", "profile", "User.Read", "offline_access"],
  };
  return baseline[provider]?.includes(scope) ? "low" : "medium";
}

export function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}
