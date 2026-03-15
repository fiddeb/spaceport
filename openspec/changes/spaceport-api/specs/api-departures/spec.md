## ADDED Requirements

### Requirement: GET /api/departures returns departure list
`GET /api/departures` SHALL return a JSON array of all departures. Each departure SHALL include: `id`, `destination`, `departure_time`, `description`, available seat classes, and available seats count. Data SHALL be seeded from an embedded JSON file on first startup.

#### Scenario: Departure list is returned
- **WHEN** `GET /api/departures` is called
- **THEN** a 200 response with a JSON array of at least 4 departures (Mars, Titan, Europa, Moonbase Alpha) is returned

### Requirement: GET /api/departures/:id returns departure detail with pricing
`GET /api/departures/:id` SHALL return a single departure with full detail plus: pricing breakdown fetched from the pricing service (one price per seat class), and a recommendations array from the pricing service.

#### Scenario: Detail includes pricing from pricing service
- **WHEN** `GET /api/departures/1` is called
- **THEN** the response includes `pricing` with prices per seat class returned from the pricing service

#### Scenario: Pricing service unavailable returns degraded response
- **WHEN** the pricing service is unreachable
- **THEN** `GET /api/departures/:id` returns 503 with an error body and records an error span

### Requirement: POST /api/bookings creates a booking
`POST /api/bookings` SHALL accept a JSON body with `departure_id`, `passenger_name`, `seat_class`, `cryosleep_enabled`, `extra_baggage`. It SHALL call the pricing service to get the final price, persist the booking to SQLite, and return a 201 response with `booking_id`, `status: "confirmed"`, and `total_price`.

#### Scenario: Booking is created successfully
- **WHEN** a valid booking request is POST-ed
- **THEN** a 201 response is returned with a non-empty `booking_id`

#### Scenario: Booking is persisted across restarts
- **WHEN** a booking is created and the API is restarted
- **THEN** the booking is retrievable (visible in logs and future `/api/health` count)

### Requirement: GET /api/health returns service health
`GET /api/health` SHALL return 200 with `{"status": "ok", "bookings_count": <n>}` where `n` is the current number of bookings in SQLite.

#### Scenario: Health check returns ok
- **WHEN** `GET /api/health` is called on a running service
- **THEN** a 200 response with `"status": "ok"` is returned

### Requirement: SQLite database seeded from embedded JSON
On startup, the API SHALL create tables `departures` and `bookings` using `CREATE TABLE IF NOT EXISTS`. If the `departures` table is empty, it SHALL seed from embedded `data/departures.json`.

#### Scenario: Departures are available after fresh start
- **WHEN** the API starts with an empty SQLite database
- **THEN** `GET /api/departures` returns data without any manual seeding step

### Requirement: CORS allows frontend origin with traceparent
The API SHALL include a CORS middleware that allows requests from the configured frontend origin (default: `http://localhost:3000`) and explicitly includes `traceparent` and `tracestate` in `Access-Control-Allow-Headers`.

#### Scenario: Browser fetch with traceparent succeeds
- **WHEN** the frontend at `http://localhost:3000` sends a fetch with `traceparent` header
- **THEN** the request is not rejected by CORS and the header reaches the handler
