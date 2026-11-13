import { NextResponse } from "next/server";
import {
  getRecordedSpans,
  exportOtelResourceSpansJson,
  withTraceSpan,
  parseTraceParent,
} from "@/lib/telemetry";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));
  const format = searchParams.get("format");

  const spans = getRecordedSpans(limit);

  if (format === "otlp") {
    return NextResponse.json(exportOtelResourceSpansJson(spans), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-ScopeBomb-Telemetry": "OpenTelemetry-v1.28.0-Compatible",
      },
    });
  }

  return NextResponse.json(
    {
      service: "scopebomb",
      version: "1.2.0",
      environment: "production",
      total_spans: spans.length,
      w3c_traceparent_spec: "W3C Trace Context Level 1",
      spans,
    },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-ScopeBomb-Telemetry": "OpenTelemetry-v1.28.0-Compatible",
      },
    },
  );
}

export async function POST(request: Request) {
  const traceparent = request.headers.get("traceparent");
  const parentContext = parseTraceParent(traceparent);

  try {
    const body = await request.json();
    const spanName = body.name || "client.event";
    const spanAttributes = body.attributes || {};

    const span = await withTraceSpan(
      spanName,
      (s) => {
        for (const [k, v] of Object.entries(spanAttributes)) {
          if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
            s.setAttribute(k, v);
          }
        }
        s.setAttribute("client.ingest", true);
        return {
          traceId: s.traceId,
          spanId: s.spanId,
          traceParent: s.traceParent,
        };
      },
      {
        traceId: parentContext?.traceId,
        parentSpanId: parentContext?.spanId,
        kind: "CLIENT",
      },
    );

    return NextResponse.json({ ok: true, span }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record span" },
      { status: 400 },
    );
  }
}
