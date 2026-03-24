## MODIFIED Requirements

### Requirement: Structured logging with trace correlation
Every log line SHALL be structured JSON (via `slog`) and SHALL include `trace_id` and `span_id` extracted from the request context. Log level SHALL default to `INFO`. Domain events (e.g. `booking_completed`) SHALL be emitted as structured log records with an `event.name` slog attribute via `slog.InfoContext`, replacing any `span.AddEvent` calls. The `otelslog` bridge SHALL route these event logs to the OTLP collector alongside regular application logs. The `event.name` attribute lands in OTLP log attributes (the `otelslog` bridge does not yet expose the top-level `EventName` field; it can be promoted in a future bridge upgrade).

#### Scenario: Log lines contain trace_id
- **WHEN** a request is processed and logs are emitted to stdout
- **THEN** log lines contain `trace_id` and `span_id` fields matching the active span

#### Scenario: Booking completed event is a structured log
- **WHEN** a booking is confirmed
- **THEN** a log line with `event.name = "booking_completed"` and `spaceport.booking.id` is emitted to both stdout (JSON) and OTLP, with no corresponding `span.AddEvent` call
