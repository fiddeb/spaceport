## ADDED Requirements

### Requirement: Gin HTTP server spans via otelgin
Every HTTP request to the API SHALL produce a server span using `otelgin` middleware. The span SHALL extract W3C `traceparent` from incoming headers as parent context.

#### Scenario: Frontend span is parent of API span
- **WHEN** the frontend sends a request with `traceparent` header to `GET /api/departures`
- **THEN** the resulting server span in Tempo has the frontend span as its parent

#### Scenario: Server span has required attributes
- **WHEN** any API endpoint is called
- **THEN** the span has attributes: `http.request.method`, `url.path`, `http.response.status_code`, `server.address`, `network.protocol.version`

### Requirement: Database query spans via otelsql
Every SQLite query executed via `database/sql` SHALL produce a child span with attributes: `db.system.name = "sqlite"`, `db.operation.name`, `db.query.text`, `db.namespace`.

#### Scenario: Departure list query appears as DB span
- **WHEN** `GET /api/departures` is called
- **THEN** at least one span with `db.system.name = "sqlite"` and `db.operation.name = "SELECT"` appears as a child of the server span

### Requirement: Outgoing HTTP to pricing service traced via otelhttp
The `http.Client` used for all pricing service calls SHALL use `otelhttp.NewTransport(http.DefaultTransport)` so outgoing requests inject `traceparent` and produce client spans.

#### Scenario: Pricing service call is child span of API span
- **WHEN** `GET /api/departures/:id` is processed
- **THEN** Tempo shows the pricing service server span as a child of the API's `api.call_pricing_service` span

### Requirement: Manual business spans
The API SHALL create explicit spans for: `api.load_departures`, `api.call_pricing_service`, `api.call_recommendation_service`, `api.process_booking`. Each SHALL be a child of the incoming request span.

#### Scenario: Business spans appear in trace
- **WHEN** `POST /api/bookings` is processed
- **THEN** the trace in Tempo contains spans named `api.process_booking`, `api.call_pricing_service`, and at least one SQLite DB span

### Requirement: Business span attributes use Weaver-defined names
All `spaceport.*` attributes set on manual spans SHALL use exact attribute names defined in the Weaver registry. Span attributes SHALL include at least: `spaceport.departure.id` on departure-related spans, `spaceport.booking.id` and `spaceport.seat.class` on booking spans.

#### Scenario: Booking span attributes match registry
- **WHEN** a booking is processed
- **THEN** the `api.process_booking` span has attributes `spaceport.booking.id` and `spaceport.seat.class` matching Weaver-defined names

### Requirement: Structured logging with trace correlation
Every log line SHALL be structured JSON (via `slog`) and SHALL include `trace_id` and `span_id` extracted from the request context. Log level SHALL default to `INFO`.

#### Scenario: Log lines contain trace_id
- **WHEN** a request is processed and logs are emitted to stdout
- **THEN** log lines contain `trace_id` and `span_id` fields matching the active span

### Requirement: Custom metrics exported via OTLP
The API SHALL export via OTLP the following metrics: `spaceport.booking.count` (counter, incremented per booking), `spaceport.pricing.request.duration` (histogram, seconds), `spaceport.pricing.failures.count` (counter), service name set to `spaceport-api`.

#### Scenario: Booking counter increments
- **WHEN** a booking is created
- **THEN** `spaceport.booking.count` metric increments by 1
