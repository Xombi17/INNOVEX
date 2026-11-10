import { NextRequest, NextResponse } from "next/server";
import type { AITriageRequest, AITriageResponse } from "@/lib/aiTriageTypes";

export const runtime = "nodejs";

function generateDeterministicTriage(req: AITriageRequest): AITriageResponse {
  const provider = req.primaryProvider || "OAuth issuer";
  const count = req.naivePersistingCount;
  const boundaries =
    req.trustBoundaries.length > 0
      ? req.trustBoundaries.join(", ")
      : "external SaaS and production cloud";

  const attackerStory =
    count > 0
      ? `A compromised authorization grant on ${provider} allows an attacker to escalate privileges across ${boundaries}. Through this initial entry point, lateral movement reaches ${req.maxHops} hops deep into connected third-party SaaS integrations, service accounts, and API keys.`
      : `The inspected grant on ${provider} is constrained. If compromised, blast radius is limited to identity scopes without lateral escalation into downstream production infrastructure.`;

  const whyRevokeFails =
    count > 0
      ? `Clicking "Revoke" on ${provider} returns HTTP 200 (RFC 7009 §2.2), but this only invalidates ${provider}'s refresh token. Access tokens already issued to downstream microservices, connected SaaS apps, and local MCP environment keys remain valid until their TTL expires, leaving ${count} attack paths open.`
      : `Revoking this grant invalidates authorization cleanly because no cross-issuer secondary tokens or offline background refresh tokens were provisioned.`;

  const first60SecondsAction =
    count > 0
      ? `1. Immediately execute multi-issuer revocation across all detected targets (${boundaries}). 2. Invalidate active GitHub/Google application grants directly from security settings. 3. Rotate any local credentials stored in .mcp.json or .env files.`
      : `Verify that no persistent refresh tokens were issued and ensure the client application adheres to least-privilege scope requests.`;

  return {
    attackerStory,
    whyRevokeFails,
    first60SecondsAction,
    modelBadge: "Smart Triage · Offline Synthesizer",
    provider: "local-synthesizer",
    fallbackUsed: true,
    timestamp: new Date().toISOString(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json().catch(() => ({}))) as AITriageRequest;

    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
      try {
        const prompt = `You are a cybersecurity expert analyzing an OAuth blast radius audit.
Audit facts (STRICTLY REDACTED METRICS):
- Primary Provider: ${data.primaryProvider}
- Headline: ${data.headline}
- Risk Score: ${data.maxRiskScore}/100
- Max Escalation Hops: ${data.maxHops}
- Trust Boundaries: ${data.trustBoundaries.join(", ")}
- Requested Scopes: ${data.requestedScopes.join(", ")}
- Persisting Paths after 1-Click Revoke: ${data.naivePersistingCount}
- Top Persisting Targets: ${data.topPersistingLabels.join(", ")}

Produce a JSON response with exactly three keys:
1. "attackerStory": 2-3 sentences explaining the realistic attacker escalation path in plain English.
2. "whyRevokeFails": 2-3 sentences explaining why standard 1-click revoke leaves downstream paths open (cite RFC 7009 HTTP 200 nuance and multi-issuer isolation).
3. "first60SecondsAction": 2-3 concise bullet points with the exact containment steps.`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          }),
          signal: AbortSignal.timeout(6000),
        });

        if (res.ok) {
          const json = await res.json();
          const rawText =
            json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            const response: AITriageResponse = {
              attackerStory: parsed.attackerStory,
              whyRevokeFails: parsed.whyRevokeFails,
              first60SecondsAction: parsed.first60SecondsAction,
              modelBadge: "AI Triage · Live Model (Gemini 2.5)",
              provider: "gemini",
              fallbackUsed: false,
              timestamp: new Date().toISOString(),
            };
            return NextResponse.json(response);
          }
        }
      } catch {
        // Fall through to deterministic fallback
      }
    } else if (openaiKey) {
      try {
        const prompt = `Analyze this OAuth blast radius report:
- Provider: ${data.primaryProvider}
- Risk Score: ${data.maxRiskScore}/100
- Persisting Paths: ${data.naivePersistingCount}
- Boundaries: ${data.trustBoundaries.join(", ")}
Return JSON with keys "attackerStory", "whyRevokeFails", "first60SecondsAction".`;

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
          }),
          signal: AbortSignal.timeout(6000),
        });

        if (res.ok) {
          const json = await res.json();
          const content = json.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            const response: AITriageResponse = {
              attackerStory: parsed.attackerStory,
              whyRevokeFails: parsed.whyRevokeFails,
              first60SecondsAction: parsed.first60SecondsAction,
              modelBadge: "AI Triage · Live Model (GPT-4o)",
              provider: "openai",
              fallbackUsed: false,
              timestamp: new Date().toISOString(),
            };
            return NextResponse.json(response);
          }
        }
      } catch {
        // Fall through to deterministic fallback
      }
    }

    // Default: Deterministic offline synthesizer
    const fallbackResponse = generateDeterministicTriage(data);
    return NextResponse.json(fallbackResponse);
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Internal triage error";
    return NextResponse.json(
      { error: `Triage failed: ${errorMsg}` },
      { status: 500 },
    );
  }
}
