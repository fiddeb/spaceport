## ADDED Requirements

### Requirement: FastAPI auto-instrumentation creates server spans
The service SHALL use `FastAPIInstrumentor().instrument_app(app)` after OTel SDK initialization. Every incoming HTTP request SHALL produce a server span that extracts W3C `traceparent` from the Go API's outgoing request.

#### Scenario: API span is parent of pricing span
- **WHEN** the Go API calls `GET /price/1` with `traceparent` header
- **THEN** the pricing service server span appears as a child of the Go API's `api.call_pricing_service` span in Tempo

#### Scenario: Server span has standard HTTP attributes
- **WHEN** any pricing endpoint is called
- **THEN** the span has attributes: `http.request.method`, `url.path`, `http.response.status_code`, `server.address`

### Requirement: Manual pricing span with spaceport.* attributes
The pricing calculation logic SHALL be wrapped in a manual child span named `pricing.calculate`. The span SHALL set attributes using Weaver-defined names: `spaceport.departure.id`, `spaceport.departure.destination`, `spaceport.seat.class`, `spaceport.pricing.total`, `spaceport.pricing.promo_applied`, `spaceport.pricing.base_currency`, `spaceport.pricing.display_currency`.

#### Scenario: Pricing span has business attributes
- **WHEN** `GET /price/1` is processed
- **THEN** Tempo shows a child span `pricing.calculate` with `spaceport.seat.class` and `spaceport.pricing.total` attributes

### Requirement: Recommendation span with spaceport.* attributes
The recommendations logic SHALL be wrapped in a manual span named `pricing.recommend` with attribute `spaceport.departure.id`.

#### Scenario: Recommendation span appears in trace
- **WHEN** the Go API calls `GET /recommendations/1`
- **THEN** a span named `pricing.recommend` with `spaceport.departure.id` appears in the trace

### Requirement: Chaos spans include chaos attributes
When chaos mode (failure or latency) is active, the active span SHALL be annotated with `spaceport.chaos.failure_mode` (string) or `spaceport.chaos.latency_ms` (int) as applicable.

#### Scenario: Failure span has chaos attribute
- **WHEN** simulate-failure is active and a pricing request fails
- **THEN** the span has attribute `spaceport.chaos.failure_mode` set and span status set to ERROR

### Requirement: Structured logging with trace correlation
Every log line SHALL include `trace_id` and `span_id` extracted from the current OTel context, in JSON format, written to stdout.

#### Scenario: Log lines contain trace_id matching the active span
- **WHEN** a request is processed
- **THEN** log lines emitted during that request contain `trace_id` matching the root trace ID visible in Tempo

### Requirement: Service resource attributes
The OTel SDK SHALL configure `service.name = "spaceport-pricing-service"`, `service.version` from `SERVICE_VERSION` env var, `deployment.environment.name` from `DEPLOYMENT_ENV` (default `local`).

#### Scenario: Spans carry correct service.name
- **WHEN** spans are received by the collector
- **THEN** all pricing service spans have `service.name = "spaceport-pricing-service"`
