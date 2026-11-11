import { NextResponse } from "next/server.js";
import { readBoundedText } from "../../../lib/boundedBody.ts";
import { RepositoryError, scanRepository } from "../../../lib/repositoryScan.ts";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    let body: string;
    try {
      body = await readBoundedText(req, 2048);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Repository request is too large or unreadable." },
        { status: 413 },
      );
    }
    let data: { repo?: unknown };
    try {
      data = JSON.parse(body);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Supply a repository in a JSON request." },
        { status: 400 },
      );
    }
    return NextResponse.json(await scanRepository(data?.repo), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (cause) {
    return NextResponse.json(
      {
        ok: false,
        error:
          cause instanceof RepositoryError
            ? cause.message
            : "Repository check failed. No assessment was produced.",
      },
      { status: cause instanceof RepositoryError ? cause.status : 502 },
    );
  }
}
