# Quickstart

Get all three services running locally and sending telemetry.

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Go | ≥ 1.22 | API service |
| Python | ≥ 3.11 | Pricing service |
| Node.js | ≥ 20 | Frontend |
| Docker + Compose | ≥ 26 | Container workflows |
| Weaver CLI | ≥ 0.22 | Semconv validation and code generation |

An OTel Collector must be reachable for telemetry export. The [observabilitystack](https://github.com/fiddeb/observabilitystack) provides one at `otel-collector.k8s.test`.

## Setup

```bash
# Clone the repo
git clone https://github.com/fiddeb/spaceport.git
cd spaceport

# Copy environment config
cp .env.example .env
```

Edit `.env` to set `OTEL_EXPORTER_OTLP_ENDPOINT` (default: `http://otel-collector.k8s.test:4317`).

## Run

```bash
make dev
```

This starts:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5175 |
| API | http://localhost:8080 |
| Pricing Service | http://localhost:8000 |

Open **http://localhost:5175** — browse departures, book a flight, break the pricing service, and watch the telemetry flow in Grafana.

## Useful commands

| Command | What it does |
|---------|-------------|
| `make dev` | Start all services |
| `make build` | Build container images |
| `make deploy` | Helm install to Kubernetes |
| `make test` | Playwright smoke tests |
| `make lint` | Validate semantic conventions (Weaver) |
| `make generate` | Code-gen from semconv registry |
| `make load-test` | k6 load test |

!!! note
    `make test` expects the app to already be running and defaults `PLAYWRIGHT_BASE_URL` to `http://localhost:5175`.

## Grafana dashboards

With the observabilitystack running, these dashboards are available:

| Dashboard | URL |
|-----------|-----|
| Spaceport Overview | http://grafana.k8s.test/d/spaceport-overview |
| Spaceport Traces | http://grafana.k8s.test/d/spaceport-traces |
| Spaceport Logs | http://grafana.k8s.test/d/spaceport-logs |

## Next steps

- [Architecture](architecture.md) — understand the service design
- [Demo Script](../presentation/demo-script.md) — run through a guided demo
- [Semantic Conventions](../semconv/README.md) — explore the attribute registry
