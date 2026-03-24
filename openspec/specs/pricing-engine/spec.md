# pricing-engine Specification

## Purpose
TBD - created by archiving change pricing-service. Update Purpose after archive.
## Requirements
### Requirement: GET /price/{departure_id} returns price per seat class
`GET /price/{departure_id}` SHALL return a JSON object with prices for each available seat class (`economy-cryosleep`, `business-warp`, `first-class-nebula`). Each price entry SHALL include `seat_class`, `base_price`, `total_price`, `promo_applied`, `currency`.

#### Scenario: Price is returned for a known departure
- **WHEN** `GET /price/1` is called
- **THEN** a 200 response is returned with prices for all three seat classes in UNC (base currency)

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

### Requirement: GET /currencies returns the currency catalog
`GET /currencies` SHALL return the full currency catalog as a JSON object with an array of currency entries. Each entry SHALL include: `code` (string), `name` (string), `rate` (number, UNC-relative exchange rate). The catalog SHALL include all 8 currencies: UNC (1.0), REP (1.25), LAT (4.0), QUA (0.2), NIN (0.05), BZD (0.5), COIN (0.8), TKN (0.1).

#### Scenario: Currency catalog is returned
- **WHEN** `GET /currencies` is called
- **THEN** a 200 response is returned with a JSON array containing 8 currency entries, each with `code`, `name`, and `rate`

### Requirement: GET /price/{departure_id} accepts optional currency query param
`GET /price/{departure_id}` SHALL accept an optional `?currency=CODE` query parameter. When provided, `total_price` in each response entry SHALL be the UNC price multiplied by the exchange rate for `CODE`, and the `currency` field SHALL reflect `CODE`. When omitted, prices are returned in UNC.

#### Scenario: Price converted to REP on request
- **WHEN** `GET /price/1?currency=REP` is called
- **THEN** the `total_price` values are 1.25x the UNC amounts and `currency` is `"REP"` in each entry

### Requirement: GET /health returns ok
`GET /health` SHALL return `{"status": "ok"}` with HTTP 200.

#### Scenario: Health check returns ok
- **WHEN** `GET /health` is called on a running service
- **THEN** a 200 response with `{"status": "ok"}` is returned

