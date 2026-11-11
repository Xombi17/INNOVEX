import { analyzeAudit } from "../../../../packages/engine/index.ts";
import type { ShadowSecretFinding } from "../../../../contracts/index.d.ts";
import { analyzeInput, type Analysis, type Evidence } from "./analysis.ts";

export interface RepositoryResult {
  ok: true;
  analysis: Analysis;
  message: string;
}
export class RepositoryError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
export function repositoryIdentifier(raw: unknown): string {
  if (typeof raw !== "string" || raw.length > 400)
    throw new RepositoryError("Enter a public GitHub URL or owner/repo.", 400);
  let value = raw.trim();
  if (/^https?:\/\//i.test(value)) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new RepositoryError("Enter a valid GitHub repository URL.", 400);
    }
    if (
      url.protocol !== "https:" ||
      !["github.com", "www.github.com"].includes(url.hostname) ||
      url.port ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new RepositoryError(
        "Use an HTTPS github.com repository URL without credentials, query parameters or fragments.",
        400,
      );
    value = url.pathname.replace(/^\//, "");
  }
  value = value.replace(/\/$/, "").replace(/\.git$/, "");
  if (
    !/^[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+$/.test(value) ||
    [".", ".."].includes(value.split("/")[1])
  )
    throw new RepositoryError(
      "Use owner/repo or https://github.com/owner/repo, without additional paths.",
      400,
    );
  return value;
}
async function readBounded(response: Response, limit: number): Promise<string> {
  if (Number(response.headers.get("content-length")) > limit) {
    await response.body?.cancel();
    throw new Error("size");
  }
  const reader = response.body?.getReader();
  if (!reader) return "";
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new Error("size");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(bytes);
}
export async function scanRepository(
  raw: unknown,
  request: typeof fetch = fetch,
): Promise<RepositoryResult> {
  const repo = repositoryIdentifier(raw);
  const deadline = AbortSignal.timeout(20000);
  const get = (url: string) =>
    request(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "ScopeBomb",
      },
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.any([deadline, AbortSignal.timeout(6000)]),
    });
  const apiJson = async (url: string) => {
    let response: Response;
    try {
      response = await get(url);
    } catch {
      throw new RepositoryError(
        "GitHub could not be reached. No repository assessment was produced; try again.",
        502,
      );
    }
    if (response.status === 404)
      throw new RepositoryError(
        "Repository not found, empty, or private. Choose a non-empty public repository.",
        404,
      );
    if (response.status === 403 || response.status === 429)
      throw new RepositoryError(
        "GitHub limited this request. Try again later; this is not a clean scan.",
        429,
      );
    if (!response.ok)
      throw new RepositoryError(
        "GitHub returned an error. No repository assessment was produced.",
        502,
      );
    try {
      return JSON.parse(await readBounded(response, 2_000_000));
    } catch {
      throw new RepositoryError(
        "GitHub’s response exceeded the supported size or format. No assessment was produced.",
        502,
      );
    }
  };
  const commit = await apiJson(
    `https://api.github.com/repos/${repo}/commits/HEAD`,
  );
  const revision: unknown = commit.sha;
  const treeSha: unknown = commit.commit?.tree?.sha;
  if (
    typeof revision !== "string" ||
    !/^[a-f0-9]{40,64}$/.test(revision) ||
    typeof treeSha !== "string" ||
    !/^[a-f0-9]{40,64}$/.test(treeSha)
  )
    throw new RepositoryError("GitHub returned an unsupported revision.", 502);
  const tree = await apiJson(
    `https://api.github.com/repos/${repo}/git/trees/${treeSha}?recursive=1`,
  );
  if (!Array.isArray(tree.tree))
    throw new RepositoryError(
      "GitHub returned an unsupported file inventory.",
      502,
    );
  const matches = tree.tree
    .filter(
      (item: { type?: string; path?: unknown; mode?: string }) =>
        item.type === "blob" &&
        typeof item.path === "string" &&
        item.mode !== "120000" &&
        !item.path.split("/").some((part) => part === "." || part === "..") &&
        (/(^|\/)(?:\.mcp\.json|mcp\.json|\.env(?:\.[A-Za-z0-9_-]+)?)$/.test(
          item.path,
        ) ||
          /^\.github\/workflows\/[^/]+\.ya?ml$/.test(item.path)),
    )
    .map((item: { path: string }) => item.path as string)
    .sort();
  const inspected: string[] = [];
  const skipped: string[] = matches.slice(8);
  const evidence: Evidence[] = [];
  const findings: ShadowSecretFinding[] = [];
  const warnings: string[] = [];
  for (const path of matches.slice(0, 8)) {
    try {
      const response = await get(
        `https://raw.githubusercontent.com/${repo}/${revision}/${path.split("/").map(encodeURIComponent).join("/")}`,
      );
      if (!response.ok) {
        skipped.push(`${path} (unavailable)`);
        continue;
      }
      const rawText = await readBounded(response, 65536);
      if (path.startsWith(".github/workflows/")) {
        if (/\bwrite-all\b|\bid-token\s*:\s*write\b/.test(rawText))
          evidence.push({
            source: path,
            subject: "Elevated workflow permission declaration",
            kind: "workflow",
            detail:
              "write-all or id-token: write appears in this file. Review job context and trust boundaries; this is not evidence of a leaked credential or exploit.",
          });
        inspected.push(path);
        continue;
      }
      const result = analyzeInput(
        {
          mode: "mcp_config",
          raw_payload: rawText,
          preset_id: null,
          simulation_mode: "naive_single_revoke",
        },
        path,
        "repository",
      );
      if (findings.length + result.report.shadow_secrets.length > 256) {
        skipped.push(`${path} (credential limit)`);
        continue;
      }
      findings.push(...result.report.shadow_secrets);
      evidence.push(...result.context.evidence);
      inspected.push(path);
    } catch {
      skipped.push(`${path} (over 64 KiB, unsupported, or unreadable)`);
    }
  }
  if (tree.truncated)
    warnings.push(
      "GitHub truncated the file inventory. Additional matching files may exist.",
    );
  if (skipped.length)
    warnings.push(
      "Some matching files were not inspected. Review the skipped-file list before drawing conclusions.",
    );
  const report = analyzeAudit({
    input_mode: "mcp_config",
    preset_id: null,
    oauth_grants: [],
    shadow_secrets: findings,
    incident_framing_note:
      "Potential exposure from selected public files only; not proof of credential validity, exploitation or containment.",
  });
  const partial = !!tree.truncated || skipped.length > 0;
  return {
    ok: true,
    analysis: {
      report,
      context: {
        kind: "repository",
        label: repo,
        evidence,
        warnings,
        coverage: {
          inspected,
          skipped,
          matchingFiles: matches.length,
          partial,
          revision,
        },
      },
    },
    message: `${inspected.length} selected file(s) inspected${partial ? "; results are partial" : ""}. No account access was tested.`,
  };
}
