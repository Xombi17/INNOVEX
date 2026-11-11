import { NextRequest, NextResponse } from "next/server";
import { RepositoryError, scanRepository } from "@/lib/repositoryScan";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    if (Number(req.headers.get("content-length")) > 2048)
      return NextResponse.json(
        { ok: false, error: "Repository request is too large." },
        { status: 413 },
      );
    const body = await req.text();
    if (body.length > 2048)
      return NextResponse.json(
        { ok: false, error: "Repository request is too large." },
        { status: 413 },
      );
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
