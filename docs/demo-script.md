# Spaceport Demo Script

A step-by-step guide for demonstrating the Spaceport observability stack. Each step walks through a user action and the corresponding telemetry visible in Grafana.

## Prerequisites

| Component | How to start | URL |
|-----------|-------------|-----|
| Frontend | `cd frontend && npm run dev` | http://localhost:5173 |
| API | `cd api && go run .` | http://localhost:8080 |
| Pricing Service | `cd pricing-service && .venv/bin/uvicorn pricing_service.main:app --port 8000` | http://localhost:8000 |
| Grafana | Provided by observabilitystack | http://grafana.k8s.test |
| OTel Collector | Provided by observabilitystack | `otel-collector.k8s.test` |

> **Tip:** Set `OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.k8s.test` when starting the API to push telemetry to the cluster collector.

### Grafana Dashboards

| Dashboard | UID | URL |
|-----------|-----|-----|
| Spaceport Overview | `spaceport-overview` | http://grafana.k8s.test/d/spaceport-overview |
| Spaceport Traces | `spaceport-traces` | http://grafana.k8s.test/d/spaceport-traces |
| Spaceport Logs | `spaceport-logs` | http://grafana.k8s.test/d/spaceport-logs |

---

## Step 1 — Normal Booking Flow

**Goal:** Show a successful end-to-end booking and the resulting telemetry.

### In the browser

1. Open http://localhost:5173 — the Spaceport landing page loads.
2. Click **"Explore Departures"** to navigate to the departure list.
3. Pick any departure (e.g. **Mars**) and click **"View Details"**.
4. On the detail page, review the pricing section, then click **"Book Now"**.
5. Fill in the booking form:
   - **Passenger Name:** `Demo Presenter`
   - **Seat Class:** Economy Cryosleep
6. Click **"Confirm Booking"**.
7. The confirmation page shows the booking ID and total price.

### In Grafana

1. Open **Spaceport Overview** dashboard.
2. Point out the **Request Rate** panels — you should see a bump corresponding to the requests you just made (API row + Pricing Service row).
3. Use the `$service` dropdown to filter to `spaceport-api` and show the request details.
4. The **Error Rate** panel should remain at zero.

---

## Step 2 — View Distributed Trace

**Goal:** Walk through a full distributed trace from browser to API to pricing service.

### In Grafana

1. Open the **Spaceport Traces** dashboard.
2. In the **Booking Traces** panel, find the most recent trace (the booking you just made).
3. Click the trace ID to open it.
4. Walk through the spans:
   - **`user.place_booking`** — the browser-side span created when the user clicked "Confirm Booking"
   - **`POST /api/bookings`** — the API handler span
   - **`pricing.calculate`** — the pricing service span (child of the API span via W3C traceparent propagation)
5. Point out the span attributes:
   - `spaceport.departure.id`
   - `spaceport.seat.class`
   - `spaceport.booking.id` (added as a span event)

---

## Step 3 — Log Correlation

**Goal:** Show how logs link back to traces.

### In Grafana

1. Open the **Spaceport Logs** dashboard.
2. In the **All Spaceport Logs** panel, find the log line: `Booking created: <booking-id>`.
3. Expand the log line and look for the `trace_id` field.
4. Copy the trace ID and open **Grafana Explore** with the Tempo datasource.
5. Paste the trace ID to load the full trace — you're now looking at the same booking trace from Step 2, reached via the log.

> **Talking point:** This is the observability trifecta — metrics told us *something happened*, traces showed *how it happened*, and logs provide *context for why*.

---

## Step 4 — Error Scenario

**Goal:** Simulate pricing failures and observe them across all three signals.

### Activate failures

Run the following command to make the next 3 pricing requests fail:

```bash
curl -X POST http://localhost:8000/simulate-failure \
  -H "Content-Type: application/json" \
  -d '{"count": 3}'
```

### In the browser

1. Go to http://localhost:5173/departures and pick a departure.
2. Click **"Book Now"** and fill the form.
3. Click **"Confirm Booking"** — you should see an error in the UI.
4. Repeat 2 more times to use up the failure budget.

### In Grafana

1. **Spaceport Overview** → The **Error Rate** panel now shows a spike. Point out the increase on the pricing-service row.
2. **Spaceport Traces** → Open the **Error Traces** panel. The failed requests appear with `status = error`.
3. Click into an error trace and show:
   - The `pricing.calculate` span has a red error status
   - The error message is one of the fun failure reasons (e.g. "Solar storm disrupting navigation systems")
4. **Spaceport Logs** → Filter for error logs to see the corresponding log entries.

---

## Step 5 — Latency Scenario

**Goal:** Inject artificial latency and observe the P99 spike.

### Activate latency

Run the following command to add 2 seconds of latency to the next 5 pricing requests:

```bash
curl -X POST http://localhost:8000/simulate-latency \
  -H "Content-Type: application/json" \
  -d '{"count": 5, "latency_ms": 2000}'
```

### In the browser

1. Navigate through several departures (each page load calls the pricing service).
2. Notice the page loads are visibly slower.

### In Grafana

1. **Spaceport Overview** → Look at the **P99 Latency** panel for `spaceport-pricing-service`. It should spike to ~2 seconds.
2. **Spaceport Traces** → Open a recent trace from the **Recent Traces** panel.
3. In the trace waterfall, find the `pricing.calculate` span — it now shows a duration of ~2 seconds.
4. Compare it to earlier traces where the same span completed in milliseconds.

> **Talking point:** Without distributed tracing, the API team would see slow response times but wouldn't know *which downstream call* was the bottleneck. The trace pinpoints it immediately.

---

## Wrap-Up

Summarize the three pillars demonstrated:

| Signal | Dashboard | What it showed |
|--------|-----------|----------------|
| **Metrics** | Spaceport Overview | Request rate, error rate, and latency aggregates |
| **Traces** | Spaceport Traces | Full request path from browser → API → pricing |
| **Logs** | Spaceport Logs | Contextual log entries linked to traces via `trace_id` |

All telemetry is generated automatically by OpenTelemetry instrumentation — no manual logging of request IDs or custom correlation headers needed.
