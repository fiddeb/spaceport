import { test, expect } from "@playwright/test";

test.describe("View Departure", () => {
  test("should display pricing section for departure 1", async ({ page }) => {
    await page.goto("/departures/1");

    // Wait for prices to load
    await expect(page.getByRole("heading", { name: "Pricing" })).toBeVisible();

    // At least one price value is rendered (text-primary bold spans)
    const priceValues = page.locator("span.text-primary");
    await expect(priceValues.first()).toBeVisible();
    expect(await priceValues.count()).toBeGreaterThanOrEqual(1);
  });

  test("should show Book Now button", async ({ page }) => {
    await page.goto("/departures/1");

    await expect(page.getByRole("heading", { name: "Pricing" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Book Now" })).toBeVisible();
  });
});
