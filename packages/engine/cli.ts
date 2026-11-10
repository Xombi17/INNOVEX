#!/usr/bin/env node
import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { analyzeAudit, parseAuditInput, parseMcpConfig } from "./index.ts";
import type { AuditReport } from "../../contracts/index.d.ts";

const skipped = new Set(["node_modules", ".git", ".next"]);

export function scanDirectory(target: string): AuditReport {
  const root = resolve(target);
  const parsed = parseAuditInput({ mode: "mcp_config", raw_payload: "{}", simulation_mode: "full_multi_issuer" });
  try {
    if (!lstatSync(root).isDirectory()) throw new Error("Expected a directory.");
    const visit = (directory: string, depth: number): void => {
      const entries = readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
      for (const entry of entries) {
        const path = join(directory, entry.name);
        if (entry.isDirectory() && depth < 3 && !skipped.has(entry.name)) visit(path, depth + 1);
        // Dirents exclude symlinks and special files, so scans stay within the target tree.
        if (!entry.isFile() || !(entry.name === ".mcp.json" || entry.name === "mcp.json" || entry.name.startsWith(".env"))) continue;
        if (lstatSync(path).size > 1_000_000) throw new Error("Configuration exceeds size limit.");
        const raw = readFileSync(path, "utf8");
        if (!raw.trim()) continue;
        const source = relative(root, path).split(sep).join("/");
        const findings = parseMcpConfig(raw).map(finding => ({ ...finding, source_file: source }));
        parsed.shadow_secrets.push(...findings);
        if (parsed.shadow_secrets.length > 256) throw new Error("Credential limit exceeded.");
      }
    };
    visit(root, 0);
  } catch {
    // Native filesystem/JSON errors may reflect paths or credential contents.
    throw new Error("Scan failed: unreadable directory, invalid configuration, or size/credential limit exceeded.");
  }
  return analyzeAudit(parsed);
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const targets = args.filter(arg => arg !== "--json");
  if (targets.length > 1 || targets.some(arg => arg.startsWith("-"))) {
    process.stderr.write("Usage: node packages/engine/cli.ts [directory] [--json]\n");
    process.exitCode = 1;
  } else {
    try {
      const report = scanDirectory(targets[0] ?? ".");
      process.stdout.write(args.includes("--json") ? `${JSON.stringify(report)}\n` : [
        "ScopeBomb local audit",
        `${report.shadow_secrets.length} credential finding(s) across ${new Set(report.shadow_secrets.map(finding => finding.source_file)).size} file(s); max risk ${report.summary.max_risk_score}/100`,
        report.summary.headline,
        `${report.full_containment.ordered_steps.length} proposed containment step(s). Potential exposure only; no live actions performed.`,
        "",
      ].join("\n"));
    } catch {
      process.stderr.write("ScopeBomb: scan failed; check directory access, configuration syntax, and limits (1 MB/file, 256 credentials total).\n");
      process.exitCode = 1;
    }
  }
}
