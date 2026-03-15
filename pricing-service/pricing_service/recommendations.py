"""Destination recommendations engine."""

from opentelemetry import trace

tracer = trace.get_tracer(__name__)

DESTINATIONS = {
    1: "Mars Colony Alpha",
    2: "Titan Station Prometheus",
    3: "Europa Deep Dive",
    4: "Moonbase Alpha",
}

# Themed reasons keyed by (from_id, to_id) — fallback to a generic reason.
REASONS = {
    (1, 2): "Saturn's rings await after the red dust — Titan is the polar opposite of Mars",
    (1, 3): "From volcanic plains to subsurface oceans — Europa is Mars's icy twin",
    (1, 4): "After frontier living, treat yourself to Earth views and duty-free shopping",
    (2, 1): "Trade methane lakes for rust-red sunsets on the frontier",
    (2, 3): "Europa's ice oceans are the perfect follow-up to Titan's hydrocarbon seas",
    (2, 4): "Low gravity luxury awaits after Titan's dense atmosphere",
    (3, 1): "Swap ice geysers for Olympus Mons volcano views on Mars",
    (3, 2): "If you loved Europa's oceans, you'll love Titan's methane lakes",
    (3, 4): "After the deep dive, relax with Earth views at Moonbase Alpha",
    (4, 1): "Ready for adventure after the classics? Mars frontier living calls",
    (4, 2): "Saturn's rings are the next natural wonder after Moonbase Alpha",
    (4, 3): "Go deeper — Europa's subsurface oceans are unlike anything in orbit",
}

DEFAULT_REASON = "A popular destination among space travellers"


def get_recommendations(departure_id: int) -> list[dict]:
    with tracer.start_as_current_span("pricing.recommend") as span:
        span.set_attribute("spaceport.departure.id", departure_id)

        # Pick 2-3 recommendations excluding self
        candidates = [did for did in DESTINATIONS if did != departure_id]
        # Deterministic selection: take the next 3 IDs wrapping around
        recs = candidates[:3]

        results = []
        for rec_id in recs:
            reason = REASONS.get((departure_id, rec_id), DEFAULT_REASON)
            results.append(
                {
                    "departure_id": rec_id,
                    "destination": DESTINATIONS[rec_id],
                    "reason": reason,
                }
            )

        return results
