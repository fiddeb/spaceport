## Context

The Python FastAPI pricing service exists to demonstrate cross-language distributed tracing and to provide controllable chaos scenarios for the demo. It is intentionally the "interesting" service — it introduces realistic latency variation, can be made to fail on demand, and produces richly annotated spans with domain-specific attributes. Being Python makes it the most readable service in the codebase during a live demo.

## Goals / Non-Goals

**Goals:**
- Python + FastAPI service with pricing, recommendations, and chaos endpoints
- OTel Python SDK with FastAPI auto-instrumentation and manual spans with `spaceport.*` attributes
- Controllable failure and latency injection via toggle endpoints
- Structured logging with trace correlation (trace_id, span_id in every log line)

**Non-Goals:**
- Real pricing algorithm — formula is intentionally simple and humorous
- External database or cache
- Authentication
- gRPC — HTTP/JSON only
- Async background tasks

## Decisions

### 1. FastAPI with opentelemetry-instrumentation-fastapi

**Decision**: Use `fastapi` with `opentelemetry-instrumentation-fastapi` auto-instrumentation. Initialize the OTel SDK in `main.py` before the FastAPI app is created using `FastAPIInstrumentor().instrument_app(app)`.

**Rationale**: FastAPI auto-instrumentation creates server spans for every request with standard `http.*` attributes and extracts W3C `traceparent` from incoming headers. Zero per-endpoint instrumentation code is needed for the basic traces. The Go API's `otelhttp.NewTransport` injects `traceparent`, which FastAPI instrumentation picks up automatically.

### 2. Manual spans with rich spaceport.* attributes

**Decision**: Create manual child spans for the core logic of each endpoint using the OTel Python SDK context manager pattern (`with tracer.start_as_current_span(...) as span:`). Set attributes using Weaver-defined names.

**Pricing span attributes**: `spaceport.departure.id`, `spaceport.departure.destination`, `spaceport.seat.class`, `spaceport.pricing.total`, `spaceport.pricing.promo_applied`, `spaceport.pricing.currency`.

**Recommendation span attributes**: `spaceport.departure.id`, number of recommendations returned.

**Rationale**: Rich attributes on spans are the most educational part of Tempo traces in a demo. Showing `spaceport.seat.class = "economy-cryosleep"` and `spaceport.pricing.promo_applied = true` makes telemetry feel real and story-like, not abstract.

### 3. In-memory chaos state

**Decision**: Chaos state (failure mode, latency injection, remaining requests to affect) is stored as module-level Python variables, toggled via `POST /simulate-failure` and `POST /simulate-latency`. State resets on service restart.

**Rationale**: Simple, no external dependency. For a demo, you want to be able to toggle chaos quickly without a database. "Restart to reset" is acceptable and actually demonstrates service restarts in Kubernetes.

**Chaos span attributes**: When chaos is active, spans SHALL include `spaceport.chaos.failure_mode` and/or `spaceport.chaos.latency_ms` attributes so that chaos scenarios are visible in Tempo.

### 4. Structured logging with trace correlation

**Decision**: Use Python's standard `logging` module with a JSON formatter that reads `trace_id` and `span_id` from the current OTel context using `trace.get_current_span()`. Log via `STDOUT` so Loki can scrape container logs.

**Rationale**: Correlating Loki logs with Tempo traces by `trace_id` is a key demo scenario. Python's logging module is familiar and requires no additional dependencies.

### 5. Natural latency variance

**Decision**: Add a random baseline delay of 50-150ms to all pricing and recommendation calls using `asyncio.sleep(random.uniform(0.05, 0.15))`.

**Rationale**: Completely flat latency looks fake in a demo. Realistic variance in the pricing service means traces always show some interesting timing, even without chaos mode active. The histogram metric `spaceport.pricing.request.duration` then shows a non-trivial distribution in Grafana.

## Risks / Trade-offs

- **Promo logic is non-deterministic** → Random promos mean the same request gives different prices. This is intentional for demo interest, but may confuse if demoing idempotency. Mitigation: Document that pricing is intentionally non-deterministic.
- **asyncio.sleep affects all concurrent requests** → Artificial latency is per-request, not blocking the event loop. Non-issue with FastAPI's async handlers.
- **Chaos state is global, not per-request** → The `simulate-failure` endpoint affects all subsequent requests to the service, not just one. This is the desired demo behavior.

## Open Questions

- Should chaos endpoints be protected (e.g., only accessible from internal network)? → No auth in v1 — this is a demo app on a local cluster. Document clearly in README that these are demo-only endpoints.
