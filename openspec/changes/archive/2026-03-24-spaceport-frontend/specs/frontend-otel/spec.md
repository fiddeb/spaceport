## ADDED Requirements

### Requirement: OTel SDK initialized before app renders
The frontend SHALL initialize the OpenTelemetry Web SDK in `src/instrumentation.ts` and import it as the first side-effect in `src/main.tsx`. The SDK SHALL configure: a BatchSpanProcessor exporting to the configured OTLP/HTTP endpoint, W3C TraceContext propagator, and auto-instrumentation for fetch and XHR.

#### Scenario: SDK is initialized before any fetch
- **WHEN** the app starts
- **THEN** the first fetch to `/api/departures` carries a `traceparent` header

#### Scenario: OTLP endpoint is configurable
- **WHEN** `VITE_OTEL_EXPORTER_OTLP_ENDPOINT` is set at build time
- **THEN** the SDK exports spans to that endpoint

### Requirement: W3C trace context propagated on all API calls
Every fetch call to the spaceport API SHALL automatically include `traceparent` and `tracestate` headers via the `@opentelemetry/instrumentation-fetch` auto-instrumentation.

#### Scenario: traceparent header is present
- **WHEN** the browser sends a request to `/api/departures`
- **THEN** the request includes a `traceparent` header in the W3C format (`00-<trace_id>-<span_id>-<flags>`)

### Requirement: Custom spans for user interactions
The frontend SHALL create custom spans with the following names and required attributes for key user interactions:

| Span name | Required attributes |
|---|---|
| `user.browse_departures` | none |
| `user.view_departure` | `spaceport.departure.id`, `spaceport.departure.destination` |
| `user.place_booking` | `spaceport.departure.id`, `spaceport.seat.class` |

Span names SHALL follow `namespace.verb_noun` snake_case format.

#### Scenario: Viewing a departure creates a span
- **WHEN** a user navigates to `/departures/:id`
- **THEN** a span named `user.view_departure` with attribute `spaceport.departure.id` is emitted

#### Scenario: Booking creates a span with seat class
- **WHEN** a user submits the booking form
- **THEN** a span named `user.place_booking` with attributes `spaceport.departure.id` and `spaceport.seat.class` is emitted

### Requirement: Booking completed event recorded on span
When a booking succeeds, the frontend SHALL add a span event named `booking_completed` to the active `user.place_booking` span with attribute `spaceport.booking.id`.

#### Scenario: Successful booking records event
- **WHEN** the booking API returns 201
- **THEN** a `booking_completed` event is added to the active span before the span ends

### Requirement: JS errors recorded to active span
The `ErrorBoundary` SHALL call `span.recordException(error)` and set `span.setStatus({ code: SpanStatusCode.ERROR })` when catching a component error.

#### Scenario: Component error appears in trace
- **WHEN** a component throws an error caught by the ErrorBoundary
- **THEN** the active span has an `exception` event with `exception.message` attribute

### Requirement: Service resource attributes
The OTel SDK SHALL set `service.name` to `spaceport-frontend` and `service.version` from `VITE_SERVICE_VERSION` build variable. `deployment.environment.name` SHALL default to `local`.

#### Scenario: Spans carry correct service.name
- **WHEN** spans are received by the collector
- **THEN** all frontend spans have `service.name = "spaceport-frontend"`
