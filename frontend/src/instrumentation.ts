import { WebTracerProvider, BatchSpanProcessor } from "@opentelemetry/sdk-trace-web";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { XMLHttpRequestInstrumentation } from "@opentelemetry/instrumentation-xml-http-request";
import { propagation, trace, metrics } from "@opentelemetry/api";
import { LoggerProvider, BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { MeterProvider, PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";

const serviceVersion = import.meta.env.VITE_SERVICE_VERSION || "0.0.0";

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: "spaceport-frontend",
  [ATTR_SERVICE_VERSION]: serviceVersion,
  "deployment.environment.name": "local",
});

// --- Traces ---
const traceExporter = new OTLPTraceExporter({
  url: "/otlp/v1/traces",
});

const tracerProvider = new WebTracerProvider({
  resource,
  spanProcessors: [new BatchSpanProcessor(traceExporter)],
});

propagation.setGlobalPropagator(new W3CTraceContextPropagator());
tracerProvider.register();

registerInstrumentations({
  instrumentations: [
    new FetchInstrumentation({
      propagateTraceHeaderCorsUrls: [/.*/],
    }),
    new XMLHttpRequestInstrumentation({
      propagateTraceHeaderCorsUrls: [/.*/],
    }),
  ],
  tracerProvider,
});

// --- Logs ---
const logExporter = new OTLPLogExporter({
  url: "/otlp/v1/logs",
});

const loggerProvider = new LoggerProvider({
  resource,
  processors: [new BatchLogRecordProcessor(logExporter)],
});
logs.setGlobalLoggerProvider(loggerProvider);

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
});
metrics.setGlobalMeterProvider(meterProvider);

// --- Exports ---
export const tracer = trace.getTracer("spaceport-frontend", serviceVersion);
export const logger = logs.getLogger("spaceport-frontend", serviceVersion);
export const meter = metrics.getMeter("spaceport-frontend", serviceVersion);
export { SeverityNumber };
