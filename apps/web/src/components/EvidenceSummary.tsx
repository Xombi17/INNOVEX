import type { Analysis } from "@/lib/analysis";

export function EvidenceSummary({ analysis }: { analysis: Analysis }) {
  const { context, report } = analysis;
  const found = context.evidence.filter((item) => item.kind !== "placeholder");
  const placeholders = context.evidence.filter(
    (item) => item.kind === "placeholder",
  );
  return (
    <section
      aria-label="Results and supporting evidence"
      className="space-y-6 pt-2 [overflow-wrap:anywhere]"
    >
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">What this input tells us</h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-400 font-normal leading-relaxed">
          {found.length
            ? `${found.length} permission or configuration finding${found.length === 1 ? "" : "s"} to review.`
            : "No recognized credentials or permissions found in the inspected input."}{" "}
          This does not establish whether an account is compromised.
        </p>
      </div>

      {context.coverage && (
        <div className="rounded-2xl border border-white/10 bg-[#12141c] p-5 text-xs text-slate-300 shadow-xl shadow-black/40">
          <strong className="text-sm font-semibold text-white">
            {context.coverage.partial
              ? "Partial repository check"
              : "Selected-file repository check"}
          </strong>
          <p className="mt-1.5 text-slate-400 leading-relaxed font-normal">
            Inspected {context.coverage.inspected.length} of{" "}
            {context.coverage.matchingFiles} matching files. Limit: 8 files, 64
            KiB per file. History, private content, other files and effective
            permissions were not inspected.
          </p>
          {context.coverage.revision && (
            <p className="mt-2 break-all text-slate-400">
              Revision: <code className="rounded-lg bg-[#0e1017] px-2 py-0.5 text-teal-300 font-mono text-[11px] border border-white/5">{context.coverage.revision}</code>
            </p>
          )}
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-teal-300 hover:text-teal-200 transition-colors">
              View inspected and skipped files
            </summary>
            <ul className="mt-2.5 space-y-1.5 font-mono text-[11px]">
              {context.coverage.inspected.map((path) => (
                <li key={path} className="text-slate-300">
                  Inspected: <code className="text-teal-300">{path}</code>
                </li>
              ))}
              {context.coverage.skipped.map((path) => (
                <li key={path} className="text-slate-500">
                  Skipped: <code>{path}</code>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {context.warnings.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-xs text-amber-300">
          {context.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#12141c] p-5 shadow-xl shadow-black/30 hover:border-white/20 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
            <h3 className="font-semibold text-sm text-white">Found in input</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">
            {found.length
              ? "Requested permissions or credential-like values, with their sources below."
              : "No recognized finding. Unsupported data or an incomplete scan may still hide risk."}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#12141c] p-5 shadow-xl shadow-black/30 hover:border-white/20 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            <h3 className="font-semibold text-sm text-white">Possible exposure</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">
            {report.naive_containment.persisting_node_ids.length
              ? "The rule catalog models resources and credentials that might need separate cleanup if access and exploitation are confirmed."
              : "The catalog models no downstream exposure for this input. Coverage is limited; this is not proof of safety."}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#12141c] p-5 shadow-xl shadow-black/30 hover:border-white/20 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            <h3 className="font-semibold text-sm text-white">Still unknown</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">
            Credential validity, granted permissions, actual resource contents,
            attacker activity and remediation status. No account APIs were
            tested.
          </p>
        </div>
      </div>

      {found.length > 0 && (
        <details open={found.length <= 5} className="rounded-2xl border border-white/10 bg-[#12141c] p-5 sm:p-6 shadow-xl shadow-black/30">
          <summary className="cursor-pointer font-semibold text-white hover:text-blue-300 transition-colors text-sm sm:text-base">
            Supporting evidence ({found.length})
          </summary>
          <ul className="mt-4 space-y-3">
            {found.map((item, index) => (
              <li
                key={index}
                className="rounded-xl border border-white/5 bg-[#181b24] p-4 shadow-sm"
                data-guide-target={index === 0 ? "evidence" : undefined}
                tabIndex={index === 0 ? -1 : undefined}
              >
                <div className="break-all font-mono text-xs text-teal-300 font-medium">
                  {item.subject}
                </div>
                <p className="mt-1 text-xs text-slate-400">Source: <span className="text-slate-300">{item.source}</span></p>
                <p className="mt-1.5 text-xs text-slate-300 leading-relaxed font-normal">{item.detail}</p>
              </li>
            ))}
          </ul>
        </details>
      )}

      {placeholders.length > 0 && (
        <details className="rounded-2xl border border-white/10 bg-[#12141c] p-5 shadow-xl shadow-black/30">
          <summary className="cursor-pointer text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors">
            Placeholders and references ({placeholders.length}); excluded from
            credential findings
          </summary>
          <ul className="mt-3.5 space-y-2">
            {placeholders.map((item, index) => (
              <li key={index} className="text-xs text-slate-400">
                <code className="rounded-lg bg-[#0e1017] px-2 py-0.5 text-slate-300 font-mono text-[11px] border border-white/5">{item.subject}</code>
                <span className="text-slate-400">
                  {" "}
                  : {item.source}. {item.detail}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
