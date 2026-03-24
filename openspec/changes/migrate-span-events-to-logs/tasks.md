## 1. Semconv Registry — Register All Events

- [ ] 1.1 Add event definitions for frontend events (`booking_completed`, `booking_failed`, `exhibit_viewed`, `fetch_departures_failed`, `fetch_departure_failed`, `exchange_completed`, `exception`) to `semconv/models/` as `type: event` groups with attribute refs
- [ ] 1.2 Add event definitions for Go API events (`booking_completed`) to `semconv/models/`
- [ ] 1.3 Add event definitions for Python pricing events (`chaos.failure_triggered`, `chaos.latency_injected`) to `semconv/models/`
- [ ] 1.4 Run `weaver registry check -r models/` and verify exit code 0

## 2. Frontend — Migrate Span Events to Log-Based Events

- [ ] 2.1 In `BookingFormPage.tsx`: remove `span.addEvent("booking_completed", ...)`, add `event.name` attribute to existing `logger.emit` call
- [ ] 2.2 In `BookingFormPage.tsx`: remove `span.addEvent("booking_failed", ...)`, add `event.name` attribute to existing `logger.emit` call
- [ ] 2.3 In `InformationDeskPage.tsx`: remove `spanRef.current?.addEvent("exhibit_viewed", ...)`, add `event.name` attribute to existing `logger.emit` call and include full exhibit attributes
- [ ] 2.4 In `DepartureListPage.tsx`: remove `spanRef.current.addEvent("fetch_departures_failed", ...)`, add `event.name` attribute to existing `logger.emit` call
- [ ] 2.5 In `DepartureDetailPage.tsx`: remove `spanRef.current.addEvent("fetch_departure_failed", ...)`, add `event.name` attribute to existing `logger.emit` call
- [ ] 2.6 In `CurrencyContext.tsx`: remove `span.addEvent("exchange_completed")`, add `logger.emit` call with `event.name = "exchange_completed"`
- [ ] 2.7 In `ErrorBoundary.tsx`: remove `span.recordException(error)`, add `event.name = "exception"` with `exception.type` and `exception.message` to existing `logger.emit` call
- [ ] 2.8 In `ChaosMenu.tsx`: remove `span.addEvent("booking_failed", ...)`, add `logger.emit` with `event.name` for failure path
- [ ] 2.9 In `ChaosMenu.tsx`: remove `span.addEvent("booking_completed", ...)`, add `logger.emit` with `event.name` for success path

## 3. Go API — Migrate Span Event to Log-Based Event

- [ ] 3.1 In `bookings.go`: remove `span.AddEvent("booking_completed", ...)`, add `"event.name", "booking_completed"` to existing `slog.InfoContext` call

## 4. Python Pricing Service — Migrate Span Events to Log-Based Events

- [ ] 4.1 In `main.py`: replace `span.add_event("chaos.failure_triggered", ...)` with `logger.error(...)` call including `event.name` as extra kwarg
- [ ] 4.2 In `main.py`: replace `span.add_event("chaos.latency_injected", ...)` with `logger.warning(...)` call including `event.name` as extra kwarg

## 5. Verification

- [ ] 5.1 Run `rg 'AddEvent|addEvent|add_event|RecordException|recordException|record_exception' -g '*.ts' -g '*.tsx' -g '*.go' -g '*.py'` — confirm zero matches in application code
- [ ] 5.2 Run `weaver registry check -r models/` — confirm exit code 0
- [ ] 5.3 Start all services with `just dev` or `./dev.sh`, create a booking, verify log-based events appear in stdout/console with `event.name` attribute
- [ ] 5.4 If OTLP endpoint is available: verify events appear in Grafana Loki correlated with trace_id
