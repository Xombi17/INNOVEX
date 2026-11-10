import type {
  AuditInput,
  AuditReport,
  ScopeCatalogEntry,
} from "@contracts/index";
import { analyzeAudit } from "@scopebomb/engine";
import scopeCatalogJson from "@data/scope_catalog.json";

export interface IncidentPresetSummary {
  preset_id: string;
  title: string;
  year: number;
  classification: string;
  summary: string;
  sample_oauth_url: string;
  sample_mcp_config: string | null;
}

export type AuditResult =
  | { ok: true; report: AuditReport }
  | { ok: false; error: string };

const catalogScopes = scopeCatalogJson.scopes as ScopeCatalogEntry[];
const incidentPresets =
  scopeCatalogJson.incident_presets as IncidentPresetSummary[];

export function getIncidentPresets(): IncidentPresetSummary[] {
  return incidentPresets;
}

export function getCatalogScopes(): ScopeCatalogEntry[] {
  return catalogScopes;
}

export function runScopeBombAudit(input: AuditInput): AuditReport {
  return analyzeAudit(input);
}

export function tryRunScopeBombAudit(input: AuditInput): AuditResult {
  try {
    return { ok: true, report: analyzeAudit(input) };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error && err.message
          ? err.message
          : "Unable to parse input payload.",
    };
  }
}
