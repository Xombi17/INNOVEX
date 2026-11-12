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
      className="space-y-5 border-t border-[#1e2636] pt-6 [overflow-wrap:anywhere]"
    >
      <div>
        <h2 className="text-xl font-semibold text-white">What this input tells us</h2>
        <p className="muted mt-1 text-slate-400">
          {found.length
            ? `${found.length} permission or configuration finding${found.length === 1 ? "" : "s"} to review.`
            : "No recognized credentials or permissions found in the inspected input."}{" "}
          This does not establish whether an account is compromised.
        </p>
      </div>
      {context.coverage && (
        <div className="rounded-lg border border-white/5 bg-[#121622] p-4 text-[13px] text-slate-300">
          <strong className="text-white">
            {context.coverage.partial
              ? "Partial repository check"
              : "Selected-file repository check"}
          </strong>
          <p className="mt-1">
            Inspected {context.coverage.inspected.length} of{" "}
            {context.coverage.matchingFiles} matching files. Limit: 8 files, 64
            KiB per file. History, private content, other files and effective
            permissions were not inspected.
          </p>
          {context.coverage.revision && (
            <p className="mt-1 break-all">
              Revision: <code className="rounded bg-[#1a2130] px-1 py-0.5">{context.coverage.revision}</code>
            </p>
          )}
          <details className="mt-2">
            <summary className="cursor-pointer text-teal-400 hover:underline">
              View inspected and skipped files
            </summary>
            <ul className="mt-2 space-y-1 font-mono text-xs">
              {context.coverage.inspected.map((path) => (
                <li key={path}>
                  Inspected: <code>{path}</code>
                </li>
              ))}
              {context.coverage.skipped.map((path) => (
                <li key={path}>
                  Skipped: <code>{path}</code>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
      {context.warnings.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-amber-300">
          {context.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-lg border border-[#1e2636] bg-[#0c1018] p-4">
          <h3 className="font-semibold text-white">Found in input</h3>
          <p className="muted mt-2 text-xs">
            {found.length
              ? "Requested permissions or credential-like values, with their sources below."
              : "No recognized finding. Unsupported data or an incomplete scan may still hide risk."}
          </p>
        </div>
        <div className="rounded-lg border border-[#1e2636] bg-[#0c1018] p-4">
          <h3 className="font-semibold text-white">Possible exposure</h3>
          <p className="muted mt-2 text-xs">
            {report.naive_containment.persisting_node_ids.length
              ? "The rule catalog models resources and credentials that might need separate cleanup if access and exploitation are confirmed."
              : "The catalog models no downstream exposure for this input. Coverage is limited; this is not proof of safety."}
          </p>
        </div>
        <div className="rounded-lg border border-[#1e2636] bg-[#0c1018] p-4">
          <h3 className="font-semibold text-white">Still unknown</h3>
          <p className="muted mt-2 text-xs">
            Credential validity, granted permissions, actual resource contents,
            attacker activity and remediation status. No account APIs were
            tested.
          </p>
        </div>
      </div>
      {found.length > 0 && (
        <details open={found.length <= 5} className="border-t border-[#1e2636] pt-3">
          <summary className="cursor-pointer font-medium text-white hover:text-teal-300">
            Supporting evidence ({found.length})
          </summary>
          <ul className="mt-3 divide-y divide-[#182030]">
            {found.map((item, index) => (
              <li key={index} className="py-3" data-guide-target={index === 0 ? "evidence" : undefined} tabIndex={index === 0 ? -1 : undefined}>
                <div className="break-all font-mono text-[13px] text-teal-300">
                  {item.subject}
                </div>
                <p className="muted mt-1 text-[13px]">Source: {item.source}</p>
                <p className="mt-1 text-[13px] text-slate-300">{item.detail}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
      {placeholders.length > 0 && (
        <details className="border-t border-[#1e2636] pt-2">
          <summary className="cursor-pointer text-slate-400 hover:text-slate-200">
            Placeholders and references ({placeholders.length}); excluded from
            credential findings
          </summary>
          <ul className="mt-3 space-y-2">
            {placeholders.map((item, index) => (
              <li key={index} className="text-[13px]">
                <code className="rounded bg-[#141924] px-1.5 py-0.5 text-slate-300">{item.subject}</code>
                <span className="muted">
                  {" "}
                  — {item.source}. {item.detail}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
