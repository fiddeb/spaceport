// tests/k6/browser/place-booking.js
//
// Browser smoke test: full booking flow through to confirmation page.
// Converted from tests/playwright/specs/place-booking.spec.ts
//
// Run: k6 run -e FRONTEND_URL=http://localhost:5175 tests/k6/browser/place-booking.js

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

export default async function () {
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE_URL}/book/1`);

    await page.getByText('Book Your Trip').waitFor({ state: 'visible' });
    check(await page.getByText('Book Your Trip').isVisible(), {
      '"Book Your Trip" visible': (v) => v,
    });

    // Fill passenger name
    await page.locator('#passenger-name').fill('Test Traveler');

    // Open Radix UI seat-class select and pick Economy Cryosleep
    await page.locator('#seat-class').click();
    await page.getByRole('option', { name: /Economy Cryosleep/i }).click();

    // Submit
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    // Wait for redirect to confirmation page
    await page.waitForURL(/\/confirmation\//, { timeout: 10_000 });

    check(await page.getByText('Booking Confirmed!').isVisible(), {
      '"Booking Confirmed!" visible': (v) => v,
    });
    check(await page.getByText('Booking ID').isVisible(), {
      '"Booking ID" visible': (v) => v,
    });
  } catch (e) {
    fail(`place-booking failed: ${e}`);
  } finally {
    await page.close();
  }
}
