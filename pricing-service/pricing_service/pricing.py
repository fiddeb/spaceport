"""Pricing calculation logic."""

import hashlib

from opentelemetry import trace

tracer = trace.get_tracer(__name__)

BASE_PRICES = {
    "economy-cryosleep": 890,
    "business-warp": 2200,
    "first-class-nebula": 5500,
}

SEAT_CLASSES = list(BASE_PRICES.keys())


def _destination_factor(departure_id: int) -> float:
    """Deterministic ±20% factor seeded by departure_id."""
    h = int(hashlib.sha256(str(departure_id).encode()).hexdigest(), 16)
    return 0.8 + (h % 4001) / 10000  # range [0.80, 1.20]


def _promo_applied(departure_id: int) -> bool:
    """Deterministic 10% promo check seeded by departure_id."""
    h = int(hashlib.sha256(f"promo:{departure_id}".encode()).hexdigest(), 16)
    return (h % 100) < 10


def calculate_price(
    departure_id: int, seat_class: str, currency: str = "UNC", rate: float = 1.0
) -> dict:
    with tracer.start_as_current_span("pricing.calculate") as span:
        base = BASE_PRICES[seat_class]
        factor = _destination_factor(departure_id)
        base_price = round(base * factor, 2)

        # 10% chance of 15% promo discount (deterministic per departure)
        promo_applied = _promo_applied(departure_id)
        total_unc = round(base_price * 0.85, 2) if promo_applied else base_price
        total_price = round(total_unc * rate, 2)

        span.set_attribute("spaceport.departure.id", departure_id)
        span.set_attribute("spaceport.seat.class", seat_class)
        span.set_attribute("spaceport.pricing.total", total_price)
        span.set_attribute("spaceport.pricing.promo_applied", promo_applied)
        span.set_attribute("spaceport.pricing.base_currency", "UNC")
        span.set_attribute("spaceport.pricing.display_currency", currency)

        return {
            "seat_class": seat_class,
            "base_price": base_price,
            "total_price": total_price,
            "promo_applied": promo_applied,
            "currency": currency,
        }
