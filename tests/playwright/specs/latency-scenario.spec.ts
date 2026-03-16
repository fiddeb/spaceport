import { test, expect } from "@playwright/test";

const PRICING_SERVICE_URL =
  process.env.PRICING_SERVICE_URL ?? "http://localhost:8000";

test.describe("Latency Scenario", () => {
  test("should observe slow response when latency is injected", async ({ page, request }) => {
    // Inject 2 seconds of latency for the next request
    await request.post(`${PRICING_SERVICE_URL}/simulate-latency`, {
      data: { count: 1, latency_ms: 2000 },
    });

    const start = Date.now();

    // Navigate to departure detail — this triggers a pricing call
    await page.goto("/departures/1");

    // Wait for the pricing section to fully load
    await expect(page.getByRole("heading", { name: "Pricing" })).toBeVisible({
      timeout: 15_000,
    });

    const elapsed = Date.now() - start;

    // The page load should have taken at least 1500ms due to the injected latency
    expect(elapsed).toBeGreaterThan(1500);
  });
});
