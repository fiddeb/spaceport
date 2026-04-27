// tests/k6/browser/latency-scenario.js
//
// Browser chaos test: injected pricing latency is observable in page load time.
// Converted from tests/playwright/specs/latency-scenario.spec.ts
//
// Run: k6 run -e FRONTEND_URL=http://localhost:5175 \
//             -e PRICING_SERVICE_URL=http://localhost:8000 \
//             tests/k6/browser/latency-scenario.js

import http from 'k6/http';
import { browser } from 'k6/browser';
import { check, fail } from 'k6';

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
};

const BASE_URL = __ENV.FRONTEND_URL || 'http://localhost:5175';
const PRICING_URL = __ENV.PRICING_SERVICE_URL || 'http://localhost:8000';

export default async function () {
  // Inject 2 seconds of latency for the next pricing request
  const latencyRes = http.post(
    `${PRICING_URL}/simulate-latency`,
    JSON.stringify({ count: 1, latency_ms: 2000 }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(latencyRes, { 'simulate-latency 200': (r) => r.status === 200 });

  const page = await browser.newPage();
  try {
    const start = Date.now();

    // Departure detail triggers a pricing call — which is now delayed
    await page.goto(`${BASE_URL}/departures/1`);

    const pricingHeading = page.getByRole('heading', { name: 'Pricing' });
    await pricingHeading.waitFor({ state: 'visible', timeout: 15_000 });

    const elapsed = Date.now() - start;

    check(elapsed, {
      'page load took at least 1500ms due to injected latency': (ms) => ms >= 1500,
    });
  } catch (e) {
    fail(`latency-scenario failed: ${e}`);
  } finally {
    await page.close();
  }
}
