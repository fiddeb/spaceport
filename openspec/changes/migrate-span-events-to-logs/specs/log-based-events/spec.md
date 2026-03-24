## ADDED Requirements

### Requirement: Events emitted as log records with EventName
All domain events SHALL be emitted as log records via the Logs API (not `Span.AddEvent`). Each log record SHALL identify the event type using the OTel Logs Data Model `EventName` field where the SDK supports it natively (frontend JS: `eventName` parameter on `logger.emit`), or via an `event.name` attribute where the logging bridge does not yet expose the top-level field (Go `otelslog`, Python logging bridge). The log record SHALL be emitted within an active span context so that trace correlation is automatic.

#### Scenario: Frontend booking_completed event is a log record
- **WHEN** a booking succeeds in the frontend
- **THEN** a log record with `eventName = "booking_completed"` and `spaceport.booking.id` is emitted via `logger.emit` and appears in Loki correlated with the booking span's trace_id

#### Scenario: Frontend booking_failed event is a log record
- **WHEN** a booking fails in the frontend
- **THEN** a log record with `eventName = "booking_failed"`, severity ERROR, and `error.message` is emitted via `logger.emit`

#### Scenario: Frontend exhibit_viewed event is a log record
- **WHEN** an exhibit scrolls into the viewport on the Information Desk page
- **THEN** a log record with `eventName = "exhibit_viewed"`, `spaceport.exhibit.id`, and `spaceport.exhibit.title` is emitted via `logger.emit`

#### Scenario: Frontend fetch_departures_failed event is a log record
- **WHEN** the departures list fetch fails
- **THEN** a log record with `eventName = "fetch_departures_failed"` and severity ERROR is emitted via `logger.emit`

#### Scenario: Frontend fetch_departure_failed event is a log record
- **WHEN** a single departure detail fetch fails
- **THEN** a log record with `eventName = "fetch_departure_failed"`, `spaceport.departure.id`, and severity ERROR is emitted via `logger.emit`

#### Scenario: Frontend exchange_completed event is a log record
- **WHEN** the user changes the display currency
- **THEN** a log record with `eventName = "exchange_completed"` is emitted via `logger.emit`

#### Scenario: Frontend exception event is a log record
- **WHEN** the ErrorBoundary catches an uncaught exception
- **THEN** a log record with `eventName = "exception"`, `exception.type`, `exception.message`, and severity ERROR is emitted via `logger.emit` instead of `Span.RecordException`

#### Scenario: Go API booking_completed event is a log record
- **WHEN** a booking is confirmed in the Go API
- **THEN** a structured log with `event.name = "booking_completed"` attribute and `spaceport.booking.id` is emitted via `slog.InfoContext` (routed to OTLP via otelslog bridge)

#### Scenario: Python chaos.failure_triggered event is a log record
- **WHEN** chaos failure mode is active and a request hits the pricing service
- **THEN** a log record with `event.name = "chaos.failure_triggered"` attribute and `spaceport.chaos.failure_mode` is emitted via Python logging

#### Scenario: Python chaos.latency_injected event is a log record
- **WHEN** chaos latency mode is active and a request hits the pricing service
- **THEN** a log record with `event.name = "chaos.latency_injected"` attribute and `spaceport.chaos.latency_ms` is emitted via Python logging

### Requirement: No Span.AddEvent or Span.RecordException calls
After migration, the codebase SHALL contain zero calls to `Span.AddEvent`, `span.addEvent`, `span.add_event`, or `span.recordException` / `Span.RecordException`. All events SHALL use the Logs API exclusively.

#### Scenario: Codebase grep returns no span event calls
- **WHEN** searching the codebase with `rg 'AddEvent|addEvent|add_event|RecordException|recordException|record_exception'` restricted to `.ts`, `.tsx`, `.go`, `.py` files
- **THEN** no matches are found in application code (test files and vendor/node_modules excluded)

### Requirement: All events registered in semconv registry
Every event emitted by any service SHALL have a corresponding `type: event` group in the Weaver semconv registry under `semconv/models/`. Each event definition SHALL list its expected attributes with `ref:` references to registered attributes.

#### Scenario: Weaver registry check passes with all events
- **WHEN** `weaver registry check -r models/` is run in the semconv directory
- **THEN** the check passes with exit code 0 and all event groups are valid

#### Scenario: Registry contains all 12 events
- **WHEN** listing all groups with `type: event` in the registry
- **THEN** the following event names are defined: `booking_completed`, `booking_failed`, `exhibit_viewed`, `fetch_departures_failed`, `fetch_departure_failed`, `exchange_completed`, `exception`, `chaos.failure_triggered`, `chaos.latency_injected`

### Requirement: Trace correlation preserved for all events
Log-based events SHALL maintain trace correlation. When emitted within an active span context, the log record SHALL automatically carry the span's trace_id and span_id via the OTel context propagation built into each service's log bridge.

#### Scenario: Frontend log event appears in Tempo span details
- **WHEN** a booking_completed event is emitted in the frontend
- **THEN** the log record appears in Grafana's "Logs for this span" panel on the corresponding trace, correlated by trace_id

#### Scenario: Go API log event carries trace context
- **WHEN** a booking_completed event is emitted via slog.InfoContext in the Go API
- **THEN** the stdout JSON log includes trace_id and span_id fields, and the OTLP log record carries trace context via the otelslog bridge
