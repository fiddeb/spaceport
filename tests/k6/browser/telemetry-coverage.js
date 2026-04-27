// tests/k6/browser/telemetry-coverage.js
//
// Browser telemetry coverage: exercises every frontend code path that emits
// custom spaceport.* telemetry (spans, metrics, events, logs).
// Converted from tests/playwright/specs/telemetry-coverage.spec.ts
//
// Run standalone:  k6 run -e FRONTEND_URL=http://localhost:5175 \
//                         -e PRICING_SERVICE_URL=http://localhost:8000 \
//                         tests/k6/browser/telemetry-coverage.js
// Run via:         make telemetry-test  (starts weaver + services first)
//
// Signal coverage:
//   Spans:   browse_departures, view_departure, place_booking (success + fail),
//            load_currencies, change_currency, view_information_desk, exhibit.view
//   Metrics: page_views, bookings (success + failure), exhibit_views, exhibit_dwell_time
//   Events:  booking_completed, booking_failed, exhibit_viewed, exchange_completed

import http from 'k6/http';
import { browser } from 'k6/browser';
import { check, fail, sleep } from 'k6';

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: '5m',
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    checks: [{ threshold: 'rate>0.5', abortOnFail: false }],
  },
};

const BASE_URL = __ENV.FRONTEND_URL || 'http://localhost:5175';
const PRICING_URL = __ENV.PRICING_SERVICE_URL || 'http://localhost:8000';

export default async function () {
  const page = await browser.newPage();

  try {
    // ── 1. Browse departures ────────────────────────────────────────────────
    // Triggers: browse_departures span, page_views counter (departure_list)
    await page.goto(`${BASE_URL}/departures`);
    const departuresHeading = page.getByRole('heading', { name: 'Departures' });
    await departuresHeading.waitFor({ state: 'visible' });
    check(await departuresHeading.isVisible(), { 'browse departures: heading visible': (v) => v });
    const cards = page.locator("a:has-text('View Details')");
    await cards.first().waitFor({ state: 'visible' });
    // Stay briefly so the metric export interval can fire
    await page.waitForTimeout(2000);

    // ── 2. View departure detail ────────────────────────────────────────────
    // Triggers: view_departure span, page_views counter (departure_detail)
    await page.goto(`${BASE_URL}/departures/1`);
    const pricingHeading = page.getByRole('heading', { name: 'Pricing' });
    await pricingHeading.waitFor({ state: 'visible', timeout: 15_000 });
    check(await pricingHeading.isVisible(), { 'view departure: Pricing heading visible': (v) => v });
    await page.waitForTimeout(2000);

    // ── 3. Place a successful booking (Economy Cryosleep) ───────────────────
    // Triggers: place_booking span, booking_completed event,
    //           bookings counter (success), page_views (departure_detail)
    await page.goto(`${BASE_URL}/book/1`);
    await page.getByText('Book Your Trip').waitFor({ state: 'visible' });
    await page.locator('#passenger-name').fill('Telemetry Tester');
    await page.locator('#seat-class').click();
    await page.getByRole('option', { name: /Economy Cryosleep/i }).click();
    await page.getByRole('button', { name: 'Confirm Booking' }).click();
    await page.waitForURL(/\/confirmation\//, { timeout: 10_000 });
    check(await page.getByText('Booking Confirmed!').isVisible(), {
      'economy booking: confirmed': (v) => v,
    });
    await page.waitForTimeout(2000);

    // ── 4. Place a booking with Business Warp ──────────────────────────────
    // Triggers: place_booking span with business-warp seat class
    await page.goto(`${BASE_URL}/book/1`);
    await page.getByText('Book Your Trip').waitFor({ state: 'visible' });
    await page.locator('#passenger-name').fill('Business Tester');
    await page.locator('#seat-class').click();
    await page.getByRole('option', { name: /Business Warp/i }).click();
    await page.getByRole('button', { name: 'Confirm Booking' }).click();
    await page.waitForURL(/\/confirmation\//, { timeout: 10_000 });
    check(await page.getByText('Booking Confirmed!').isVisible(), {
      'business-warp booking: confirmed': (v) => v,
    });

    // ── 5. Place a failed booking (chaos) ──────────────────────────────────
    // Triggers: place_booking span with error, booking_failed event,
    //           bookings counter (failure)
    const failRes = http.post(
      `${PRICING_URL}/simulate-failure`,
      JSON.stringify({ count: 1 }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(failRes, { 'chaos: simulate-failure 200': (r) => r.status === 200 });

    await page.goto(`${BASE_URL}/book/1`);
    await page.getByText('Book Your Trip').waitFor({ state: 'visible' });
    await page.locator('#passenger-name').fill('Unlucky Tester');
    await page.locator('#seat-class').click();
    await page.getByRole('option', { name: /Economy Cryosleep/i }).click();
    await page.getByRole('button', { name: 'Confirm Booking' }).click();
    const alert = page.locator("[role='alert']");
    await alert.waitFor({ state: 'visible', timeout: 10_000 });
    check(await alert.isVisible(), { 'chaos booking: error alert visible': (v) => v });
    const alertText = await alert.textContent();
    check(alertText, { 'chaos booking: alert contains error text': (t) => /failed|error/i.test(t) });
    await page.waitForTimeout(2000);

    // ── 6. Information Desk with exhibit scrolling ──────────────────────────
    // Triggers: view_information_desk span, exhibit.view spans,
    //           exhibit_viewed events, exhibit_views counter,
    //           exhibit_dwell_time histogram, page_views (information_desk)
    await page.goto(`${BASE_URL}/information`);
    await page.getByRole('heading').first().waitFor({ state: 'visible', timeout: 10_000 });
    check(await page.getByRole('heading').first().isVisible(), {
      'information desk: heading visible': (v) => v,
    });

    // Scroll through the page to trigger exhibit IntersectionObserver
    await page.evaluate(async () => {
      const delay = (ms) => new Promise((r) => setTimeout(r, ms));
      const step = window.innerHeight / 2;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await delay(800);
      }
      window.scrollTo(0, 0);
      await delay(1000);
    });

    await page.waitForTimeout(2000);

    // ── 7. Currency switcher ────────────────────────────────────────────────
    // Triggers: change_currency span, exchange_completed event,
    //           load_currencies span (on initial load)
    await page.goto(`${BASE_URL}/departures/1`);
    await page.getByRole('heading', { name: 'Pricing' }).waitFor({ state: 'visible', timeout: 15_000 });

    const currencyTrigger = page.locator('[class*="w-36"]').first();
    await currencyTrigger.waitFor({ state: 'visible', timeout: 5000 });
    await currencyTrigger.click();
    await page.getByRole('option', { name: /REP/i }).click();
    await page.waitForTimeout(2000);

    // Reset back to UNC
    await currencyTrigger.click();
    await page.getByRole('option', { name: /UNC/i }).click();
    await page.waitForTimeout(1000);

    // Currencies page also triggers load_currencies span
    await page.goto(`${BASE_URL}/currencies`);
    await page.waitForTimeout(2000);

    // ── 8. Flush telemetry ─────────────────────────────────────────────────
    // Give BatchSpanProcessor (500ms) and metric export interval (15s) time to fire.
    await page.goto(`${BASE_URL}/departures`);
    await page.waitForTimeout(16_000);
  } catch (e) {
    fail(`telemetry-coverage failed: ${e}`);
  } finally {
    await page.close();
  }
}
