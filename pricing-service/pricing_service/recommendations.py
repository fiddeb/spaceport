"""Destination recommendations engine."""

from opentelemetry import trace

tracer = trace.get_tracer(__name__)

DESTINATIONS = {
    1: "Europa",
    2: "Titan",
    3: "Enceladus",
    4: "Mars-Olympus",
    5: "Ganymede",
    6: "Proxima-b",
    7: "Kepler-442b",
    8: "Ceres-Station",
}

# Themed reasons keyed by (from_id, to_id) — fallback to a generic reason.
REASONS = {
    (1, 2): "If you enjoyed Europa's ice oceans, you'll love Titan's methane lakes",
    (1, 3): "Enceladus geysers pair perfectly with Europa's subsurface diving",
    (2, 1): "Europa's tidal geysers are the perfect follow-up to Titan's dunes",
    (2, 5): "Ganymede's magnetic aurora complements Titan's orange skies",
    (3, 1): "Europa is the sister moon — ice explorers love both",
    (3, 4): "Trade ice geysers for Olympus Mons volcano views",
    (4, 6): "After Mars, go interstellar — Proxima-b awaits",
    (4, 8): "Ceres-Station is the perfect pit-stop after Mars expeditions",
    (5, 2): "From Ganymede's craters to Titan's hydrocarbon seas",
    (5, 7): "Kepler-442b is the deep-space upgrade from Ganymede",
    (6, 7): "Both exoplanets — complete the interstellar double feature",
    (6, 4): "Return to the solar system via Mars-Olympus",
    (7, 6): "Proxima-b is the nearest neighbor to Kepler-442b",
    (7, 8): "Refuel at Ceres-Station after deep-space travel",
    (8, 4): "Mars-Olympus is a quick hop from Ceres-Station",
    (8, 5): "Ganymede is the next belt-runner destination from Ceres",
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
