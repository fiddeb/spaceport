## 1. Python Project Setup

- [ ] 1.1 Create `pricing-service/` directory with `pyproject.toml` (or `requirements.txt`) including: `fastapi`, `uvicorn[standard]`, `opentelemetry-sdk`, `opentelemetry-exporter-otlp`, `opentelemetry-instrumentation-fastapi`, `opentelemetry-instrumentation-logging`
- [ ] 1.2 Create `pricing-service/Dockerfile` based on `python:3.12-slim`, installs deps and runs `uvicorn main:app --host 0.0.0.0 --port 8000`
- [ ] 1.3 Add `OTEL_EXPORTER_OTLP_ENDPOINT`, `SERVICE_VERSION`, `DEPLOYMENT_ENV` to `.env.example`

## 2. OTel SDK Initialization

- [ ] 2.1 Create `pricing_service/telemetry.py` with `setup_telemetry()` function that initializes `TracerProvider` with `OTLPSpanExporter` and sets resource: `service.name = "spaceport-pricing-service"`, `service.version`, `deployment.environment.name`
- [ ] 2.2 Create JSON log formatter in `pricing_service/logging_config.py` that extracts `trace_id` and `span_id` from `trace.get_current_span()` and adds them to every log record
- [ ] 2.3 Call `setup_telemetry()` at module load in `main.py` before FastAPI app creation
- [ ] 2.4 Call `FastAPIInstrumentor().instrument_app(app)` after app creation

## 3. Pricing Engine

- [ ] 3.1 Create `pricing_service/pricing.py` with function `calculate_price(departure_id, seat_class, currency="UNC")` returning `{"seat_class", "base_price", "total_price", "promo_applied", "currency"}` — base prices in UNC: economy-cryosleep 890 UNC, business-warp 2200 UNC, first-class-nebula 5500 UNC with random 10% promo chance (15% discount); other destinations vary by a seeded ±20% factor on the base price
- [ ] 3.2 Create `GET /price/{departure_id}` endpoint in `main.py` calling `calculate_price` for all three seat classes
- [ ] 3.3 Add manual span `pricing.calculate` inside `calculate_price` with attributes: `spaceport.departure.id`, `spaceport.seat.class`, `spaceport.pricing.total`, `spaceport.pricing.promo_applied`, `spaceport.pricing.base_currency` (always "UNC"), `spaceport.pricing.display_currency` (the requested currency code)
- [ ] 3.4 Add baseline latency: `await asyncio.sleep(random.uniform(0.05, 0.15))` in each endpoint handler
- [ ] 3.5 Create `data/currencies.json` with the 8-currency catalog: `{"currencies": [{"code": "UNC", "name": "Universal Neural Credits", "rate": 1.0}, {"code": "REP", "name": "Reputation Tokens", "rate": 1.25}, {"code": "LAT", "name": "Lattice Creds", "rate": 4.0}, {"code": "QUA", "name": "Quantum Marks", "rate": 0.2}, {"code": "NIN", "name": "Nino Chips", "rate": 0.05}, {"code": "BZD", "name": "Bazaar Ducats", "rate": 0.5}, {"code": "COIN", "name": "Standard Coins", "rate": 0.8}, {"code": "TKN", "name": "Generic Tokens", "rate": 0.1}]}`
- [ ] 3.6 Create `GET /currencies` endpoint in `main.py` that loads and returns `data/currencies.json` (read once at startup into a module-level variable)
- [ ] 3.7 Update `GET /price/{departure_id}` to accept optional `?currency=CODE` query param; validate `CODE` against the catalog (400 on unknown code); multiply `total_price` by the rate and set `currency` field to `CODE` (default `UNC`)

## 4. Recommendations Engine

- [ ] 4.1 Create `pricing_service/recommendations.py` with static destination mapping and `get_recommendations(departure_id)` returning 2-3 themed recommendations excluding the input
- [ ] 4.2 Create `GET /recommendations/{departure_id}` endpoint
- [ ] 4.3 Add manual span `pricing.recommend` with attribute `spaceport.departure.id`
- [ ] 4.4 Add spaceport-themed `reason` strings for each recommendation pair

## 5. Chaos Endpoints

- [ ] 5.1 Create module-level variables in `main.py`: `_failure_count = 0`, `_latency_count = 0`, `_latency_ms = 0`
- [ ] 5.2 Create `POST /simulate-failure` endpoint accepting `{"count": int}`, setting `_failure_count`
- [ ] 5.3 Create `POST /simulate-latency` endpoint accepting `{"count": int, "latency_ms": int}`, setting `_latency_count` and `_latency_ms`
- [ ] 5.4 Create `_apply_chaos(span)` helper that: checks failure count (returns 500, adds `spaceport.chaos.failure_mode` attribute, sets span ERROR), checks latency count (sleeps, adds `spaceport.chaos.latency_ms` attribute)
- [ ] 5.5 Call `_apply_chaos(span)` at the start of pricing and recommendation handlers
- [ ] 5.6 Add themed 500 error messages: "Solar storm disrupting navigation systems", "Docking gate busy — captain lost in time anomaly"

## 6. Health Endpoint

- [ ] 6.1 Create `GET /health` returning `{"status": "ok"}`

## 7. Verification

- [ ] 7.1 Test: start service, call `GET /price/1` and verify `traceparent` is accepted and a trace appears in Tempo via Go API
- [ ] 7.2 Test chaos: `POST /simulate-failure {"count": 2}`, then call `GET /price/1` twice — both should return 500, third call returns 200
- [ ] 7.3 Test log correlation: verify log lines from a pricing request contain `trace_id` matching the trace visible in Tempo
