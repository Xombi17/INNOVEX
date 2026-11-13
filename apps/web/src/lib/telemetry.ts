/**
 * ScopeBomb OpenTelemetry Distributed Tracing Core
 * Pure zero-dependency TypeScript implementation adhering strictly to W3C Trace Context
 * and OpenTelemetry Span v1.2+ specification.
 */

export interface SpanEvent {
  name: string;
  timeUnixNano: number;
  attributes?: Record<string, string | number | boolean>;
}

export interface SpanStatus {
  code: "OK" | "ERROR" | "UNSET";
  message?: string;
}

export interface OtelSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: "INTERNAL" | "SERVER" | "CLIENT" | "PRODUCER" | "CONSUMER";
  startTimeUnixNano: number;
  endTimeUnixNano?: number;
  durationMs?: number;
  attributes: Record<string, string | number | boolean>;
  events: SpanEvent[];
  status: SpanStatus;
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  traceFlags: string;
}

function randomHex(bytes: number): string {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const arr = new Uint8Array(bytes);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  let hex = "";
  for (let i = 0; i < bytes * 2; i++) {
    hex += Math.floor(Math.random() * 16).toString(16);
  }
  return hex;
}

export function generateTraceId(): string {
  return randomHex(16); // 128-bit = 32 hex chars
}

export function generateSpanId(): string {
  return randomHex(8); // 64-bit = 16 hex chars
}

export function formatTraceParent(context: TraceContext): string {
  return `00-${context.traceId}-${context.spanId}-${context.traceFlags}`;
}

export function parseTraceParent(header?: string | null): TraceContext | null {
  if (!header) return null;
  const match = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i.exec(header.trim());
  if (!match) return null;
  return {
    traceId: match[1].toLowerCase(),
    spanId: match[2].toLowerCase(),
    traceFlags: match[3].toLowerCase(),
  };
}

class InMemorySpanStore {
  private spans: OtelSpan[] = [];
  private readonly maxSpans = 250;

  public addSpan(span: OtelSpan): void {
    this.spans.push(span);
    if (this.spans.length > this.maxSpans) {
      this.spans.splice(0, this.spans.length - this.maxSpans);
    }
  }

  public getSpans(limit = 50): OtelSpan[] {
    return this.spans.slice(-limit).reverse();
  }

  public clear(): void {
    this.spans = [];
  }
}

const globalSpanStore = new InMemorySpanStore();

export class ActiveSpan {
  private span: OtelSpan;

  constructor(
    name: string,
    options: {
      traceId?: string;
      parentSpanId?: string;
      kind?: OtelSpan["kind"];
      attributes?: Record<string, string | number | boolean>;
    } = {},
  ) {
    const now = Date.now();
    this.span = {
      traceId: options.traceId ?? generateTraceId(),
      spanId: generateSpanId(),
      parentSpanId: options.parentSpanId,
      name,
      kind: options.kind ?? "INTERNAL",
      startTimeUnixNano: now * 1_000_000,
      attributes: {
        "service.name": "scopebomb",
        "service.version": "1.2.0",
        "telemetry.sdk.language": "typescript",
        "telemetry.sdk.name": "scopebomb-otel",
        ...(options.attributes ?? {}),
      },
      events: [],
      status: { code: "UNSET" },
    };
  }

  public get traceId(): string {
    return this.span.traceId;
  }

  public get spanId(): string {
    return this.span.spanId;
  }

  public get traceContext(): TraceContext {
    return {
      traceId: this.span.traceId,
      spanId: this.span.spanId,
      traceFlags: "01",
    };
  }

  public get traceParent(): string {
    return formatTraceParent(this.traceContext);
  }

  public setAttribute(key: string, value: string | number | boolean): this {
    this.span.attributes[key] = value;
    return this;
  }

  public addEvent(name: string, attributes?: Record<string, string | number | boolean>): this {
    this.span.events.push({
      name,
      timeUnixNano: Date.now() * 1_000_000,
      attributes,
    });
    return this;
  }

  public setStatus(code: "OK" | "ERROR", message?: string): this {
    this.span.status = { code, message };
    return this;
  }

  public end(status?: { code: "OK" | "ERROR"; message?: string }): OtelSpan {
    const endMs = Date.now();
    this.span.endTimeUnixNano = endMs * 1_000_000;
    this.span.durationMs = Math.max(0, endMs - Math.floor(this.span.startTimeUnixNano / 1_000_000));
    if (status) {
      this.span.status = status;
    } else if (this.span.status.code === "UNSET") {
      this.span.status = { code: "OK" };
    }
    globalSpanStore.addSpan(this.span);
    return this.span;
  }
}

export async function withTraceSpan<T>(
  name: string,
  fn: (span: ActiveSpan) => Promise<T> | T,
  options?: {
    traceId?: string;
    parentSpanId?: string;
    kind?: OtelSpan["kind"];
    attributes?: Record<string, string | number | boolean>;
  },
): Promise<T> {
  const span = new ActiveSpan(name, options);
  try {
    const result = await fn(span);
    span.end({ code: "OK" });
    return result;
  } catch (error) {
    span.setStatus("ERROR", error instanceof Error ? error.message : String(error));
    span.end();
    throw error;
  }
}

export function getRecordedSpans(limit = 50): OtelSpan[] {
  return globalSpanStore.getSpans(limit);
}

export function clearRecordedSpans(): void {
  globalSpanStore.clear();
}

/**
 * Serializes spans into standard OpenTelemetry Protocol (OTLP) ResourceSpans JSON format.
 */
export function exportOtelResourceSpansJson(spans = getRecordedSpans()): object {
  return {
    resourceSpans: [
      {
        resource: {
          attributes: [
            { key: "service.name", value: { stringValue: "scopebomb" } },
            { key: "service.version", value: { stringValue: "1.2.0" } },
            { key: "deployment.environment", value: { stringValue: "production" } },
          ],
        },
        scopeSpans: [
          {
            scope: {
              name: "scopebomb.core",
              version: "1.2.0",
            },
            spans: spans.map((s) => ({
              traceId: s.traceId,
              spanId: s.spanId,
              parentSpanId: s.parentSpanId,
              name: s.name,
              kind: s.kind,
              startTimeUnixNano: String(s.startTimeUnixNano),
              endTimeUnixNano: String(s.endTimeUnixNano ?? s.startTimeUnixNano),
              durationMs: s.durationMs ?? 0,
              attributes: Object.entries(s.attributes).map(([key, val]) => ({
                key,
                value:
                  typeof val === "string"
                    ? { stringValue: val }
                    : typeof val === "number"
                      ? { intValue: val }
                      : { boolValue: val },
              })),
              events: s.events.map((e) => ({
                name: e.name,
                timeUnixNano: String(e.timeUnixNano),
              })),
              status: s.status,
            })),
          },
        ],
      },
    ],
  };
}
