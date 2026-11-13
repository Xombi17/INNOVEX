import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateTraceId,
  generateSpanId,
  formatTraceParent,
  parseTraceParent,
  withTraceSpan,
  getRecordedSpans,
  clearRecordedSpans,
  exportOtelResourceSpansJson,
} from "../src/lib/telemetry.ts";

test("W3C traceparent formatting and parsing adheres to Level 1 spec", () => {
  const traceId = generateTraceId();
  const spanId = generateSpanId();
  assert.equal(traceId.length, 32);
  assert.equal(spanId.length, 16);

  const header = formatTraceParent({ traceId, spanId, traceFlags: "01" });
  assert.match(header, /^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);

  const parsed = parseTraceParent(header);
  assert.ok(parsed);
  assert.equal(parsed.traceId, traceId);
  assert.equal(parsed.spanId, spanId);
  assert.equal(parsed.traceFlags, "01");

  assert.equal(parseTraceParent("invalid"), null);
  assert.equal(parseTraceParent(null), null);
});

test("withTraceSpan records execution, attributes, events, and duration", async () => {
  clearRecordedSpans();

  const result = await withTraceSpan(
    "test.operation",
    async (span) => {
      span.setAttribute("app.mode", "simulation");
      span.setAttribute("app.risk", 85);
      span.addEvent("test_checkpoint", { processed: 4 });
      return "success";
    },
    { kind: "SERVER" },
  );

  assert.equal(result, "success");
  const spans = getRecordedSpans();
  assert.ok(spans.length >= 1);
  const recorded = spans[0];
  assert.equal(recorded.name, "test.operation");
  assert.equal(recorded.kind, "SERVER");
  assert.equal(recorded.status.code, "OK");
  assert.equal(recorded.attributes["app.mode"], "simulation");
  assert.equal(recorded.attributes["app.risk"], 85);
  assert.equal(recorded.events.length, 1);
  assert.equal(recorded.events[0].name, "test_checkpoint");
  assert.ok(typeof recorded.durationMs === "number");
});

test("exportOtelResourceSpansJson emits standard OTLP JSON structure", () => {
  clearRecordedSpans();

  const span = new (class {
    public traceId = "0123456789abcdef0123456789abcdef";
    public spanId = "0123456789abcdef";
    public name = "test.export";
    public kind = "INTERNAL" as const;
    public startTimeUnixNano = 1000000000;
    public endTimeUnixNano = 2000000000;
    public durationMs = 1;
    public attributes = { "test.key": "val" };
    public events = [];
    public status = { code: "OK" as const };
  })();

  const otlp = exportOtelResourceSpansJson([span as any]) as any;
  assert.ok(otlp.resourceSpans);
  assert.equal(otlp.resourceSpans.length, 1);
  const scopeSpan = otlp.resourceSpans[0].scopeSpans[0];
  assert.equal(scopeSpan.scope.name, "scopebomb.core");
  assert.equal(scopeSpan.spans.length, 1);
  assert.equal(scopeSpan.spans[0].name, "test.export");
});
