"""OpenTelemetry SDK initialization for the pricing service."""

import os

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor


def setup_telemetry() -> None:
    resource = Resource.create(
        {
            "service.name": "spaceport-pricing-service",
            "service.version": os.environ.get("OTEL_SERVICE_VERSION", "0.1.0"),
            "deployment.environment.name": os.environ.get("SPACEPORT_ENV", "local"),
        }
    )

    provider = TracerProvider(resource=resource)
    exporter = OTLPSpanExporter()
    provider.add_span_processor(BatchSpanProcessor(exporter))
    trace.set_tracer_provider(provider)
