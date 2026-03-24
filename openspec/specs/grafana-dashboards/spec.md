# grafana-dashboards Specification

## Purpose
TBD - created by archiving change demo-experience. Update Purpose after archive.
## Requirements
### Requirement: Spaceport Overview dashboard
A Grafana dashboard named "Spaceport Overview" SHALL be provided as a provisioned JSON file. It SHALL contain panels for each service (`spaceport-frontend`, `spaceport-api`, `spaceport-pricing-service`) covering: request rate (req/s), error rate (%), P50 and P99 latency. The dashboard SHALL have a `$service` template variable for filtering.

#### Scenario: Dashboard loads with data after normal usage
- **WHEN** the spaceport stack has been running and a booking has been placed
- **THEN** the Spaceport Overview dashboard shows non-zero request rate and latency for `spaceport-api`

#### Scenario: Error rate panel spikes after simulate-failure
- **WHEN** `POST /simulate-failure {"count": 5}` is called and 5 booking attempts are made
- **THEN** the error rate panel for `spaceport-pricing-service` shows a visible spike

### Requirement: Distributed Traces dashboard
A Grafana dashboard named "Spaceport Traces" SHALL be provided with a Tempo datasource, showing: a trace list filtered to `service.name =~ "spaceport.*"`, and a pre-built trace search panel for `spaceport.booking.id`.

#### Scenario: Booking trace is findable
- **WHEN** a booking has been placed
- **THEN** the Spaceport Traces dashboard shows a trace containing spans from all three services under the same trace_id

### Requirement: Log Correlation dashboard
A Grafana dashboard named "Spaceport Logs" SHALL be provided with a Loki datasource, showing: a log stream panel filtered by `{service_name=~"spaceport.*"}`, with a derived field linking `trace_id` values in log lines to Tempo.

#### Scenario: Log line links to trace
- **WHEN** a log line containing `trace_id` is visible in the Spaceport Logs dashboard
- **THEN** clicking the trace_id navigates to the corresponding trace in Tempo

### Requirement: Dashboards provisioned via Helm
Dashboard JSON files SHALL be stored in `helm/spaceport/dashboards/` and mounted into Grafana via a Kubernetes ConfigMap created by the Helm chart. The target Grafana provisioning folder SHALL be configurable via `values.yaml`.

#### Scenario: Dashboards appear after helm install
- **WHEN** `helm upgrade --install spaceport helm/spaceport/` is run
- **THEN** the three dashboards appear in Grafana without manual import

