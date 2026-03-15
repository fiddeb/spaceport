## Why

The third service exists to create realistic cross-service distributed traces and to provide controllable demo scenarios (latency spikes, errors). A Python FastAPI service is the right choice — it's easy to read, fast to modify during demos, and shows that OpenTelemetry works uniformly across languages. Without this service, traces would be flat (frontend → backend only), which misses the key distributed tracing story.

## What Changes

- Scaffold a Python FastAPI application in `pricing-service/`
- Implement endpoints:
  - `GET /price/{departure_id}` — calculate price based on departure, seat class, cryosleep option, and extras (bagage, snacks). Returns price breakdown.
  - `GET /recommendations/{departure_id}` — return related departures or upgrades. Annotated with attributes like `product.id`, `user.tier`, `promo.applied`.
  - `POST /simulate-failure` — toggle a flag that makes the next N requests return 500 errors (controllable chaos)
  - `POST /simulate-latency` — toggle a flag that adds artificial latency (200-2000ms) to the next N requests
  - `GET /health` — health check
- Pricing logic: deterministic formula based on destination distance, seat class multiplier, and random promo discounts
- OpenTelemetry Python SDK integration:
  - Auto-instrumentation for FastAPI (opentelemetry-instrumentation-fastapi)
  - Manual spans with rich attributes: `departure.id`, `departure.destination`, `seat.class`, `price.total`, `promo.applied`
  - Structured logging with trace correlation (trace_id, span_id in log lines)
  - Random natural latency variation (50-150ms) to make traces look realistic
- Dockerfile for the Python service
- `requirements.txt` or `pyproject.toml` with pinned dependencies

## Non-goals

- No real pricing algorithm — formula is intentionally simple and humorous
- No database or cache
- No authentication
- No rate limiting
- No async background tasks
- No gRPC — HTTP/JSON only

## Capabilities

### New Capabilities
- `pricing-engine`: Pricing calculation endpoint with deterministic formula, seat class multipliers, and promo logic
- `recommendations-engine`: Recommendation endpoint returning related departures with rich span attributes
- `demo-chaos`: Controllable failure and latency injection endpoints for demo scenarios
- `pricing-otel`: Python OpenTelemetry instrumentation — FastAPI auto-instrumentation, manual spans with business attributes, structured log correlation

### Modified Capabilities
<!-- No existing capabilities to modify -->

## Impact

- Depends on `project-foundation` for Docker and deployment
- Called by `spaceport-api` — must be reachable via `http://pricing-service:8000` in Docker/K8s
- Exposes port 8000
- Exports OTLP to the collector
- The simulate-failure and simulate-latency endpoints are stateful (in-memory flags) — restart clears state
