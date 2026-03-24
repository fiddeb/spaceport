# playwright-smoke-tests Specification

## Purpose
TBD - created by archiving change demo-experience. Update Purpose after archive.
## Requirements
### Requirement: Playwright smoke test suite covers happy path
The `tests/playwright/` directory SHALL contain tests for: browse departures, view departure detail, place booking, and confirm booking. All tests SHALL pass against a running local stack.

#### Scenario: Full booking flow completes without error
- **WHEN** Playwright runs `place-booking.spec.ts`
- **THEN** the test navigates from home → departure detail → booking form → confirmation page without encountering errors

### Requirement: Error scenario test
A Playwright test `error-scenario.spec.ts` SHALL: activate `POST /simulate-failure {"count": 1}`, attempt a booking, and assert that the frontend shows an error message.

#### Scenario: Error scenario test passes
- **WHEN** `error-scenario.spec.ts` runs
- **THEN** the test activates failure injection, submits the booking form, and the frontend renders an error state

### Requirement: Latency scenario test
A Playwright test `latency-scenario.spec.ts` SHALL: activate `POST /simulate-latency {"count": 1, "latency_ms": 2000}`, trigger a departure detail fetch, and assert that the response time exceeds 1500ms.

#### Scenario: Latency scenario test passes
- **WHEN** `latency-scenario.spec.ts` runs
- **THEN** the test records that the departure detail request took longer than 1500ms

### Requirement: Tests are runnable via make test
`make test` SHALL run the full Playwright suite against the stack started by `make dev`.

#### Scenario: make test runs all specs
- **WHEN** `make test` is run with the stack up
- **THEN** all Playwright specs complete with no failures in the happy-path tests

