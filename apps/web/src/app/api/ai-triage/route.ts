import type { AITriageRequest } from "../../../lib/aiTriageTypes.ts";
import { deterministicTriage, parseModelTriage, triagePrompt, validateTriageRequest } from "../../../lib/aiTriage.ts";
import { readBoundedText } from "../../../lib/boundedBody.ts";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  let data: AITriageRequest;
  try { data = validateTriageRequest(JSON.parse(await readBoundedText(req, 4096))); }
  catch { return Response.json({ error: "Supply only bounded audit counts and recognized provider/boundary names; raw input and credentials are not accepted." }, { status: 400 }); }
  const prompt = triagePrompt(data);
  const signal = AbortSignal.any([req.signal, AbortSignal.timeout(8000)]);
  for (const provider of ["gemini", "openai"] as const) {
    const key = process.env[provider === "gemini" ? "GEMINI_API_KEY" : "OPENAI_API_KEY"];
    if (!key || signal.aborted) continue;
    try {
      const gemini = provider === "gemini";
      const response = await fetch(gemini
        ? "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
        : "https://api.openai.com/v1/chat/completions", {
        method: "POST", signal: AbortSignal.any([signal, AbortSignal.timeout(6000)]), redirect: "error", cache: "no-store",
        headers: gemini ? { "Content-Type": "application/json", "x-goog-api-key": key } : { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify(gemini
          ? { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 1000 } }
          : { model: "gpt-4o-mini", response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }], temperature: 0.2, max_tokens: 1000 }),
      });
      if (!response.ok) continue;
      const json = JSON.parse(await readBoundedText(response, 32768));
      const text = gemini ? json.candidates?.[0]?.content?.parts?.[0]?.text : json.choices?.[0]?.message?.content;
      if (typeof text === "string") return Response.json(parseModelTriage(text, provider), { headers: { "Cache-Control": "no-store" } });
    } catch { /* Invalid/upstream responses use the next provider or the complete local fallback. */ }
  }
  return Response.json(deterministicTriage(data), { headers: { "Cache-Control": "no-store" } });
}
