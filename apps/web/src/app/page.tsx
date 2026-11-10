import { ScopeBombArena } from "@/components/ScopeBombArena";
import { getIncidentPresets, runScopeBombAudit } from "@/lib/auditAdapter";

export default function HomePage() {
  const presets = getIncidentPresets();
  const initialReport = runScopeBombAudit({
    mode: "incident_preset",
    raw_payload: presets[0]?.sample_oauth_url ?? "",
    preset_id: "rohan_mcp_oauth_trap",
    simulation_mode: "naive_single_revoke",
  });

  return <ScopeBombArena initialReport={initialReport} />;
}
