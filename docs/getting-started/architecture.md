# Architecture

Spaceport is a microservice demo for interplanetary travel bookings — three services, three languages, one unified trace.

## Service map

```
  Browser
    │
    │ :3000 / :5175 (dev)
    ▼
  frontend ·············· React + TypeScript + Vite
    │                     OTel Browser SDK
    │ :8080  (W3C traceparent)
    ▼
  api ···················· Go + Gin + SQLite
    │                     OTel Go SDK + otelsql
    │ :8000
    ▼
  pricing-service ······· Python + FastAPI
    │                     OTel Python SDK
    │ OTLP gRPC
    ▼
  otel-collector ········ from observabilitystack
    │
    ├─► Tempo        (traces)
    ├─► Prometheus   (metrics)
    └─► Loki         (logs)
         │
         ▼
       Grafana       (dashboards)
```

## Services

| Service | Language | Framework | OTel integration | Key files |
|---------|----------|-----------|------------------|-----------|
| **frontend** | TypeScript | React + Vite | Browser SDK, auto-instrumentation | `src/instrumentation.ts`, `src/pages/` |
| **api** | Go | Gin | otelgin middleware, otelsql, manual spans | `main.go`, `internal/handler/`, `internal/db/` |
| **pricing-service** | Python | FastAPI | opentelemetry-instrumentation-fastapi, manual spans | `pricing_service/main.py`, `pricing.py`, `telemetry.py` |

## Telemetry flow

All three services export **traces**, **metrics**, and **logs** via OTLP to the OpenTelemetry Collector provided by the [observabilitystack](https://github.com/fiddeb/observabilitystack).

### Trace propagation

1. **Browser** starts a trace span for each user interaction
2. The frontend injects `traceparent` headers on API calls
3. **API** picks up the context, creates child spans for handler logic and DB queries
4. API calls to **pricing-service** carry the same trace context
5. All spans arrive at the collector and flow into Tempo

### Semantic conventions

Custom `spaceport.*` attributes are not hardcoded strings — they're defined in a [Weaver registry](../semconv/README.md) (`semconv/models/`) and code-generated into typed constants for each language. This guarantees consistency across all three services.

## Chaos injection

The pricing service exposes endpoints to inject failures and artificial latency:

- Inject errors into the next N pricing requests
- Add configurable latency to simulate solar storm interference
- Watch the impact propagate through distributed traces and dashboards

## Deployment models

| Mode | How | When to use |
|------|-----|-------------|
| **Local dev** | `make dev` — native processes | Day-to-day development |
| **Docker Compose** | `docker compose up` | Full stack with collector |
| **Kubernetes** | Helm chart via observabilitystack umbrella | Production-like, demos |
