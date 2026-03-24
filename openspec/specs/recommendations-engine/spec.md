# recommendations-engine Specification

## Purpose
TBD - created by archiving change pricing-service. Update Purpose after archive.
## Requirements
### Requirement: Recommendations engine returns related departures
`GET /recommendations/{departure_id}` SHALL return 2-3 departure recommendations from the static destination list. Selection logic SHALL be deterministic enough to be testable (e.g., exclude self, return adjacent entries). Response structure: `[{"departure_id": int, "destination": str, "reason": str}]`.

#### Scenario: Recommendation reason is present
- **WHEN** `GET /recommendations/1` is called
- **THEN** each recommendation includes a `reason` string with spaceport-themed copy (e.g., "If you enjoyed Europa's ice oceans, you'll love Titan's methane lakes")

#### Scenario: Excludes the requested departure
- **WHEN** `GET /recommendations/2` is called
- **THEN** none of the returned recommendations have `departure_id: 2`

