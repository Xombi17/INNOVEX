import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_CONFIG_FILES = [
  ".mcp.json",
  "mcp.json",
  ".cursor/mcp.json",
  ".env.example",
  ".env.sample",
  ".env.local",
  ".env",
  ".github/workflows/ci.yml",
  ".github/workflows/deploy.yml",
  ".github/workflows/main.yml",
];

const MAX_FILES = 8;
const MAX_BYTES_PER_FILE = 65536;

function sanitizeRepoInput(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^https?:\/\/github\.com\//i, "");
  cleaned = cleaned.replace(/\.git$/i, "");
  cleaned = cleaned.replace(/\/+$/, "");
  const match = cleaned.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (!match) return null;
  const owner = match[1];
  const repo = match[2];
  if (owner === ".." || repo === ".." || owner === "." || repo === ".") {
    return null;
  }
  return `${owner}/${repo}`;
}

function maskSecretString(content: string): string {
  return content
    .replace(/ghp_[A-Za-z0-9_]+/g, "ghp_••••••••••••")
    .replace(/github_pat_[A-Za-z0-9_]+/g, "github_pat_••••••••••••")
    .replace(/sk-[A-Za-z0-9_-]{20,}/g, "sk-••••••••••••")
    .replace(/sk-ant-[A-Za-z0-9_-]{20,}/g, "sk-ant-••••••••••••")
    .replace(/xoxb-[A-Za-z0-9_-]+/g, "xoxb-••••••••••••")
    .replace(/AIza[0-9A-Za-z-_]{35}/g, "AIza••••••••••••")
    .replace(
      /((?:TOKEN|KEY|SECRET|PASSWORD|AUTH|CREDENTIAL)[A-Z0-9_]*\s*=\s*['"]?)[^\r\n'"]+/gi,
      "$1••••••••",
    );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const repoIdentifier = sanitizeRepoInput(body.repo);

    if (!repoIdentifier) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid repository format. Please enter 'owner/repo' or 'https://github.com/owner/repo'.",
        },
        { status: 400 },
      );
    }

    const [owner, repo] = repoIdentifier.split("/");
    const headers = {
      "User-Agent": "ScopeBomb-Security-Scanner/1.1",
      Accept: "application/vnd.github.v3+json",
    };

    let targetFiles: string[] = [];
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`;

    try {
      const treeRes = await fetch(treeUrl, {
        headers,
        signal: AbortSignal.timeout(6000),
      });

      if (treeRes.ok) {
        const treeData = (await treeRes.json()) as {
          tree?: Array<{ path?: string; type?: string }>;
        };
        const allPaths = (treeData.tree || [])
          .filter((item) => item.type === "blob" && item.path)
          .map((item) => item.path as string);

        targetFiles = allPaths
          .filter((p) =>
            ALLOWED_CONFIG_FILES.some(
              (candidate) =>
                p === candidate ||
                p.endsWith("/" + candidate) ||
                p.startsWith(".github/workflows/"),
            ),
          )
          .slice(0, MAX_FILES);
      } else if (treeRes.status === 404) {
        return NextResponse.json(
          {
            ok: false,
            error: `Repository '${repoIdentifier}' was not found or is private.`,
          },
          { status: 404 },
        );
      }
    } catch {
      // Tree API fallback: try probing common root names directly
    }

    if (targetFiles.length === 0) {
      targetFiles = [".mcp.json", ".env.example", ".env", "mcp.json"];
    }

    const fetchedFiles: Array<{ path: string; content: string }> = [];
    const workflowWarnings: string[] = [];

    for (const filePath of targetFiles) {
      if (fetchedFiles.length >= MAX_FILES) break;
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${filePath}`;
      try {
        const fileRes = await fetch(rawUrl, {
          signal: AbortSignal.timeout(3000),
        });
        if (fileRes.ok) {
          const rawText = await fileRes.text();
          const boundedText = rawText.slice(0, MAX_BYTES_PER_FILE);
          const maskedText = maskSecretString(boundedText);
          fetchedFiles.push({ path: filePath, content: maskedText });

          if (
            filePath.includes("workflow") &&
            (maskedText.includes("write-all") ||
              maskedText.includes("id-token: write"))
          ) {
            workflowWarnings.push(
              `${filePath} requests elevated GitHub Actions write-all or id-token permissions.`,
            );
          }
        }
      } catch {
        // Skip inaccessible file
      }
    }

    let syntheticMcpPayload = "";
    const mcpFile = fetchedFiles.find((f) => f.path.includes("mcp.json"));

    if (mcpFile) {
      syntheticMcpPayload = mcpFile.content;
    } else {
      // Build synthetic MCP configuration from env files
      const envLines: string[] = [];
      for (const f of fetchedFiles) {
        if (f.path.includes(".env")) {
          envLines.push(f.content);
        }
      }

      const envObj: Record<string, string> = {};
      const envRegex = /^([A-Z0-9_]+)\s*=/gm;
      for (const text of envLines) {
        let match;
        while ((match = envRegex.exec(text)) !== null) {
          const key = match[1];
          envObj[key] = `${key.toLowerCase()}_sample_preview`;
        }
      }

      if (Object.keys(envObj).length > 0) {
        syntheticMcpPayload = JSON.stringify(
          {
            mcpServers: {
              [`${repo}-environment`]: {
                command: "npx",
                args: ["-y", "@scopebomb/server"],
                env: envObj,
              },
            },
          },
          null,
          2,
        );
      } else {
        // Safe default config when no credentials found in public tree
        syntheticMcpPayload = JSON.stringify(
          {
            mcpServers: {
              [`${repo}-public-tree`]: {
                command: "npx",
                args: ["-y", "@modelcontextprotocol/server-filesystem"],
                env: {
                  REPO_ORIGIN: `https://github.com/${owner}/${repo}`,
                },
              },
            },
          },
          null,
          2,
        );
      }
    }

    return NextResponse.json({
      ok: true,
      repo: repoIdentifier,
      scannedFiles: fetchedFiles.map((f) => f.path),
      syntheticMcpPayload,
      workflowWarnings,
      message:
        fetchedFiles.length > 0
          ? `Scanned ${fetchedFiles.length} configuration file(s) from ${repoIdentifier}`
          : `No root .mcp.json or .env files found in ${repoIdentifier} (clean public repo)`,
    });
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Internal scanner error";
    return NextResponse.json(
      { ok: false, error: `Scan failed: ${errorMsg}` },
      { status: 500 },
    );
  }
}
