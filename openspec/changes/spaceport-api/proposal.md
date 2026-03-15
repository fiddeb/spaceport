## Why

The Go backend is the central hub of the demo — it serves the frontend, orchestrates calls to the pricing service, and is the primary source of server-side traces, metrics, and structured logs. Without it there are no cross-service traces, no backend metrics, and no log correlation to demonstrate in Grafana/Tempo/Loki.

## What Changes

- Scaffold a Go module in `api/` using Gin as the HTTP framework
- Implement API endpoints:
  - `GET /api/departures` — list available spaceport departures
  - `GET /api/departures/:id` — departure detail with pricing and recommendations
  - `POST /api/bookings` — place a booking (persisted to SQLite)
  - `GET /api/health` — health check
- SQLite database (via `modernc.org/sqlite` — pure Go, no CGO) as the persistence layer:
  - Seed departure data from an embedded JSON file on first startup
  - Persist bookings to a `bookings` table
  - This is the intentional choice for v1 — SQLite keeps setup simple (single file, no server) while enabling database span tracing
- Call the Python pricing service for price calculation on departure detail and booking
- Call the Python pricing service for recommendations on departure detail
- Integrate OpenTelemetry Go SDK:
  - Auto-instrumentation for Gin HTTP handlers (otelgin middleware)
  - Auto-instrumentation for outgoing HTTP calls (otelhttp transport)
  - Database tracing via `otelsql` wrapper around the SQLite driver — every query produces a `db.query` span with `db.statement`, `db.system`, `db.operation` attributes
  - Manual business spans: `load_departures`, `call_pricing_service`, `call_recommendation_service`, `process_booking`
  - Structured logging with `slog` including `trace_id` and `span_id` on every log line
  - Custom Prometheus metrics: `bookings_total`, `pricing_request_duration_seconds`, `pricing_failures_total`, `db_query_duration_seconds`
- CORS middleware allowing the frontend origin
- Dockerfile for the Go binary (SQLite file persisted via Docker volume or K8s PVC)
- Graceful shutdown handling

## Non-goals

- No PostgreSQL or other server-based database — SQLite is intentional for laptop simplicity
- No database migrations framework — schema created on startup via `CREATE TABLE IF NOT EXISTS`
- No gRPC — HTTP/JSON only
- No authentication or authorization
- No rate limiting
- No input validation beyond basic type safety — demo app, not production
- No WebSocket or SSE
- No exemplars in v1 (nice-to-have for later)

## Capabilities

### New Capabilities
- `api-departures`: REST API for listing and viewing spaceport departures, seeded from embedded JSON into SQLite on startup
- `api-bookings`: REST API for placing bookings persisted to SQLite, with downstream service calls to pricing service
- `api-otel`: Server-side OpenTelemetry instrumentation — Gin middleware, outgoing HTTP tracing, SQLite database span tracing via `otelsql`, manual business spans, structured log correlation, custom Prometheus metrics

### Modified Capabilities
<!-- No existing capabilities to modify -->

## Impact

- Depends on `project-foundation` for Docker and deployment
- Depends on `pricing-service` being available (should handle unavailability gracefully with fallback/error)
- Frontend depends on this API for all data
- SQLite database file needs a writable volume mount in Docker/K8s
- Exposes port 8080
- Exports OTLP to the collector and Prometheus metrics on `/metrics`
