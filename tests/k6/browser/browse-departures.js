// tests/k6/browser/browse-departures.js
//
// Browser smoke test: departure list page.
// Converted from tests/playwright/specs/browse-departures.spec.ts
//
// Run: k6 run -e FRONTEND_URL=http://localhost:5175 tests/k6/browser/browse-departures.js

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
    await page.goto(`${BASE_URL}/departures`);

    // Departures heading must be visible
    const heading = page.getByRole('heading', { name: 'Departures' });
    await heading.waitFor({ state: 'visible' });
    check(await heading.isVisible(), {
      'Departures heading is visible': (v) => v,
    });

    // At least one departure card rendered
    const cards = page.locator("a:has-text('View Details')");
    await cards.first().waitFor({ state: 'visible' });
    check(await cards.count(), {
      'at least one departure card': (n) => n >= 1,
    });

    // Mars must appear as a destination
    const mars = page.getByText('Mars');
    await mars.first().waitFor({ state: 'visible' });
    check(await mars.first().isVisible(), {
      'Mars destination visible': (v) => v,
    });
  } catch (e) {
    fail(`browse-departures failed: ${e}`);
  } finally {
    await page.close();
  }
}
