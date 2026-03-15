## 1. Go Module Setup

- [x] 1.1 Create `api/` directory and run `go mod init github.com/fiddeb/spaceport/api`
- [x] 1.2 Add dependencies: `go get github.com/gin-gonic/gin`, `go get modernc.org/sqlite`, `go get github.com/XSAM/otelsql`
- [x] 1.3 Add OTel SDK: `go.opentelemetry.io/otel`, `go.opentelemetry.io/otel/sdk`, `go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin`, `go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp`, `go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc`
- [x] 1.4 Add metrics SDK: `go.opentelemetry.io/otel/sdk/metric`, `go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc`
- [x] 1.5 Create `api/Dockerfile` with multi-stage build: `golang:1.23-alpine` builder → `gcr.io/distroless/static` runner

## 2. OTel SDK Initialization

- [x] 2.1 Create `internal/telemetry/setup.go` with `Setup(ctx) (shutdown func(), err error)` that initializes TracerProvider and MeterProvider with OTLP gRPC exporters
- [x] 2.2 Set resource: `service.name = "spaceport-api"`, `service.version` from env, `deployment.environment.name`
- [x] 2.3 Call `telemetry.Setup()` in `main.go` before Gin setup, defer shutdown
- [x] 2.4 Register `otelgin.Middleware("spaceport-api")` as first Gin middleware

## 3. Database Setup

- [x] 3.1 Create `internal/db/db.go` that opens SQLite with `otelsql.Open("sqlite", path)` and enables WAL mode: `PRAGMA journal_mode=WAL`
- [x] 3.2 Create schema migrations in `internal/db/schema.go`: `CREATE TABLE IF NOT EXISTS departures (...)` and `CREATE TABLE IF NOT EXISTS bookings (...)`
- [x] 3.3 Embed `data/departures.json` using `//go:embed data/departures.json` and seed on startup if `departures` table is empty
- [x] 3.4 Create `data/departures.json` with 4 destinations: Mars, Titan, Europa, Moonbase Alpha — each with description, available seat classes, humor details

## 4. Departures API

- [x] 4.1 Create `internal/handler/departures.go` with `ListDepartures(c *gin.Context)` querying all departures from SQLite
- [x] 4.2 Wrap query in manual span `api.load_departures` with `spaceport.departure.destination` attribute
- [x] 4.3 Create `GetDeparture(c *gin.Context)` that fetches single departure, calls pricing service for prices and recommendations
- [x] 4.4 Wrap pricing calls in manual span `api.call_pricing_service` and `api.call_recommendation_service`
- [x] 4.5 Register routes: `GET /api/departures`, `GET /api/departures/:id`
- [x] 4.6 Create `GET /api/currencies` handler that proxies to pricing service `GET /currencies`; cache the response in memory after the first successful call so subsequent requests do not hit the pricing service

## 5. Bookings API

- [x] 5.1 Create `internal/handler/bookings.go` with `CreateBooking(c *gin.Context)`
- [x] 5.2 Wrap full booking logic in manual span `api.process_booking` with `spaceport.departure.id` and `spaceport.seat.class` attributes
- [x] 5.3 Generate UUID v4 for `booking_id` using `github.com/google/uuid`
- [x] 5.4 Call pricing service using `otelhttp.NewTransport`-wrapped client, record duration to `spaceport.pricing.request.duration` histogram
- [x] 5.5 Insert booking to SQLite (status: confirmed or failed), add `spaceport.booking.id` attribute to span
- [x] 5.6 Add span event `booking_completed` on success with `spaceport.booking.id`
- [x] 5.7 On pricing failure: set span error status, increment `spaceport.pricing.failures.count`, persist booking with `status = "failed"`, return 503

## 6. Health Endpoint

- [x] 6.1 Create `GET /api/health` handler that queries `SELECT COUNT(*) FROM bookings` and returns `{"status": "ok", "bookings_count": n}`

## 7. Structured Logging

- [x] 7.1 Create `internal/log/logger.go` with a `slog.Logger` using JSON handler that extracts `trace_id` and `span_id` from context via `trace.SpanFromContext(ctx)`
- [x] 7.2 Use context-aware logger in all handlers — log at INFO on request start, DEBUG for SQL, ERROR on pricing failure

## 8. Custom Metrics

- [x] 8.1 Create `internal/metrics/metrics.go` defining instruments: `spaceport.booking.count` (Int64Counter), `spaceport.pricing.request.duration` (Float64Histogram, unit `s`), `spaceport.pricing.failures.count` (Int64Counter)
- [x] 8.2 Record metrics in handlers at appropriate points

## 9. CORS Middleware

- [x] 9.1 Add `github.com/gin-contrib/cors` middleware configured to allow origin `${SPACEPORT_FRONTEND_ORIGIN}` (default `http://localhost:3000`) and headers including `traceparent`, `tracestate`, `Content-Type`
