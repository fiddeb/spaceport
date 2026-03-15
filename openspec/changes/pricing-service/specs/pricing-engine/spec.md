## ADDED Requirements

### Requirement: GET /price/{departure_id} returns price per seat class
`GET /price/{departure_id}` SHALL return a JSON object with prices for each available seat class (`economy-cryosleep`, `business-warp`, `first-class-nebula`). Each price entry SHALL include `seat_class`, `base_price`, `total_price`, `promo_applied`, `currency`.

#### Scenario: Price is returned for a known departure
- **WHEN** `GET /price/1` is called
- **THEN** a 200 response is returned with prices for all three seat classes in USD

#### Scenario: Promo is sometimes applied
- **WHEN** multiple calls to `GET /price/1` are made
- **THEN** at least some responses have `promo_applied: true` with a lower `total_price` than `base_price`

### Requirement: GET /recommendations/{departure_id} returns related departures
`GET /recommendations/{departure_id}` SHALL return a JSON array of 2-3 recommended departure IDs with destination names. Recommendations SHALL not include the input departure itself.

#### Scenario: Recommendations exclude the current departure
- **WHEN** `GET /recommendations/1` is called
- **THEN** the response does not include departure ID 1

### Requirement: POST /simulate-failure toggles failure injection
`POST /simulate-failure` with body `{"count": n}` SHALL configure the service to return HTTP 500 on the next `n` pricing or recommendation requests. `count: 0` SHALL disable failure injection.

#### Scenario: Service returns 500 after simulate-failure is activated
- **WHEN** `POST /simulate-failure {"count": 3}` is called, then `GET /price/1` is called
- **THEN** `GET /price/1` returns HTTP 500 with a themed error message (e.g., "Solar storm disrupting navigation systems")

#### Scenario: Normal operation resumes after count is exhausted
- **WHEN** `n` failure requests have been served
- **THEN** the next request returns a normal 200 response

### Requirement: POST /simulate-latency toggles latency injection
`POST /simulate-latency` with body `{"count": n, "latency_ms": m}` SHALL add `m` milliseconds (in addition to baseline) of delay to the next `n` pricing or recommendation requests. `count: 0` SHALL disable latency injection.

#### Scenario: Pricing request takes specified extra latency
- **WHEN** `/simulate-latency {"count": 5, "latency_ms": 2000}` is activated and `GET /price/1` is called
- **THEN** the response takes at least 2000ms

### Requirement: GET /health returns ok
`GET /health` SHALL return `{"status": "ok"}` with HTTP 200.

#### Scenario: Health check returns ok
- **WHEN** `GET /health` is called on a running service
- **THEN** a 200 response with `{"status": "ok"}` is returned
