// Generated from packages/engine/catalog.ts by scripts/build.mjs — do not edit manually.
import data from "./scope_catalog.js";
                                                                                          

// Keep the frozen catalog as the only source of scope capabilities and presets.
export const catalog = data     
                  
                              
                                                 
 ;

export const riskScores                           = { low: 15, medium: 50, high: 75, critical: 95 };

export function findScope(provider            , scope        )                                {
  return catalog.scopes.find(entry => entry.provider === provider && entry.scope_id === scope);
}

export function scopeSeverity(provider            , scope        )           {
  const entry = findScope(provider, scope);
  if (entry) return entry.severity;
  if ((provider === "google" && scope === "https://www.googleapis.com/auth/gmail.readonly") ||
      (provider === "microsoft" && scope === "Mail.Read")) return "high";
  const baseline                                        = {
    google: ["openid", "email", "profile"],
    github: ["read:user", "read:org"],
    microsoft: ["openid", "email", "profile", "User.Read", "offline_access"],
  };
  return baseline[provider]?.includes(scope) ? "low" : "medium";
}

export function sortedUnique(values          )           {
  return [...new Set(values)].sort();
}
