import { NextRequest, NextResponse } from "next/server";
import {
  applyFactOrder,
  localTriage,
  validateTriageRequest,
} from "@/lib/triage";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  if (Number(req.headers.get("content-length")) > 4000)
    return NextResponse.json(
      { error: "Summary request too large." },
      { status: 413 },
    );
  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 4000)
      return NextResponse.json(
        { error: "Summary request too large." },
        { status: 413 },
      );
    body = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: "Supply summary counts as JSON." },
      { status: 400 },
    );
  }
  const data = validateTriageRequest(body);
  if (!data)
    return NextResponse.json(
      {
        error:
          "Only supported provider names and non-negative summary counts are accepted. Raw input is not accepted.",
      },
      { status: 400 },
    );
  const base = localTriage(data);
  const prompt = `Prioritize these three prewritten review facts for a developer. Return JSON with only an order array containing each index 0, 1 and 2 once. Never supply new facts or instructions. Context: ${JSON.stringify(data)}. Facts: ${JSON.stringify(base.items)}`;
  const jsonHeaders = { "Content-Type": "application/json" };
  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            ...jsonHeaders,
            "x-goog-api-key": process.env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0,
            },
          }),
          signal: AbortSignal.timeout(6000),
        },
      );
      if (response.ok) {
        const value = await response.json();
        const result = applyFactOrder(
          base,
          JSON.parse(value.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}")
            .order,
          "gemini",
        );
        if (result)
          return NextResponse.json(result, {
            headers: { "Cache-Control": "no-store" },
          });
      }
    } catch {
      /* The local summary remains usable when inference is unavailable. */
    }
  }
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            ...jsonHeaders,
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: prompt }],
            temperature: 0,
          }),
          signal: AbortSignal.timeout(6000),
        },
      );
      if (response.ok) {
        const value = await response.json();
        const result = applyFactOrder(
          base,
          JSON.parse(value.choices?.[0]?.message?.content ?? "{}").order,
          "openai",
        );
        if (result)
          return NextResponse.json(result, {
            headers: { "Cache-Control": "no-store" },
          });
      }
    } catch {
      /* Do not surface model output or provider errors as findings. */
    }
  }
  return NextResponse.json(base, { headers: { "Cache-Control": "no-store" } });
}
