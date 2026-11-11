import {
  analyzeAudit,
  parseAuditInput,
} from "../../../../packages/engine/index.ts";
import type { AuditInput, AuditReport } from "../../../../contracts/index.d.ts";
export interface Evidence {
  source: string;
  subject: string;
  detail: string;
  kind: "permission" | "credential" | "placeholder" | "workflow";
}
export interface AnalysisContext {
  kind: "sample" | "custom" | "repository";
  label: string;
  evidence: Evidence[];
  warnings: string[];
  coverage?: {
    inspected: string[];
    skipped: string[];
    matchingFiles: number;
    partial: boolean;
    revision?: string;
  };
}
export interface Analysis {
  report: AuditReport;
  context: AnalysisContext;
}
const SECRET_NAME =
  /TOKEN|SECRET|API[_-]?KEY|PRIVATE[_-]?KEY|AUTHORIZATION|PASSWORD|ADMIN[_-]?KEY/i;
export function isPlaceholder(value: string): boolean {
  const text = value.trim().replace(/^['"]|['"]$/g, "");
  return (
    !text ||
    /^(?:\$\{.*\}|\$[A-Za-z_].*|\{\{.*\}\}|<.*>|\*+|\u2022+|redacted|changeme|change_me|replace[_-]?.*|your[_-].*|process\.env\..*|undefined|null)$/i.test(
      text,
    ) ||
    /^(?:example|sample|dummy|placeholder)(?:$|[_-])/i.test(text) ||
    /(?:[_-](?:example|sample|placeholder|here)|\.\.\.)$/i.test(text)
  );
}
export function prepareConfiguration(
  raw: string,
  source: string,
): { payload: string; placeholders: Evidence[] } {
  if (!raw.trim() || raw.length > 1_000_000)
    throw new Error("Supply a configuration of at most 1 MB.");
  const placeholders: Evidence[] = [];
  const check = (key: string, value: string, location: string) => {
    if (SECRET_NAME.test(key) && isPlaceholder(value)) {
      placeholders.push({
        source: location,
        subject: key,
        kind: "placeholder",
        detail:
          "Placeholder or environment reference; no credential value identified.",
      });
      return "<PLACEHOLDER>";
    }
    return value;
  };
  if (/^[\s]*[\[{]/.test(raw)) {
    let root: unknown;
    try {
      root = JSON.parse(raw);
    } catch {
      throw new Error(
        "Invalid JSON. Check brackets and quotation marks; your input was not analyzed.",
      );
    }
    let visited = 0;
    const walk = (value: unknown, path: string, depth: number): unknown => {
      if (++visited > 10000 || depth > 64)
        throw new Error("Configuration nesting or size limit exceeded.");
      if (Array.isArray(value))
        return value.map((item, index) =>
          walk(item, `${path}[${index}]`, depth + 1),
        );
      if (value && typeof value === "object")
        return Object.fromEntries(
          Object.entries(value).map(([key, item]) => [
            key,
            typeof item === "string"
              ? check(key, item, `${path}.${key}`)
              : walk(item, `${path}.${key}`, depth + 1),
          ]),
        );
      return value;
    };
    return { payload: JSON.stringify(walk(root, source, 0)), placeholders };
  }
  return {
    payload: raw
      .split(/\r?\n/)
      .map((line, index) => {
        const match = line.match(
          /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/,
        );
        if (!match) return line;
        return check(
          match[1],
          match[2].replace(/\s+#.*$/, "").trim(),
          `${source}:${index + 1}`,
        ) === "<PLACEHOLDER>"
          ? `${match[1]}=<PLACEHOLDER>`
          : line;
      })
      .join("\n"),
    placeholders,
  };
}
export function analyzeInput(
  input: AuditInput,
  source: string,
  kind: AnalysisContext["kind"] = "custom",
): Analysis {
  const configuration =
    input.mode === "mcp_config"
      ? prepareConfiguration(input.raw_payload, source)
      : null;
  const parsed = parseAuditInput({
    ...input,
    raw_payload: configuration?.payload ?? input.raw_payload,
  });
  parsed.shadow_secrets = parsed.shadow_secrets.map((finding) => ({
    ...finding,
    source_file: source,
  }));
  const report = analyzeAudit(parsed);
  const evidence: Evidence[] = [
    ...parsed.oauth_grants.flatMap((grant, index) =>
      grant.requested_scopes.map((scope) => ({
        source:
          parsed.oauth_grants.length > 1
            ? `${source}, grant ${index + 1}`
            : source,
        subject: scope,
        kind: "permission" as const,
        detail:
          "Requested in the supplied input. Approval, effective access and exploitation are not verified.",
      })),
    ),
    ...report.shadow_secrets.map((finding) => ({
      source,
      subject: finding.key_name,
      kind: "credential" as const,
      detail: `Credential-like value identified for ${finding.rotation_issuer}; value redacted. Validity and permissions unknown.`,
    })),
    ...(configuration?.placeholders ?? []),
  ];
  return { report, context: { kind, label: source, evidence, warnings: [] } };
}
