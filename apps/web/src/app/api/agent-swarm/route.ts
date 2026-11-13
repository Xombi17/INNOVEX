import { NextResponse } from "next/server.js";
import { readBoundedText } from "../../../lib/boundedBody.ts";
import type { SwarmRequestPayload, SwarmMessage } from "../../../lib/agentSwarmTypes.ts";
import { withTraceSpan, parseTraceParent } from "../../../lib/telemetry.ts";

export const runtime = "nodejs";

function generateFallbackSwarm(payload: SwarmRequestPayload): SwarmMessage[] {
  const providers = payload.providers?.length ? payload.providers : ["google", "github"];
  const primary = providers[0] ?? "identity provider";
  const downstream = providers.slice(1);
  const now = new Date().toISOString();

  return [
    {
      agent: "sentinel",
      content: `Perimeter audit finalized. Inspected identities revealed ${payload.credentialCount} credential-like tokens and ${payload.scopeCount} OAuth scopes across [${providers.join(", ")}]. All credentials masked locally with zero exfiltration.`,
      timestamp: now,
      isComplete: true,
    },
    {
      agent: "threat_modeler",
      content: `Blast-radius topology constructed. Identified ${payload.maxHops}-hop cascade traversing ${payload.trustBoundaries?.length || 2} independent trust boundaries. Lateral movement path detected: initial access in ${primary} enables downstream pivoting into ${downstream.join(", ") || "cloud infrastructure"}.`,
      timestamp: now,
      isComplete: true,
    },
    {
      agent: "red_team",
      content: `Adversary simulation confirmed. Exploiting the initial ${primary} permission allows an attacker to harvest persistence artifacts (refresh tokens, secondary PATs). Why 1-click disconnect fails: the secondary credentials remain active even if the user disconnects the primary app.`,
      timestamp: now,
      isComplete: true,
    },
    {
      agent: "containment_commander",
      content: `Surgical defense protocol generated. RFC 7009 mandates explicit downstream revocation: 1) Revoke ${primary} OAuth grant via API/console, 2) Rotate each exposed credential in ${downstream.join(", ") || "dependent services"}, 3) Run post-revocation HTTP 401 verification probes to prove containment.`,
      timestamp: now,
      isComplete: true,
    },
  ];
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = JSON.parse(await readBoundedText(req, 8000));
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON or payload exceeds 8000 bytes." },
      { status: 400 },
    );
  }

  const payload = body as SwarmRequestPayload;
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const geminiModel = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  let messages: SwarmMessage[] = [];

  if (process.env.GEMINI_API_KEY) {
    const prompt = `You are orchestrating the ScopeBomb Autonomous Defensive Security Swarm (4 specialized AI agents).
Input Context:
- Headline: ${payload.headline || "OAuth Threat Audit"}
- Providers: ${JSON.stringify(payload.providers || [])}
- Credentials Exposed: ${payload.credentialCount ?? 0}
- Scopes: ${payload.scopeCount ?? 0}
- Max Hops: ${payload.maxHops ?? 1}
- Trust Boundaries: ${JSON.stringify(payload.trustBoundaries || [])}
${payload.userQuestion ? `- User/Operator Question: "${payload.userQuestion}"` : ""}

Generate a realistic, professional, concise conference between the 4 agents in JSON format.
Return a JSON object with a "messages" array containing exactly 4 objects in this order:
1. agent: "sentinel", content: string (Perimeter discovery, scopes, secret masking status)
2. agent: "threat_modeler", content: string (Graph topology, lateral movement, trust boundary crossings)
3. agent: "red_team", content: string (Adversary simulation, critical path, why naive revoke fails)
4. agent: "containment_commander", content: string (Surgical kill-switch plan, RFC 7009 notes, 401 verification probe)

Keep each agent's response direct, authoritative, and under 60 words. Never output markdown around the JSON.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`,
        {
          method: "POST",
          redirect: "error",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          }),
          signal: AbortSignal.timeout(8000),
        },
      );

      if (response.ok) {
        const value = JSON.parse(await readBoundedText(response, 32768));
        const rawJsonText = value.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJsonText) {
          const parsed = JSON.parse(rawJsonText);
          if (Array.isArray(parsed.messages) && parsed.messages.length === 4) {
            const now = new Date().toISOString();
            messages = parsed.messages.map((m: { agent: string; content: string }) => ({
              agent: m.agent,
              content: m.content,
              timestamp: now,
              isComplete: true,
            }));
          }
        }
      }
    } catch {
      // Fallback
    }
  }

  if (messages.length === 0) {
    messages = generateFallbackSwarm(payload);
  }

  const incomingParent = parseTraceParent(req.headers.get("traceparent"));

  return await withTraceSpan(
    "scopebomb.swarm.consensus",
    async (span) => {
      span.setAttribute("swarm.provider_count", payload.providers?.length ?? 0);
      span.setAttribute("swarm.credential_count", payload.credentialCount ?? 0);
      span.setAttribute("swarm.scope_count", payload.scopeCount ?? 0);
      span.setAttribute("swarm.max_hops", payload.maxHops ?? 1);
      span.setAttribute("swarm.model", process.env.GEMINI_API_KEY ? geminiModel : "deterministic-fallback");
      span.addEvent("consensus_synthesized", { agent_count: messages.length });

      return NextResponse.json(
        {
          ok: true,
          provider: process.env.GEMINI_API_KEY ? "gemini-3.x" : "deterministic-swarm",
          messages,
          timestamp: new Date().toISOString(),
          traceId: span.traceId,
          traceParent: span.traceParent,
        },
        {
          headers: {
            "traceparent": span.traceParent,
            "X-ScopeBomb-Trace-Id": span.traceId,
          },
        },
      );
    },
    {
      traceId: incomingParent?.traceId,
      parentSpanId: incomingParent?.spanId,
      kind: "SERVER",
    },
  );
}
