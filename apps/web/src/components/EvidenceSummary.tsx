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
      className="space-y-5 border-t border-[#e8eaec] pt-6"
    >
      <div>
        <h2 className="text-xl font-semibold">What this input tells us</h2>
        <p className="muted mt-1">
          {found.length
            ? `${found.length} permission or configuration finding${found.length === 1 ? "" : "s"} to review.`
            : "No recognized credentials or permissions found in the inspected input."}{" "}
          This does not establish whether an account is compromised.
        </p>
      </div>
      {context.coverage && (
        <div className="rounded-lg bg-[#f4f6f8] p-4 text-[13px]">
          <strong>
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
              Revision: <code>{context.coverage.revision}</code>
            </p>
          )}
          <details className="mt-2">
            <summary className="cursor-pointer">
              View inspected and skipped files
            </summary>
            <ul className="mt-2 space-y-1">
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
        <ul className="list-disc space-y-1 pl-5 text-[#855306]">
          {context.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <h3 className="font-semibold">Found in input</h3>
          <p className="muted mt-2">
            {found.length
              ? "Requested permissions or credential-like values, with their sources below."
              : "No recognized finding. Unsupported data or an incomplete scan may still hide risk."}
          </p>
        </div>
        <div>
          <h3 className="font-semibold">Possible exposure</h3>
          <p className="muted mt-2">
            {report.naive_containment.persisting_node_ids.length
              ? "The rule catalog models resources and credentials that might need separate cleanup if access and exploitation are confirmed."
              : "The catalog models no downstream exposure for this input. Coverage is limited; this is not proof of safety."}
          </p>
        </div>
        <div>
          <h3 className="font-semibold">Still unknown</h3>
          <p className="muted mt-2">
            Credential validity, granted permissions, actual resource contents,
            attacker activity and remediation status. No account APIs were
            tested.
          </p>
        </div>
      </div>
      {found.length > 0 && (
        <details open={found.length <= 5}>
          <summary className="cursor-pointer font-medium">
            Supporting evidence ({found.length})
          </summary>
          <ul className="mt-3 divide-y divide-[#e8eaec]">
            {found.map((item, index) => (
              <li key={index} className="py-3">
                <div className="break-all text-[13px]">
                  {item.subject}
                </div>
                <p className="muted mt-1 text-[13px]">Source: {item.source}</p>
                <p className="mt-1 text-[13px]">{item.detail}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
      {placeholders.length > 0 && (
        <details>
          <summary className="cursor-pointer">
            Placeholders and references ({placeholders.length}); excluded from
            credential findings
          </summary>
          <ul className="mt-3 space-y-2">
            {placeholders.map((item, index) => (
              <li key={index} className="text-[13px]">
                <code>{item.subject}</code>
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
