import { parseRepository, scanRepository } from "../../../lib/repositoryScan.ts";
import { readBoundedText } from "../../../lib/boundedBody.ts";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  let repo: string;
  try {
    const body = JSON.parse(await readBoundedText(req, 1024));
    repo = parseRepository(body?.repo);
  } catch {
    return Response.json({ ok: false, error: "Enter a public owner/repo or HTTPS github.com repository URL (no branch path)." }, { status: 400 });
  }
  try {
    const signal = AbortSignal.any([req.signal, AbortSignal.timeout(8000)]);
    return Response.json(await scanRepository(repo, signal), { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    const message = cause instanceof Error && /^(Repository not found|GitHub rate limit|GitHub is unavailable)/.test(cause.message)
      ? cause.message : "Repository inspection failed or exceeded its deadline/size limit. Try a smaller public repository or inspect a local file.";
    return Response.json({ ok: false, error: message }, { status: message.startsWith("Repository not found") ? 404 : message.startsWith("GitHub rate limit") ? 429 : 502 });
  }
}
