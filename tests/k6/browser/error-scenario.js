// tests/k6/browser/error-scenario.js
//
// Browser chaos test: pricing service failure surfaces as UI error alert.
// Converted from tests/playwright/specs/error-scenario.spec.ts
//
// Run: k6 run -e FRONTEND_URL=http://localhost:5175 \
//             -e PRICING_SERVICE_URL=http://localhost:8000 \
//             tests/k6/browser/error-scenario.js

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
  // Inject a single simulated failure into the pricing service
  const failRes = http.post(
    `${PRICING_URL}/simulate-failure`,
    JSON.stringify({ count: 1 }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(failRes, { 'simulate-failure 200': (r) => r.status === 200 });

  const page = await browser.newPage();
  try {
    await page.goto(`${BASE_URL}/book/1`);

    await page.getByText('Book Your Trip').waitFor({ state: 'visible' });

    await page.locator('#passenger-name').fill('Unlucky Passenger');
    await page.locator('#seat-class').click();
    await page.getByRole('option', { name: /Economy Cryosleep/i }).click();

    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    // Error alert must appear after the chaos-injected failure
    const alert = page.locator("[role='alert']");
    await alert.waitFor({ state: 'visible', timeout: 10_000 });
    check(await alert.isVisible(), {
      'error alert visible': (v) => v,
    });

    const alertText = await alert.textContent();
    check(alertText, {
      'alert contains error text': (t) => /failed|error/i.test(t),
    });
  } catch (e) {
    fail(`error-scenario failed: ${e}`);
  } finally {
    await page.close();
  }
}
