import { analyzeAudit, parseAuditInput } from "../../../../packages/engine/index.ts";
import type { ParsedAuditInput } from "../../../../packages/engine/index.ts";
import { prepareConfiguration } from "./analysis.ts";
import type { Analysis, Evidence } from "./analysis.ts";
import { readBoundedText } from "./boundedBody.ts";

export interface RepositoryResult {
  ok: true;
  repo: string;
  scannedFiles: string[];
  analysis: Analysis;
  message: string;
}

export function parseRepository(value: unknown): string {
  if (typeof value !== "string" || value.length > 300) throw new Error("Enter a public GitHub owner/repo or HTTPS repository URL.");
  let repo = value.trim().replace(/\/$/, "");
  if (repo.includes("://")) {
    let url: URL;
    try { url = new URL(repo); } catch { throw new Error("Invalid repository URL."); }
    if (url.protocol !== "https:" || url.hostname !== "github.com" || url.port || url.username || url.password || url.search || url.hash) {
      throw new Error("Use an HTTPS github.com repository URL without credentials, query or fragment.");
    }
    repo = url.pathname.slice(1);
  }
  repo = repo.replace(/\.git$/, "");
  if (!/^[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+$/.test(repo) || [".", ".."].includes(repo.split("/")[1])) {
    throw new Error("Enter owner/repo; branch paths and other hosts are unsupported.");
  }
  return repo;
}

export async function scanRepository(repo: string, signal: AbortSignal): Promise<RepositoryResult> {
  const response = await fetch(`https://api.github.com/repos/${repo}/git/trees/HEAD?recursive=1`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "ScopeBomb/1.1" },
    signal, redirect: "error", cache: "no-store",
  });
  if (!response.ok) {
    if (response.status === 404) throw new Error("Repository not found or private. Only public repositories are supported.");
    if ([403, 429].includes(response.status)) throw new Error("GitHub rate limit or access restriction. Try again later or inspect a local file.");
    throw new Error("GitHub is unavailable. Try again later.");
  }
  const tree = JSON.parse(await readBoundedText(response, 1_000_000)) as { sha?: string; truncated?: boolean; tree?: { path: string; type: string }[] };
  if (!tree.sha || !/^[a-f0-9]{40,64}$/.test(tree.sha) || !Array.isArray(tree.tree)) throw new Error("GitHub returned an unsupported repository tree.");
  const matches = tree.tree.filter(item => item.type === "blob" && typeof item.path === "string" &&
    /(?:^|\/)(?:\.mcp\.json|mcp\.json|\.env(?:\.[A-Za-z0-9_.-]+)?)$|^\.github\/workflows\/[^/]+\.ya?ml$/.test(item.path)).map(item => item.path).sort();
  const inspected: string[] = [];
  const skipped = matches.slice(8);
  const evidence: Evidence[] = [];
  const warnings: string[] = [];
  const parsed: ParsedAuditInput = { input_mode: "mcp_config", preset_id: null, oauth_grants: [], shadow_secrets: [], incident_framing_note: "Selected public configuration files only. Credential validity and effective permissions are unknown." };
  for (const path of matches.slice(0, 8)) {
    try {
      if (path.length > 500 || path.split("/").some(segment => segment === "." || segment === "..")) throw new Error();
      const url = `https://raw.githubusercontent.com/${repo}/${tree.sha}/${path.split("/").map(encodeURIComponent).join("/")}`;
      const file = await fetch(url, { signal, redirect: "error", cache: "no-store" });
      if (!file.ok) throw new Error();
      const text = await readBoundedText(file, 65_536);
      if (path.startsWith(".github/workflows/")) {
        if (/\b(?:write-all|pull_request_target)\b|(?:contents|id-token)\s*:\s*write/.test(text)) {
          evidence.push({ source: path, subject: "Workflow permissions or privileged trigger", kind: "workflow", detail: "Review this workflow in context. A privileged trigger or write permission alone does not prove a vulnerability." });
        }
      } else {
        const prepared = prepareConfiguration(text, path);
        const findings = parseAuditInput({ mode: "mcp_config", raw_payload: prepared.payload, simulation_mode: "naive_single_revoke" }).shadow_secrets;
        if (parsed.shadow_secrets.length + findings.length > 256) throw new Error();
        parsed.shadow_secrets.push(...findings.map(finding => ({ ...finding, source_file: path })));
        evidence.push(...prepared.placeholders, ...findings.map(finding => ({ source: path, subject: finding.key_name, kind: "credential" as const, detail: `Credential-like value for ${finding.rotation_issuer}; completely redacted. Validity and permissions are unknown.` })));
      }
      inspected.push(path);
    } catch {
      skipped.push(path);
      if (signal.aborted) break;
    }
  }
  for (const path of matches.slice(0, 8)) if (!inspected.includes(path) && !skipped.includes(path)) skipped.push(path);
  const partial = !!tree.truncated || skipped.length > 0 || signal.aborted;
  if (partial) warnings.push("Partial inspection: files were omitted, unreadable, unsupported, too large, or the request deadline was reached.");
  if (tree.truncated) warnings.push("GitHub truncated the tree; the matching-file count is a lower bound.");
  const analysis: Analysis = { report: analyzeAudit(parsed), context: { kind: "repository", label: repo, evidence, warnings,
    coverage: { inspected, skipped, matchingFiles: matches.length, partial, revision: tree.sha } } };
  return { ok: true, repo, scannedFiles: inspected, analysis, message: `Inspected ${inspected.length} selected files from ${repo}${partial ? " (partial check)" : ""}. No account access was tested.` };
}
