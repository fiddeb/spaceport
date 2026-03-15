## ADDED Requirements

### Requirement: Simulate-failure endpoint controls failure injection
`POST /simulate-failure` SHALL accept `{"count": int}` and set a module-level counter. While `count > 0`, each pricing or recommendation request SHALL return HTTP 500 and decrement the counter.

#### Scenario: Failure injection activates
- **WHEN** `POST /simulate-failure {"count": 1}` is called and then `GET /price/1` is called
- **THEN** `GET /price/1` returns HTTP 500

#### Scenario: Failure injection deactivates after count
- **WHEN** the failure counter reaches 0
- **THEN** subsequent requests return normal responses

### Requirement: Simulate-latency endpoint controls latency injection
`POST /simulate-latency` SHALL accept `{"count": int, "latency_ms": int}` and inject `latency_ms` additional delay to the next `count` requests.

#### Scenario: Latency injection adds delay
- **WHEN** `/simulate-latency {"count": 1, "latency_ms": 1500}` is called and `GET /price/1` is called
- **THEN** the response takes at least 1500ms

### Requirement: Baseline latency variance
All pricing and recommendation handlers SHALL include a random delay of 50-150ms (`asyncio.sleep(random.uniform(0.05, 0.15))`) to simulate real service latency.

#### Scenario: Requests never complete in under 50ms
- **WHEN** `GET /price/1` is called without chaos injection
- **THEN** the response time is at least 50ms
