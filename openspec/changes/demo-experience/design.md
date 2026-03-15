## Context

The three services generate telemetry, but without pre-built dashboards, documented scenarios, and automated smoke tests the demo requires significant manual setup on the day. This change makes the demo repeatable, self-contained, and compelling. It is the difference between "we have metrics" and "look at this dashboard and watch what happens when I click this button".

## Goals / Non-Goals

**Goals:**
- Pre-provisioned Grafana dashboard JSON files ready to import (or provision via ConfigMap)
- Playwright smoke test suite covering the full booking flow and demo scenarios
- Step-by-step demo script for live presentations
- Dashboard panels tightly coupled to the metric names, service names, and log labels defined in other changes

**Non-Goals:**
- Custom Grafana plugins
- Alerting rules or SLOs
- K6 as the primary test tool — it's a bonus
- CI/CD integration for Playwright

## Decisions

### 1. Grafana dashboards as provisioned JSON via Helm ConfigMap

**Decision**: Dashboard JSON files live in `helm/spaceport/dashboards/`. The Helm chart mounts them into Grafana's provisioning directory via a ConfigMap, so dashboards appear automatically when the chart is deployed.

**Rationale**: Importing dashboards manually on demo day is friction. With provisioning via the Helm chart, dashboards are always present when spaceport is deployed. The observabilitystack's Grafana instance supports dashboard provisioning via folder.

**Dashboard list**:
1. **Spaceport Overview** — RED metrics (request rate, error rate, latency P50/P99) for all three services via Prometheus/Mimir
2. **Distributed Traces** — Tempo datasource with pre-built queries and trace list panels for the booking flow
3. **Log Correlation** — Loki datasource, log stream filtered by `service_name`, with derived field linking `trace_id` to Tempo

### 2. Playwright as the primary automated test tool

**Decision**: Playwright test suite in `tests/playwright/` using TypeScript. Tests run against `http://localhost:3000` (or configurable base URL).

**Rationale**: Playwright generates realistic browser-level telemetry because it drives a real browser. This is qualitatively better for a trace demo than HTTP-level tools: you get page load spans, click events, and fetch spans in the same trace — the exact thing the demo is trying to show.

**Test scenarios**:
1. `browse-departures.spec.ts` — loads home page, checks departure list renders
2. `view-departure.spec.ts` — clicks a departure, checks pricing loads
3. `place-booking.spec.ts` — fills booking form, submits, checks confirmation
4. `error-scenario.spec.ts` — activates simulate-failure, attempts booking, checks error UI
5. `latency-scenario.spec.ts` — activates simulate-latency, observes slow response in trace

### 3. Demo script as a structured Markdown document

**Decision**: `docs/demo-script.md` structured as a sequence of steps with: what to do in the browser, what to look at in Grafana after, and what metrics/traces/logs to highlight.

**Rationale**: Presenters need a script they can follow without thinking during a live demo. The script must reference exact dashboard panel names and Grafana URLs relative to the setup.

### 4. Grafana dashboard variable for service.name

**Decision**: Each dashboard uses a Grafana template variable `$service` with values `spaceport-frontend`, `spaceport-api`, `spaceport-pricing-service` so presenters can quickly filter dashboards per service.

**Rationale**: Being able to say "now let's look at just the pricing service" and clicking a dropdown is far more engaging than hardcoded queries.

## Risks / Trade-offs

- **Dashboard JSON tightly coupled to metric names** → If metric names change in other services, dashboards break silently. Mitigation: Dashboard names are derived directly from the Weaver registry attribute and metric names — treat metric name changes as breaking changes per the Weaver registry contract.
- **Playwright requires frontend to be running** → Tests fail if the stack is not up. Mitigation: `make test` target depends on `make dev`, or CI can use `wait-on` before running Playwright.
- **Grafana provisioning folder varies between Grafana setups** → The observabilitystack's Grafana instance may use a different provisioning path. Mitigation: Document the provisioning folder path and make it configurable via Helm value.

## Open Questions

- Should the Spaceport Overview dashboard be a row-per-service layout or a panel-per-service layout? → Row-per-service — makes it easier to navigate during a live demo.
