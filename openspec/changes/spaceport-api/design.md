## Context

The Go API is the backbone of the demo — the only service the frontend talks to directly, and the orchestrator for calls to the pricing service. It must produce richly instrumented server-side traces that connect frontend spans (via W3C `traceparent`) through to the pricing service, forming the full distributed trace visible in Tempo. SQLite (via `modernc.org/sqlite`) is used as the database so database query spans are visible in traces alongside HTTP and business spans.

## Goals / Non-Goals

**Goals:**
- Go + Gin API serving the frontend with departure, booking, and health endpoints
- SQLite database seeded from embedded JSON, with `otelsql` wrapping the driver for DB span tracing
- Outgoing HTTP calls to the pricing service traced with `otelhttp` transport
- Structured `slog` logging correlated with `trace_id`/`span_id`
- Prometheus metrics on `/metrics`, sent via OTLP push to collector

**Non-Goals:**
- Database migrations framework — `CREATE TABLE IF NOT EXISTS` on startup
- Authentication or authorization
- Input validation beyond basic type safety
- gRPC — HTTP/JSON only
- Exemplars in v1

## Decisions

### 1. Gin with otelgin middleware

**Decision**: Use `github.com/gin-gonic/gin` with `go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin` middleware. The middleware creates a server span per request, extracts W3C `traceparent` from incoming request headers, and sets the span as the context's active span.

**Rationale**: otelgin is the canonical OTel middleware for Gin. It handles trace context extraction automatically, so no manual header parsing is needed. Every request gets a server span with correct parent-child relationships to the frontend's fetch span.

### 2. modernc.org/sqlite with otelsql

**Decision**: Use `modernc.org/sqlite` (pure Go, no CGO) as the SQLite driver wrapped with `github.com/XSAM/otelsql`. Register with `otelsql.Open(...)` so every `database/sql` call produces a `db.query` span.

**Rationale**: Pure Go driver eliminates CGO complexity in Docker builds and avoids cross-compilation issues. `otelsql` wraps the standard `database/sql` interface, so no application code changes are needed per query — the spans appear automatically. This is the most impressive database span demo: plain SQL queries appearing as spans in Tempo with `db.statement`, `db.system.name = "sqlite"`, `db.operation.name`.

**otelsql span attributes**: Enabled: `db.statement`, `db.operation.name`, `db.namespace`. `db.system.name = "sqlite"`.

### 3. Outgoing HTTP to pricing service via otelhttp transport

**Decision**: Wrap the `http.Client` used to call the pricing service with `otelhttp.NewTransport(http.DefaultTransport)`. This injects `traceparent` into outgoing requests automatically.

**Rationale**: With one line of code, every call to the pricing service carries trace context, making the resulting spans parent-child of the active API span. The complete trace (frontend → API → pricing) appears automatically in Tempo.

### 4. Manual business spans

**Decision**: Wrap the following logic blocks in explicit manual spans:
- `api.load_departures` — when querying SQLite for the departure list
- `api.call_pricing_service` — wrapping the HTTP call group to pricing
- `api.call_recommendation_service` — wrapping the HTTP call to pricing recommendations
- `api.process_booking` — wrapping booking validation, pricing call, and SQLite insert

**Rationale**: Auto-instrumentation shows low-level spans. Manual business spans show *what the code is doing* at a business level — this is the educational content of the demo. You can see in Tempo: "this booking took 300ms in process_booking, 250ms of which was call_pricing_service".

### 5. slog with trace correlation

**Decision**: Create a `log.Logger` using `slog/handler` that extracts `trace_id` and `span_id` from the current context and adds them as structured fields on every log line. Log to stdout in JSON format.

**Rationale**: Loki can then correlate logs with traces. In Grafana, clicking a trace ID in a log line navigates to the Tempo trace — this is the "correlated logs" demo scenario.

### 6. Prometheus metrics via OTLP push

**Decision**: Use the OTel Go metrics SDK with OTLP exporter (push model) rather than exposing a `/metrics` scrape endpoint.

**Rationale**: Demonstrates OTel metrics pipeline (not just traces). Mimir/Prometheus in the observabilitystack accepts OTLP metrics. Custom metrics: `spaceport.booking.count` (counter), `spaceport.pricing.request.duration` (histogram, seconds), `spaceport.pricing.failures.count` (counter), `spaceport.db.query.duration` (histogram, seconds via otelsql).

**Metric names follow OTel semconv instrument naming**: `{namespace}.{noun}.{measurement}`.

## Risks / Trade-offs

- **SQLite concurrent writes** → SQLite in WAL mode handles concurrent reads well but serializes writes. For a demo with one user this is not an issue. Mitigation: Enable WAL mode at startup with `PRAGMA journal_mode=WAL`.
- **pricing service unavailability** → If the pricing service is down, departure detail and booking endpoints must degrade gracefully. Mitigation: Return HTTP 503 with error span and log, not a panic.
- **CORS headers must include traceparent** → If CORS is misconfigured, the browser will strip `traceparent` and cross-service traces break at the origin. Mitigation: Add `traceparent`, `tracestate` to CORS `AllowHeaders`.

## Open Questions

- Should failed bookings be persisted to SQLite? → Yes, with `status = "failed"` — makes for better trace/log demo scenarios.
