// tests/k6/telemetry-coverage.js
//
// Exercises every backend code path that emits custom spaceport.* telemetry,
// ensuring weaver live-check sees every registered signal at least once.
//
// Run standalone:  k6 run tests/k6/telemetry-coverage.js
// Run via:         make telemetry-test  (starts weaver + services first)

import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  // Single iteration per VU — this is a coverage test, not a load test
  vus: 1,
  iterations: 1,
  // Do not abort on check failures — chaos scenarios intentionally produce
  // HTTP errors, and we still want all subsequent coverage steps to run.
  thresholds: {
    checks: [{ threshold: "rate>0.5", abortOnFail: false }],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const PRICING_URL = __ENV.PRICING_URL || "http://localhost:8000";

const SEAT_CLASSES = [
  "economy-cryosleep",
  "business-warp",
  "first-class-nebula",
];

// Valid currencies from pricing-service/data/currencies.json
const CURRENCIES = ["UNC", "REP", "LAT"];

export default function () {
  // ────────────────────────────────────────────────────────────────────
  // 1. Departures — triggers departure.list.server span + departure.active metric
  // ────────────────────────────────────────────────────────────────────
  const depList = http.get(`${BASE_URL}/api/departures`);
  check(depList, { "GET /api/departures 200": (r) => r.status === 200 });

  const departures = depList.json();
  const departureIds =
    departures && departures.length > 0
      ? departures.map((d) => d.id)
      : [1, 2, 3];

  // Hit at least two departure details
  for (const id of departureIds.slice(0, 2)) {
    const detail = http.get(`${BASE_URL}/api/departures/${id}`);
    check(detail, {
      [`GET /api/departures/${id} 200`]: (r) => r.status === 200,
    });
  }

  // ────────────────────────────────────────────────────────────────────
  // 2. Currencies — triggers the /currencies endpoint
  // ────────────────────────────────────────────────────────────────────
  const curr = http.get(`${BASE_URL}/api/currencies`);
  check(curr, { "GET /api/currencies 200": (r) => r.status === 200 });

  // ────────────────────────────────────────────────────────────────────
  // 3. Bookings — every seat class × currency combination
  //    Triggers: booking.create.server span, pricing.calculate.client span,
  //              pricing.calculate.server span, booking.count metric,
  //              booking.active metric, pricing.request.duration metric
  // ────────────────────────────────────────────────────────────────────
  for (const seatClass of SEAT_CLASSES) {
    for (const currency of CURRENCIES) {
      const payload = JSON.stringify({
        departure_id: departureIds[0],
        passenger_name: `Telemetry Test (${seatClass}/${currency})`,
        seat_class: seatClass,
        cryosleep_enabled: seatClass === "economy-cryosleep",
        extra_baggage: seatClass === "first-class-nebula" ? 2 : 0,
        currency: currency,
      });

      const booking = http.post(`${BASE_URL}/api/bookings`, payload, {
        headers: { "Content-Type": "application/json" },
      });
      check(booking, {
        [`POST booking ${seatClass}/${currency} 201`]: (r) =>
          r.status === 201,
      });
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // 4. Recommendations — triggers pricing.recommend.server span
  // ────────────────────────────────────────────────────────────────────
  for (const id of departureIds.slice(0, 2)) {
    const recs = http.get(`${PRICING_URL}/recommendations/${id}`);
    check(recs, {
      [`GET /recommendations/${id} 200`]: (r) => r.status === 200,
    });
  }

  // ────────────────────────────────────────────────────────────────────
  // 5. Chaos: failure injection
  //    Triggers: pricing.error attr, chaos.failure_mode attr,
  //              pricing.failures.count metric, booking.count(failed)
  // ────────────────────────────────────────────────────────────────────
  const failSetup = http.post(
    `${PRICING_URL}/simulate-failure`,
    JSON.stringify({ count: 2 }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(failSetup, {
    "POST simulate-failure 200": (r) => r.status === 200,
  });

  // These bookings should fail because pricing returns 500
  for (let i = 0; i < 2; i++) {
    const failBooking = http.post(
      `${BASE_URL}/api/bookings`,
      JSON.stringify({
        departure_id: departureIds[0],
        passenger_name: "Chaos Failure Test",
        seat_class: "economy-cryosleep",
        cryosleep_enabled: false,
        extra_baggage: 0,
        currency: "UNC",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
    // The API may return 500 or 502 when pricing fails
    check(failBooking, {
      [`POST booking with chaos failure ${i} is error`]: (r) =>
        r.status >= 400,
    });
  }

  // Reset chaos failure state so subsequent tests are unaffected
  http.post(
    `${PRICING_URL}/simulate-failure`,
    JSON.stringify({ count: 0 }),
    { headers: { "Content-Type": "application/json" } }
  );

  // ────────────────────────────────────────────────────────────────────
  // 6. Chaos: latency injection
  //    Triggers: chaos.latency_ms attr on pricing.calculate span
  // ────────────────────────────────────────────────────────────────────
  const latencySetup = http.post(
    `${PRICING_URL}/simulate-latency`,
    JSON.stringify({ count: 1, latency_ms: 500 }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(latencySetup, {
    "POST simulate-latency 200": (r) => r.status === 200,
  });

  const slowBooking = http.post(
    `${BASE_URL}/api/bookings`,
    JSON.stringify({
      departure_id: departureIds[0],
      passenger_name: "Chaos Latency Test",
      seat_class: "business-warp",
      cryosleep_enabled: false,
      extra_baggage: 0,
      currency: "REP",
    }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(slowBooking, {
    "POST booking with chaos latency 201": (r) => r.status === 201,
  });

  // Reset latency state so direct pricing calls below are not affected
  http.post(
    `${PRICING_URL}/simulate-latency`,
    JSON.stringify({ count: 0, latency_ms: 0 }),
    { headers: { "Content-Type": "application/json" } }
  );

  // ────────────────────────────────────────────────────────────────────
  // 7. Direct pricing endpoint — triggers pricing.calculate.server span
  //    with different currencies (not routed through API booking flow)
  // ────────────────────────────────────────────────────────────────────
  for (const currency of CURRENCIES) {
    const priceResp = http.get(
      `${PRICING_URL}/price/${departureIds[0]}?currency=${currency}`
    );
    check(priceResp, {
      [`GET /price/${departureIds[0]}?currency=${currency} 200`]: (r) =>
        r.status === 200,
    });
  }
  // Let batched telemetry export before the script ends
  sleep(2);
}
