## Why

The Go backend is the central hub of the demo — it serves the frontend, orchestrates calls to the pricing service, and is the primary source of server-side traces, metrics, and structured logs. Without it there are no cross-service traces, no backend metrics, and no log correlation to demonstrate in Grafana/Tempo/Loki.

## What Changes

- Scaffold a Go module in `api/` using Gin as the HTTP framework
- Implement API endpoints:
  - `GET /api/departures` — list available spaceport departures
  - `GET /api/departures/:id` — departure detail with pricing and recommendations
  - `POST /api/bookings` — place a booking (in-memory, returns confirmation)
  - `GET /api/health` — health check
- Static departure data from an embedded JSON file (no database)
- In-memory booking state (slice/map, no persistence)
- Call the Python pricing service for price calculation on departure detail and booking
- Call the Python pricing service for recommendations on departure detail
- Integrate OpenTelemetry Go SDK:
  - Auto-instrumentation for Gin HTTP handlers (otelgin middleware)
  - Auto-instrumentation for outgoing HTTP calls (otelhttp transport)
  - Manual business spans: `load_departures`, `call_pricing_service`, `call_recommendation_service`, `process_booking`
  - Structured logging with `slog` including `trace_id` and `span_id` on every log line
  - Custom Prometheus metrics: `bookings_total`, `pricing_request_duration_seconds`, `pricing_failures_total`
- CORS middleware allowing the frontend origin
- Dockerfile for the Go binary
- Graceful shutdown handling

## Non-goals

- No database — in-memory data is intentional for v1
- No gRPC — HTTP/JSON only
- No authentication or authorization
- No rate limiting
- No input validation beyond basic type safety — demo app, not production
- No WebSocket or SSE
- No exemplars in v1 (nice-to-have for later)

## Capabilities

### New Capabilities
- `api-departures`: REST API for listing and viewing spaceport departures with embedded static data
- `api-bookings`: REST API for placing bookings with in-memory state and downstream service calls
- `api-otel`: Server-side OpenTelemetry instrumentation — Gin middleware, outgoing HTTP tracing, manual business spans, structured log correlation, custom Prometheus metrics

### Modified Capabilities
<!-- No existing capabilities to modify -->

## Impact

- Depends on `project-foundation` for Docker and deployment
- Depends on `pricing-service` being available (should handle unavailability gracefully with fallback/error)
- Frontend depends on this API for all data
- Exposes port 8080
- Exports OTLP to the collector and Prometheus metrics on `/metrics`
