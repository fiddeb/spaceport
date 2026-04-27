import { test, expect } from "@playwright/test";

const PRICING_SERVICE_URL =
  process.env.PRICING_SERVICE_URL ?? "http://localhost:8000";

/**
 * Telemetry coverage test — exercises every frontend code path that emits
 * custom spaceport.* telemetry (spans, metrics, events, logs).
 *
 * Run via: make telemetry-test  (starts weaver + bridge + services first)
 *
 * Signal coverage:
 *   Spans:  browse_departures, view_departure, place_booking (success + fail),
 *           load_currencies, change_currency, view_information_desk, exhibit.view
 *   Metrics: page_views, bookings (success + failure), exhibit_views, exhibit_dwell_time
 *   Events: booking_completed, booking_failed, exhibit_viewed, exchange_completed
 */
test.describe("Telemetry Coverage", () => {
  // ── 1. Browse departures ────────────────────────────────────────────────
  // Triggers: browse_departures span, page_views counter (departure_list)
  test("browse departures page", async ({ page }) => {
    await page.goto("/departures");
    await expect(page.getByRole("heading", { name: "Departures" })).toBeVisible();
    const cards = page.locator("a:has-text('View Details')");
    await expect(cards.first()).toBeVisible();
    // Stay briefly so the metric export interval can fire
    await page.waitForTimeout(2000);
  });

  // ── 2. View departure detail ────────────────────────────────────────────
  // Triggers: view_departure span, page_views counter (departure_detail)
  test("view departure detail", async ({ page }) => {
    await page.goto("/departures/1");
    await expect(page.getByRole("heading", { name: "Pricing" })).toBeVisible();
    await page.waitForTimeout(2000);
  });

  // ── 3. Place a successful booking ───────────────────────────────────────
  // Triggers: place_booking span, booking_completed event,
  //           bookings counter (success), page_views (departure_detail)
  test("place successful booking", async ({ page }) => {
    await page.goto("/book/1");
    await expect(page.getByText("Book Your Trip")).toBeVisible();

    await page.locator("#passenger-name").fill("Telemetry Tester");
    await page.locator("#seat-class").click();
    await page.getByRole("option", { name: /Economy Cryosleep/i }).click();

    await page.getByRole("button", { name: "Confirm Booking" }).click();
    await page.waitForURL(/\/confirmation\//, { timeout: 10_000 });
    await expect(page.getByText("Booking Confirmed!")).toBeVisible();
    await page.waitForTimeout(2000);
  });

  // ── 4. Place a booking with a different seat class ──────────────────────
  // Triggers: place_booking span with business-warp seat class
  test("place booking with business-warp", async ({ page }) => {
    await page.goto("/book/1");
    await expect(page.getByText("Book Your Trip")).toBeVisible();

    await page.locator("#passenger-name").fill("Business Tester");
    await page.locator("#seat-class").click();
    await page.getByRole("option", { name: /Business Warp/i }).click();

    await page.getByRole("button", { name: "Confirm Booking" }).click();
    await page.waitForURL(/\/confirmation\//, { timeout: 10_000 });
    await expect(page.getByText("Booking Confirmed!")).toBeVisible();
  });

  // ── 5. Place a failed booking (chaos) ──────────────────────────────────
  // Triggers: place_booking span with error, booking_failed event,
  //           bookings counter (failure)
  test("place failed booking via chaos", async ({ page, request }) => {
    await request.post(`${PRICING_SERVICE_URL}/simulate-failure`, {
      data: { count: 1 },
    });

    await page.goto("/book/1");
    await expect(page.getByText("Book Your Trip")).toBeVisible();

    await page.locator("#passenger-name").fill("Unlucky Tester");
    await page.locator("#seat-class").click();
    await page.getByRole("option", { name: /Economy Cryosleep/i }).click();

    await page.getByRole("button", { name: "Confirm Booking" }).click();

    const alert = page.locator("[role='alert']");
    await expect(alert).toBeVisible({ timeout: 10_000 });
    await expect(alert).toContainText(/failed|error/i);
    await page.waitForTimeout(2000);
  });

  // ── 6. Information Desk page ────────────────────────────────────────────
  // Triggers: view_information_desk span, exhibit.view spans,
  //           exhibit_viewed events, exhibit_views counter,
  //           exhibit_dwell_time histogram, page_views (information_desk)
  test("information desk with exhibit scrolling", async ({ page }) => {
    await page.goto("/information");

    // Wait for page content
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 10_000 });

    // Scroll through the page to trigger exhibit IntersectionObserver
    await page.evaluate(async () => {
      const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const step = window.innerHeight / 2;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await delay(800); // dwell for exhibit_dwell_time histogram
      }
      // Scroll back to top to trigger "leave viewport" for dwell tracking
      window.scrollTo(0, 0);
      await delay(1000);
    });

    await page.waitForTimeout(2000);
  });

  // ── 7. Currency switcher ────────────────────────────────────────────────
  // Triggers: change_currency span, exchange_completed event,
  //           load_currencies span (on initial load)
  test("switch currency", async ({ page }) => {
    // Navigate to a page inside the App layout (which renders the SelectTrigger)
    await page.goto("/departures/1");
    await expect(page.getByRole("heading", { name: "Pricing" })).toBeVisible();

    // The currency switcher is a Radix Select with width w-36 in the header
    const trigger = page.locator('[class*="w-36"]').first();
    await trigger.waitFor({ state: "visible", timeout: 5000 });
    await trigger.click();

    // Pick "REP" (Republic Credits) — a valid fictional currency
    await page.getByRole("option", { name: /REP/i }).click();
    await page.waitForTimeout(2000);

    // Reset back to UNC to avoid affecting later tests
    await trigger.click();
    await page.getByRole("option", { name: /UNC/i }).click();
    await page.waitForTimeout(1000);

    // Visit currencies page — also triggers load_currencies span (if not already cached)
    await page.goto("/currencies");
    await page.waitForTimeout(2000);
  });

  // ── 8. Final flush ─────────────────────────────────────────────────────
  // Give the batch span/metric processors time to export.
  // The metric export interval is 15s — this test needs a longer timeout.
  test("flush telemetry", async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto("/departures");
    // BatchSpanProcessor delay is 500ms, metric export interval is 15s
    await page.waitForTimeout(16_000);
  });
});
