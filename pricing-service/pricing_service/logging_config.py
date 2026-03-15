"""JSON log formatter with OpenTelemetry trace correlation + OTLP log bridge."""

import json
import logging

from opentelemetry import trace
from opentelemetry.sdk._logs import LoggingHandler


class JsonTraceFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        span = trace.get_current_span()
        ctx = span.get_span_context() if span else None

        log_entry = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "trace_id": format(ctx.trace_id, "032x") if ctx and ctx.trace_id else "",
            "span_id": format(ctx.span_id, "016x") if ctx and ctx.span_id else "",
        }

        if record.exc_info and record.exc_info[1]:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry)


def setup_logging() -> None:
    # Stdout handler (JSON with trace correlation)
    stdout_handler = logging.StreamHandler()
    stdout_handler.setFormatter(JsonTraceFormatter())

    # OTLP handler (bridges Python logging → OTel LoggerProvider → collector)
    otel_handler = LoggingHandler()

    root = logging.getLogger()
    root.setLevel(logging.INFO)
    root.handlers.clear()
    root.addHandler(stdout_handler)
    root.addHandler(otel_handler)
