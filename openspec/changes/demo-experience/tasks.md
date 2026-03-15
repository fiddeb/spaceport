## 1. Grafana Dashboard JSON Files

- [ ] 1.1 Create `helm/spaceport/dashboards/` directory
- [ ] 1.2 Build `spaceport-overview.json`: row per service, panels — request rate (`rate(http_server_duration_count[1m])`), error rate, P50/P99 latency histogram from Prometheus/Mimir. Dashboard UID: `spaceport-overview`
- [ ] 1.3 Add `$service` template variable to spaceport-overview dashboard with values `spaceport-api`, `spaceport-pricing-service`, `spaceport-frontend`
- [ ] 1.4 Build `spaceport-traces.json`: Tempo datasource, trace list panel filtered to `{ .service.name =~ "spaceport.*" }`, search panel for `{ .spaceport.booking.id != "" }`. Dashboard UID: `spaceport-traces`
- [ ] 1.5 Build `spaceport-logs.json`: Loki datasource, log stream panel `{service_name=~"spaceport.*"}`, derived field linking `trace_id` pattern to Tempo explore URL. Dashboard UID: `spaceport-logs`
- [ ] 1.6 Validate all three JSON files load in Grafana without errors

## 2. Helm Provisioning for Dashboards

- [ ] 2.1 Create `helm/spaceport/templates/grafana-dashboards-configmap.yaml` that creates a ConfigMap with each dashboard JSON as a key
- [ ] 2.2 Add Helm values: `grafana.provisioning.folder` (default: `/etc/grafana/provisioning/dashboards/spaceport`) and `grafana.provisioning.enabled` (default: `true`)
- [ ] 2.3 Add a `GrafanaDashboard` CRD resource OR a ConfigMap with label `grafana_dashboard: "1"` matching the observabilitystack's sidecar configuration — confirm which label the observabilitystack Grafana sidecar watches

## 3. Playwright Setup

- [ ] 3.1 Create `tests/playwright/` directory and run `npm init playwright@latest` with TypeScript config
- [ ] 3.2 Configure `playwright.config.ts`: `baseURL` from `PLAYWRIGHT_BASE_URL` (default `http://localhost:3000`), Chromium only, 10s timeout, 1 retry
- [ ] 3.3 Add `PRICING_SERVICE_URL` env var (default `http://localhost:8000`) for chaos activation in tests

## 4. Playwright Test Specs

- [ ] 4.1 Write `browse-departures.spec.ts`: navigate to `/`, assert at least one departure card is visible, assert "Mars" appears in the list
- [ ] 4.2 Write `view-departure.spec.ts`: navigate to `/departures/1`, assert pricing section is visible, assert at least one price value is rendered
- [ ] 4.3 Write `place-booking.spec.ts`: navigate to `/book/1`, fill passenger name, select seat class, click confirm, assert confirmation page with booking ID
- [ ] 4.4 Write `error-scenario.spec.ts`: POST to `${PRICING_SERVICE_URL}/simulate-failure {"count": 1}`, submit booking form, assert error message is displayed in the UI
- [ ] 4.5 Write `latency-scenario.spec.ts`: POST to `${PRICING_SERVICE_URL}/simulate-latency {"count": 1, "latency_ms": 2000}`, navigate to departure detail, assert page load took > 1500ms using `page.waitForResponse` with timing

## 5. Demo Script

- [ ] 5.1 Create `docs/demo-script.md` with preamble: prerequisites, how to start the stack, Grafana URL
- [ ] 5.2 Write **Step 1 — Normal booking flow**: click through home → departure → book → confirm, then open Spaceport Overview and show request rate
- [ ] 5.3 Write **Step 2 — View distributed trace**: open Spaceport Traces dashboard, find the booking trace, walk through frontend → API → pricing spans
- [ ] 5.4 Write **Step 3 — Log correlation**: open Spaceport Logs, find log line with trace_id, click to navigate to Tempo trace
- [ ] 5.5 Write **Step 4 — Error scenario**: call `POST /simulate-failure {"count": 3}`, attempt 3 bookings, show error rate spike in dashboard, find error spans in Tempo
- [ ] 5.6 Write **Step 5 — Latency scenario**: call `POST /simulate-latency {"count": 5, "latency_ms": 2000}`, show P99 latency spike on dashboard, find slow `pricing.calculate` span in Tempo

## 6. K6 Bonus Script

- [ ] 6.1 Create `tests/k6/booking-flow.js` that executes: GET /api/departures → GET /api/departures/1 → POST /api/bookings with a valid payload
- [ ] 6.2 Set default VUs = 3, duration = 1 minute and add thresholds: `http_req_failed < 0.1`, `http_req_duration{p95} < 1000`
- [ ] 6.3 Add `k6` target to root Makefile: `make load-test`
