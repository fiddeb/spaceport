// tests/k6/browser/view-departure.js
//
// Browser smoke test: departure detail page with pricing.
// Converted from tests/playwright/specs/view-departure.spec.ts
//
// Run: k6 run -e FRONTEND_URL=http://localhost:5175 tests/k6/browser/view-departure.js

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
    await page.goto(`${BASE_URL}/departures/1`);

    // Pricing section must load
    const pricingHeading = page.getByRole('heading', { name: 'Pricing' });
    await pricingHeading.waitFor({ state: 'visible', timeout: 15_000 });
    check(await pricingHeading.isVisible(), {
      'Pricing heading is visible': (v) => v,
    });

    // At least one price value rendered
    const priceValues = page.locator('span.text-primary');
    await priceValues.first().waitFor({ state: 'visible' });
    check(await priceValues.count(), {
      'at least one price value': (n) => n >= 1,
    });

    // Book Now link must be present
    const bookNow = page.getByRole('link', { name: 'Book Now' });
    await bookNow.waitFor({ state: 'visible' });
    check(await bookNow.isVisible(), {
      'Book Now link visible': (v) => v,
    });
  } catch (e) {
    fail(`view-departure failed: ${e}`);
  } finally {
    await page.close();
  }
}
