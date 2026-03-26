---
hide:
  - navigation
  - toc
---

# Spaceport

<div class="hero" markdown>

**Book your seat to Mars. Trace every millisecond of the journey.**

![Spaceport — interplanetary departures](img/hero.png){ .hero-image width="720" }

A microservice demo for interplanetary travel bookings — three services, three languages, one unified trace from the browser to the database and back. Built to show what observability-first development actually looks like.

</div>

---

## The story

It's 2384. Passengers book flights to the Moonbase, Mars, Titan, and Europa — picking seat classes from Economy Cryosleep to First-Class Escape Pod, comparing prices across currencies. Solar storms knock out the pricing engine. Docking gate captains get lost in time anomalies. The system handles all of it, and every request leaves a trace you can follow end to end.

## What makes it interesting

<div class="grid cards" markdown>

-   :material-transit-connection-variant:{ .lg .middle } **Three services, full observability**

    ---

    A React frontend, a Go API, and a Python pricing service — all instrumented with OpenTelemetry. Traces, metrics, and logs flow from every service, correlated automatically.

-   :material-code-tags:{ .lg .middle } **Observability by design**

    ---

    Custom `spaceport.*` attributes are defined in a Weaver schema registry, validated against OTel semconv, and code-generated into Go structs and Python constants.

-   :material-lightning-bolt:{ .lg .middle } **Chaos on demand**

    ---

    Inject failures and latency into the pricing service, then watch dashboards light up. Great for demos, better for learning how distributed systems fail.

-   :material-kubernetes:{ .lg .middle } **Actually deployable**

    ---

    Docker Compose for local dev, Helm charts for Kubernetes, Playwright tests for CI. A reference implementation you can point at a real collector.

</div>

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

All three services emit traces, metrics, and logs via OTLP. The [observabilitystack](https://github.com/fiddeb/observabilitystack) repo provides the collector, Grafana, and pre-built dashboards.

## Quick links

| | |
|---|---|
| [Getting Started](getting-started/quickstart.md) | Set up and run the full stack locally |
| [Architecture](getting-started/architecture.md) | Service design and telemetry flow |
| [Semantic Conventions](semconv/README.md) | The `spaceport.*` attribute registry |
| [Demo Script](presentation/demo-script.md) | Step-by-step presentation guide |
| [Tutorials](tutorials/index.md) | Learn Weaver, semconv, and OTel patterns |
