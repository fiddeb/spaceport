## Why

OpenTelemetry is deprecating the Span Event API (`Span.AddEvent`, `Span.RecordException`) in favor of log-based events emitted via the Logs API and correlated with the active span through context ([OTEP 4430](https://github.com/open-telemetry/opentelemetry-specification/blob/fd43145dde7e5192ebc59a20992d98a3e6af5553/oteps/4430-span-event-api-deprecation-plan.md), [blog post](https://opentelemetry.io/blog/2026/deprecating-span-events/)). All 12 event call sites in Spaceport currently use the deprecated path. Since this is a demo app meant to teach OTel best practices, it should follow the recommended approach.

## What Changes

- **Frontend**: Add a `LoggerProvider` (via `@opentelemetry/sdk-logs` + OTLP log exporter) to the browser SDK setup. Replace all `span.addEvent(...)` and `span.recordException(...)` calls with log-based event emission via `@opentelemetry/api-logs`.
- **Go API**: Replace `span.AddEvent("booking_completed", ...)` in `bookings.go` with a structured `slog.InfoContext` call (the `otelslog` bridge + `fanoutHandler` already routes logs to OTLP, so no new infrastructure needed).
- **Python pricing service**: Replace `span.add_event(...)` calls in `main.py` with `logging` calls through the existing OTel logging bridge.
- **Semconv registry**: Register all events as `type: event` groups in the Weaver registry (only `exhibit_viewed` is currently registered; the other 11 events are unregistered).
- **Weaver codegen**: Add or extend templates to generate typed event-emission helpers for TypeScript, Go, and Python from the event registry definitions.

## Capabilities

### New Capabilities
- `log-based-events`: Defines the pattern for emitting events as log records correlated with the active span, replacing `Span.AddEvent`/`Span.RecordException` across all three services. Covers LoggerProvider setup (frontend), event emission helpers, and the full event catalog registered in semconv.

### Modified Capabilities
- `api-otel`: The "Structured logging with trace correlation" requirement stays, but the Go API now also emits domain events (e.g. `booking_completed`) as log records instead of span events.
- `pricing-otel`: Chaos events (`chaos.failure_triggered`, `chaos.latency_injected`) move from span events to log-based events.

## Impact

- **frontend/src/instrumentation.ts** — new `LoggerProvider` + OTLP log exporter setup
- **frontend/src/pages/*.tsx**, **frontend/src/components/*.tsx**, **frontend/src/contexts/*.tsx** — replace `span.addEvent` / `span.recordException` calls (10 call sites)
- **api/internal/handler/bookings.go** — replace `span.AddEvent` with `slog.InfoContext` (1 call site)
- **pricing-service/pricing_service/main.py** — replace `span.add_event` with `logging` calls (2 call sites)
- **semconv/models/** — add event definitions for all 12 events currently emitted as span events
- **semconv/templates/** — new or extended codegen templates for typed event helpers
- **Generated code** in `frontend/src/semconv/`, `api/internal/semconv/`, `pricing_service/pricing_service/semconv/` — regenerated after registry + template changes
- No breaking API changes — this is an internal telemetry migration
- No new dependencies for Go or Python (bridges already in place); frontend adds `@opentelemetry/api-logs` + `@opentelemetry/sdk-logs`
