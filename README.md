<div align="center">

# Spaceport

**Book your seat to Mars. Trace every millisecond of the journey.**

<img src="docs/img/hero.png" alt="Spaceport — interplanetary departures" width="720" />

<br />

A microservice demo for interplanetary travel bookings — three services, three languages, one unified trace from the browser to the database and back.

Built to show what observability-first development actually looks like.

</div>

---

## The story

It's 2387. Passengers book flights to the Moonbase, Mars, Titan, and Europa — picking seat classes from Economy Cryosleep to First-Class Escape Pod, comparing prices across currencies. Solar storms knock out the pricing engine. Docking gate captains get lost in time anomalies. The system handles all of it, and every request leaves a trace you can follow end to end.

## What makes it interesting

**Three services, three languages, full observability.** A React frontend, a Go API, and a Python pricing service — all instrumented with OpenTelemetry. Traces, metrics, and logs flow from every service, correlated automatically and enriched with domain-specific attributes like `spaceport.departure.id` and `spaceport.seat.class`.

**Observability by design.** Custom `spaceport.*` attributes aren't ad-hoc strings — they're defined in a Weaver schema registry (`semconv/`), validated against OTel semconv v1.34.0, and code-generated into Go structs. Telemetry is part of the architecture, not bolted on after.

**Chaos you can trigger on demand.** The pricing service exposes endpoints to inject failures and latency into the next N requests. Fire a few, then watch the dashboards light up. Great for demos, better for learning how distributed systems fail.

**Actually deployable.** Docker Compose for local dev, Helm charts for Kubernetes, Playwright tests for CI. Not a toy — a reference implementation you can point at a real collector.

## Architecture

```
  Browser
    │
    │ :3000
    ▼
  frontend ·············· React + TypeScript + Vite
    │
    │ :8080  (W3C traceparent)
    ▼
  api ···················· Go + Gin + SQLite
    │
    │ :8000
    ▼
  pricing-service ······· Python + FastAPI
    │
    │ OTLP gRPC
    ▼
  otel-collector ········ from observabilitystack
```

All three services emit traces, metrics, and logs via OTLP. The [observabilitystack](https://github.com/fiddeb/observabilitystack) repo provides the collector, Grafana, and pre-built dashboards for Spaceport.

## Quickstart

Requires Go, Python, and Node installed locally. Starts all three services as native processes — no Docker needed.

```bash
cp .env.example .env  # set OTEL_EXPORTER_OTLP_ENDPOINT and ports
make dev              # starts frontend :5175, API :8080, pricing :8000
```

Open **http://localhost:5175** — browse departures, book a flight, break the pricing service, and watch the telemetry flow.

Telemetry is exported to the endpoint in `.env` (default: `http://otel-collector.k8s.test:4317`). The [observabilitystack](https://github.com/fiddeb/observabilitystack) repo provides a collector ready to receive it.

## Commands

| Command | What it does |
|---------|-------------|
| `make dev` | Start all services (Docker Compose) |
| `make build` | Build container images |
| `make deploy` | Helm install to Kubernetes |
| `make test` | Playwright smoke tests |
| `make lint` | Validate semantic conventions (Weaver) |
| `make generate` | Code-gen Go types from semconv registry |
| `make load-test` | k6 load test |

## Ports

| Service | Port |
|---------|------|
| Frontend | 5175 |
| API | 8080 |
| Pricing Service | 8000 |

No conflicts with observabilitystack defaults.

## Prerequisites

| Tool | Version |
|------|---------|
| Docker + Compose | ≥ 26 |
| kubectl | ≥ 1.28 |
| Helm | ≥ 3.14 |
| Weaver CLI | ≥ 0.22 |

An OTel Collector must be reachable at the endpoint in `.env` (default `http://otel-collector:4317`). The [observabilitystack](https://github.com/fiddeb/observabilitystack) repo provides one ready to go.

## Kubernetes

Spaceport plugs into the [observabilitystack](https://github.com/fiddeb/observabilitystack) umbrella Helm chart as an OCI subchart (`oci://ghcr.io/fiddeb/charts`). See [docs/helm-integration.md](docs/helm-integration.md) for details, or deploy standalone:

```bash
make deploy
```

## Docs

- [Demo script](docs/demo-script.md) — guided walkthrough with chaos scenarios
- [Helm integration](docs/helm-integration.md) — Kubernetes setup
- [Service names](docs/service-names.md) — OTel service name constants
