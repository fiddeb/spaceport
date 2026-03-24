# k6-load-tests Specification

## Purpose
TBD - created by archiving change demo-experience. Update Purpose after archive.
## Requirements
### Requirement: K6 script for bulk traffic generation
An optional K6 script at `tests/k6/booking-flow.js` SHALL simulate the booking flow at configurable VU count and duration. The script SHALL be runnable with `k6 run tests/k6/booking-flow.js`.

#### Scenario: K6 script generates traffic
- **WHEN** `k6 run tests/k6/booking-flow.js --vus 5 --duration 30s` is run with the stack up
- **THEN** the Spaceport Overview dashboard shows increased request rate for the duration of the run

