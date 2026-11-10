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

  return (
    <main className="min-h-screen pb-10">
      <ScopeBombArena initialReport={initialReport} />
      <footer className="mx-auto mt-2 flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 text-[11px] text-slate-500 sm:px-6 lg:px-8">
        <span>
          ScopeBomb · INNOVEX 2026 (PS 05) · Deterministic offline-first policy engine (zero live mutations)
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <span>
            Local CLI: <code className="text-slate-400">node packages/engine/cli.ts . --json</code>
          </span>
          <a
            href="https://github.com/Xombi17/INNOVEX"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:text-sky-300"
          >
            GitHub + Chrome MV3 Extension ↗
          </a>
        </div>
      </footer>
    </main>
  );
}
