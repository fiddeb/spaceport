# demo-script Specification

## Purpose
TBD - created by archiving change demo-experience. Update Purpose after archive.
## Requirements
### Requirement: Demo script documents step-by-step walkthrough
`docs/demo-script.md` SHALL contain a numbered step-by-step walkthrough of a 10-15 minute live demo session. Each step SHALL specify: what to do in the browser, what Grafana dashboard to open, and what to say/highlight.

#### Scenario: Presenter can follow script without preparation
- **WHEN** a presenter reads the demo script before a session
- **THEN** they can execute the full demo sequence without referring to other documentation

### Requirement: Demo script covers all five demo scenarios
The demo script SHALL cover: (1) normal booking flow, (2) viewing distributed trace in Tempo, (3) log correlation in Loki, (4) error scenario with pricing service failure, (5) latency scenario with slow pricing service.

#### Scenario: All five scenarios are described
- **WHEN** the demo script is reviewed
- **THEN** sections for all five scenarios are present with specific Grafana navigation instructions

