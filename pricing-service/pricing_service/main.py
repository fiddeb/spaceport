"""Spaceport Pricing Service — FastAPI application."""

import asyncio
import json
import logging
import random
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query, Request
from opentelemetry import context as otel_context, trace
from opentelemetry.propagate import extract
from opentelemetry.trace import SpanKind, StatusCode
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

from pricing_service.logging_config import setup_logging
from pricing_service.pricing import SEAT_CLASSES, calculate_price
from pricing_service.recommendations import get_recommendations
from pricing_service.semconv import attribute
from pricing_service.telemetry import setup_telemetry

# --- OTel + logging init (before app creation) ---
setup_telemetry()
setup_logging()

logger = logging.getLogger("pricing_service")
_tracer = trace.get_tracer("spaceport-pricing-service")

app = FastAPI(title="Spaceport Pricing Service")
FastAPIInstrumentor.instrument_app(app)

# --- Load currency catalog once at startup ---
_currencies_path = Path(__file__).resolve().parent.parent / "data" / "currencies.json"
with open(_currencies_path) as f:
    _currency_catalog: dict = json.load(f)

_currency_rates: dict[str, float] = {
    c["code"]: c["rate"] for c in _currency_catalog["currencies"]
}

# --- Chaos state ---
_failure_count: int = 0
_latency_count: int = 0
_latency_ms: int = 0

_FAILURE_MESSAGES = [
    "Solar storm disrupting navigation systems",
    "Docking gate busy — captain lost in time anomaly",
]


async def _apply_chaos(span: trace.Span) -> Optional[dict]:
    """Apply chaos injection if active. Returns error response dict or None."""
    global _failure_count, _latency_count

    if _failure_count > 0:
        _failure_count -= 1
        msg = random.choice(_FAILURE_MESSAGES)
        span.add_event("chaos.failure_triggered", {"spaceport.chaos.failure_mode": msg})
        span.set_status(StatusCode.ERROR, msg)
        logger.error("Chaos failure triggered: %s", msg)
        raise HTTPException(status_code=500, detail=msg)

    if _latency_count > 0:
        _latency_count -= 1
        span.add_event("chaos.latency_injected", {"spaceport.chaos.latency_ms": _latency_ms})
        logger.warning("Chaos latency injected: %dms", _latency_ms)
        await asyncio.sleep(_latency_ms / 1000.0)

    return None


# --- Endpoints ---


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.get("/currencies")
async def currencies() -> dict:
    return _currency_catalog


@app.get("/price/{departure_id}")
async def price(
    departure_id: int,
    currency: Optional[str] = Query(None),
) -> dict:
    span = trace.get_current_span()
    span.set_attribute(attribute.SPACEPORT_DEPARTURE_ID, departure_id)
    await _apply_chaos(span)

    # Validate currency if provided
    code = currency or "UNC"
    if code not in _currency_rates:
        raise HTTPException(status_code=400, detail=f"Unknown currency: {code}")
    rate = _currency_rates[code]

    # Baseline latency
    await asyncio.sleep(random.uniform(0.05, 0.15))

    logger.info("Pricing departure_id=%d currency=%s", departure_id, code)

    prices = [
        calculate_price(departure_id, sc, currency=code, rate=rate)
        for sc in SEAT_CLASSES
    ]
    return {"departure_id": departure_id, "prices": prices}


@app.get("/recommendations/{departure_id}")
async def recommendations(departure_id: int) -> dict:
    span = trace.get_current_span()
    span.set_attribute(attribute.SPACEPORT_DEPARTURE_ID, departure_id)
    await _apply_chaos(span)

    # Baseline latency
    await asyncio.sleep(random.uniform(0.05, 0.15))

    logger.info("Recommendations departure_id=%d", departure_id)
    recs = get_recommendations(departure_id)
    return {"departure_id": departure_id, "recommendations": recs}


@app.post("/simulate-failure")
async def simulate_failure(body: dict) -> dict:
    global _failure_count
    _failure_count = int(body["count"])
    logger.info("Failure injection set: count=%d", _failure_count)
    return {"failure_count": _failure_count}


@app.post("/simulate-latency")
async def simulate_latency(body: dict) -> dict:
    global _latency_count, _latency_ms
    _latency_count = int(body["count"])
    _latency_ms = int(body["latency_ms"])
    logger.info("Latency injection set: count=%d latency_ms=%d", _latency_count, _latency_ms)
    return {"latency_count": _latency_count, "latency_ms": _latency_ms}
