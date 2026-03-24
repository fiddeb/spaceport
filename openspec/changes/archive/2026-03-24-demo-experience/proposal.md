## Why

Having three instrumented services is necessary but not sufficient — the demo needs a curated experience that shows *why* observability matters. Pre-built Grafana dashboards, automated smoke tests, and documented demo scenarios turn a collection of services into a compelling, repeatable demonstration. Without these, every demo requires manual setup of dashboards and improvised clicking.

## What Changes

- Create pre-provisioned Grafana dashboards (JSON):
  - **Spaceport Overview**: Request rate, error rate, and latency (RED metrics) across all three services
  - **Distributed Traces**: Example trace queries for Tempo, pre-linked from dashboard panels
  - **Log Correlation**: Loki queries filtered by `trace_id`, showing correlated logs across services
- Create Playwright smoke test suite in `tests/`:
  - "Browse departures" — load homepage, verify destination list renders
  - "View departure detail" — click a departure, verify pricing and recommendations load
  - "Place booking" — fill booking form, submit, verify confirmation
  - "Trigger error scenario" — activate simulate-failure, attempt booking, verify error handling
  - "Trigger latency scenario" — activate simulate-latency, observe slow response
- Create a documented demo script (`docs/demo-script.md`) with step-by-step walkthrough:
  - What to click in the app
  - What to look at in Grafana after each step
  - How to trigger and observe error/latency scenarios
- Add optional K6 load test script for generating bulk traffic data
- Add demo scenario controller: a simple frontend panel or API endpoint to trigger/reset chaos scenarios

## Non-goals

- No CI integration for Playwright — local execution only
- No alerting rules — dashboards only
- No SLO/SLI definitions
- No custom Grafana plugins
- K6 is a bonus, not a requirement — Playwright is the primary test tool

## Capabilities

### New Capabilities
- `grafana-dashboards`: Pre-provisioned Grafana dashboard JSON files for RED metrics, trace exploration, and log correlation
- `playwright-smoke-tests`: Automated browser smoke tests covering the full booking flow and error/latency scenarios
- `demo-script`: Step-by-step documentation for running a compelling observability demo
- `k6-load-tests`: Optional K6 scripts for generating bulk traffic (bonus, not required)

### Modified Capabilities
<!-- No existing capabilities to modify -->

## Impact

- Depends on all three services being deployed and instrumented
- Dashboards depend on specific metric names, log labels, and trace service names from the other changes
- Playwright requires the frontend to be accessible at a known URL
- Dashboard JSON files need to be importable into Grafana (via provisioning or manual import)
- The demo script references specific Grafana dashboard URLs and panel names
