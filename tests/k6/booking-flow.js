import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 3,
  duration: "1m",
  thresholds: {
    http_req_failed: [{ threshold: "rate<0.1", abortOnFail: false }],
    http_req_duration: ["p(95)<1000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

export default function () {
  // Step 1: List departures
  const departures = http.get(`${BASE_URL}/api/departures`);
  check(departures, {
    "GET /api/departures is 200": (r) => r.status === 200,
  });

  // Step 2: Get departure detail
  const detail = http.get(`${BASE_URL}/api/departures/1`);
  check(detail, {
    "GET /api/departures/1 is 200": (r) => r.status === 200,
  });

  // Step 3: Place a booking
  const payload = JSON.stringify({
    departure_id: 1,
    passenger_name: "K6 Load Tester",
    seat_class: "economy-cryosleep",
    cryosleep_enabled: false,
    extra_baggage: 0,
    currency: "UNC",
  });

  const booking = http.post(`${BASE_URL}/api/bookings`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  check(booking, {
    "POST /api/bookings is 201": (r) => r.status === 201,
  });

  sleep(1);
}
