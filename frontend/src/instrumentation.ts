import { WebTracerProvider, BatchSpanProcessor } from "@opentelemetry/sdk-trace-web";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  ATTR_HTTP_RESPONSE_STATUS_CODE,
} from "@opentelemetry/semantic-conventions";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { propagation, trace, metrics, context as otelContext, ROOT_CONTEXT, SpanKind, SpanStatusCode } from "@opentelemetry/api";
import { LoggerProvider, BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { MeterProvider, PeriodicExportingMetricReader, AggregationType } from "@opentelemetry/sdk-metrics";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import {
  SpaceportFrontendPageViews,
  SpaceportFrontendBookings,
  SpaceportFrontendExhibitViews,
  SpaceportFrontendExhibitDwellTime,
} from "@/semconv/metric";
import { SPACEPORT_CHAOS_FAILURE_MODE, SPACEPORT_CHAOS_LATENCY_MS } from "@/semconv/attribute";

const serviceVersion = import.meta.env.VITE_SERVICE_VERSION || "0.0.0";

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: "spaceport-frontend",
  [ATTR_SERVICE_VERSION]: serviceVersion,
  "deployment.environment.name": import.meta.env.VITE_SPACEPORT_ENV || "local",
});

// --- Traces ---
const traceExporter = new OTLPTraceExporter({
  url: "/otlp/v1/traces",
});

const tracerProvider = new WebTracerProvider({
  resource,
  spanProcessors: [new BatchSpanProcessor(traceExporter, { scheduledDelayMillis: 500 })],
});

propagation.setGlobalPropagator(new W3CTraceContextPropagator());
tracerProvider.register();

// --- Logs ---
const logExporter = new OTLPLogExporter({
  url: "/otlp/v1/logs",
});

const loggerProvider = new LoggerProvider({
  resource,
  processors: [new BatchLogRecordProcessor({ exporter: logExporter })],
});
logs.setGlobalLoggerProvider(loggerProvider);

// Flush on tab hide/close so spans aren't lost during navigation.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    tracerProvider.forceFlush();
    loggerProvider.forceFlush();
  }
});

// --- Metrics ---
const metricExporter = new OTLPMetricExporter({
  url: "/otlp/v1/metrics",
});

const meterProvider = new MeterProvider({
  resource,
  readers: [new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 15000,
  })],
  // Default SDK buckets are ms-scale (0, 5, 10, …, 10 000) — wrong for
  // seconds-scale histograms. Override exhibit dwell time with sensible
  // boundaries for viewport dwell (typically 1–30 s).
  views: [{
    instrumentName: "spaceport.frontend.exhibit_dwell_time",
    aggregation: {
      type: AggregationType.EXPLICIT_BUCKET_HISTOGRAM,
      options: { boundaries: [0.5, 1, 2, 5, 10, 15, 20, 30, 45, 60] },
    },
  }],
});
metrics.setGlobalMeterProvider(meterProvider);

// --- Exports ---
export const tracer = trace.getTracer("spaceport-frontend", serviceVersion);
export const logger = logs.getLogger("spaceport-frontend", serviceVersion);
export const meter = metrics.getMeter("spaceport-frontend", serviceVersion);
export { SeverityNumber };

// --- Semconv metric instruments (instantiated once, reused across pages) ---
export const pageViewCounter = new SpaceportFrontendPageViews(meter);
export const bookingCounter = new SpaceportFrontendBookings(meter);
export const exhibitViewCounter = new SpaceportFrontendExhibitViews(meter);
export const exhibitDwellHistogram = new SpaceportFrontendExhibitDwellTime(meter);

let failureCount = 0;
let latencyCount = 0;
let latencyMs = 0;

export function setFrontendChaos(mode: "failure" | "latency", count: number, delayMs = 0): void {
  if (!Number.isInteger(count) || count < 0 || count > 100 ||
      (mode === "latency" && (!Number.isInteger(delayMs) || delayMs < 0 || delayMs > 10000))) {
    throw new Error("Invalid frontend chaos settings");
  }
  if (mode === "failure") failureCount = count;
  else {
    latencyCount = count;
    latencyMs = delayMs;
  }
}

/**
 * Fetch with W3C trace context propagation.
 * Injects traceparent/tracestate from the given (or active) OTel context.
 */
export async function tracedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  ctx?: typeof ROOT_CONTEXT,
): Promise<Response> {
  const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
  const url = new URL(input instanceof Request ? input.url : String(input), location.href);
  const chaosEligible = url.pathname.startsWith("/api/") && !url.pathname.startsWith("/api/chaos/");
  const span = tracer.startSpan(`HTTP ${method} ${url.pathname}`, { kind: SpanKind.CLIENT }, ctx ?? otelContext.active());
  const requestContext = trace.setSpan(ctx ?? otelContext.active(), span);
  const headers: Record<string, string> = {};
  propagation.inject(requestContext, headers);
  try {
    if (chaosEligible && failureCount > 0) {
      failureCount--;
      span.addEvent("chaos.failure_triggered", { [SPACEPORT_CHAOS_FAILURE_MODE]: "frontend_network_failure" });
      throw new Error("Simulated frontend network failure");
    }
    if (chaosEligible && latencyCount > 0) {
      latencyCount--;
      span.addEvent("chaos.latency_injected", { [SPACEPORT_CHAOS_LATENCY_MS]: latencyMs });
      await new Promise((resolve) => setTimeout(resolve, latencyMs));
    }
    const requestHeaders = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init?.headers).forEach((value, key) => requestHeaders.set(key, value));
    Object.entries(headers).forEach(([key, value]) => requestHeaders.set(key, value));
    const response = await fetch(input, { ...init, headers: requestHeaders });
    span.setAttribute(ATTR_HTTP_RESPONSE_STATUS_CODE, response.status);
    if (response.status >= 400) span.setStatus({ code: SpanStatusCode.ERROR, message: `HTTP ${response.status}` });
    return response;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : String(error) });
    throw error;
  } finally {
    span.end();
  }
}
