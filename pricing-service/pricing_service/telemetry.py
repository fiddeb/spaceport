"""OpenTelemetry SDK initialization for the pricing service."""

import os

# Opt into stable HTTP semantic conventions for metric names.
os.environ.setdefault("OTEL_SEMCONV_STABILITY_OPT_IN", "http")

from opentelemetry import _logs, metrics, trace
from opentelemetry.exporter.otlp.proto.http._log_exporter import OTLPLogExporter
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.metrics.view import ExplicitBucketHistogramAggregation, View
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor


def setup_telemetry() -> None:
    if not os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "").strip():
        return

    resource = Resource.create(
        {
            "service.name": "spaceport-pricing-service",
            "service.version": os.environ.get("OTEL_SERVICE_VERSION", "0.1.0"),
            "deployment.environment.name": os.environ.get("SPACEPORT_ENV", "local"),
        }
    )

    # Traces
    tracer_provider = TracerProvider(resource=resource)
    tracer_provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
    trace.set_tracer_provider(tracer_provider)

    # Metrics
    # Default SDK buckets are ms-scale (0, 5, 10, …, 10 000) but
    # http.server.request.duration records in seconds — override to match.
    http_duration_view = View(
        instrument_name="http.server.request.duration",
        aggregation=ExplicitBucketHistogramAggregation(
            boundaries=(0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0, 7.5, 10.0),
        ),
    )
    metric_reader = PeriodicExportingMetricReader(OTLPMetricExporter(), export_interval_millis=10000)
    meter_provider = MeterProvider(
        resource=resource,
        metric_readers=[metric_reader],
        views=[http_duration_view],
    )
    metrics.set_meter_provider(meter_provider)

    # Logs
    logger_provider = LoggerProvider(resource=resource)
    logger_provider.add_log_record_processor(BatchLogRecordProcessor(OTLPLogExporter()))
    _logs.set_logger_provider(logger_provider)

    return logger_provider
