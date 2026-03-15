# Spaceport

A demo booking app for interplanetary travel — built to showcase OpenTelemetry instrumentation across a polyglot microservice stack.

```
  ┌──────────────────────────────────────────────────────────────┐
  │                        Browser                               │
  └─────────────────────────┬────────────────────────────────────┘
                            │ HTTP :3000
  ┌─────────────────────────▼────────────────────────────────────┐
  │                      frontend                                │
  │               React / Next.js  (spaceport-frontend)          │
  └─────────────────────────┬────────────────────────────────────┘
                            │ HTTP :8080
  ┌─────────────────────────▼────────────────────────────────────┐
  │                        api                                   │
  │               Go / Chi  (spaceport-api)                      │
  └──────────┬──────────────────────────────────────┬────────────┘
             │ HTTP :8000                            │ SQLite
  ┌──────────▼───────────────────┐     ┌────────────▼────────────┐
  │       pricing-service        │     │    /data/spaceport.db   │
  │  Python / FastAPI            │     └─────────────────────────┘
  │  (spaceport-pricing-service) │
  └──────────────────────────────┘
             │
             │  OTLP gRPC
  ┌──────────▼───────────────────┐
  │     OTel Collector           │
  │  (from observabilitystack)   │
  └──────────────────────────────┘
```

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Docker + Docker Compose | ≥ 26 | [docs.docker.com](https://docs.docker.com/get-docker/) |
| kubectl | ≥ 1.28 | [kubernetes.io](https://kubernetes.io/docs/tasks/tools/) |
| Helm | ≥ 3.14 | [helm.sh](https://helm.sh/docs/intro/install/) |
| Weaver CLI | ≥ 0.22 | `brew install weaver` or [GitHub releases](https://github.com/open-telemetry/weaver/releases) |

An OTel Collector must be reachable at the endpoint configured in `.env` (default: `http://otel-collector:4317`). The [observabilitystack](https://github.com/fiddeb/observabilitystack) repo provides one.

## Quickstart

```bash
# 1. Copy environment config
cp .env.example .env

# 2. Start all services
make dev
```

The frontend will be available at **http://localhost:3000**.

## Port Allocation

| Service         | Port |
|-----------------|------|
| Frontend        | 3000 |
| API             | 8080 |
| Pricing Service | 8000 |

These ports do not conflict with the observabilitystack defaults.

## Available Commands

```
make help       # List all targets
make dev        # docker-compose up --build (local dev)
make build      # docker-compose build
make deploy     # helm upgrade --install spaceport helm/spaceport/
make test       # Playwright smoke tests
make lint       # weaver registry check (semconv validation)
make link-chart # Symlink helm chart into observabilitystack umbrella
```

## Kubernetes Deployment

Spaceport integrates with the [observabilitystack](https://github.com/fiddeb/observabilitystack) umbrella Helm chart as a `file://` subchart. See [docs/helm-integration.md](docs/helm-integration.md) for setup instructions.

Quick deploy (standalone):

```bash
make deploy
```

## Semantic Conventions

Custom `spaceport.*` attributes are defined in the Weaver registry under `weaver/`. Validate with:

```bash
make lint
```

See [docs/service-names.md](docs/service-names.md) for service name constants.

## Demo Script

See [docs/demo-script.md](docs/demo-script.md) for a guided walkthrough of the demo.
