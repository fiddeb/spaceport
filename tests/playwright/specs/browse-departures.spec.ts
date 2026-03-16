import { test, expect } from "@playwright/test";

test.describe("Browse Departures", () => {
  test("should display departure cards on the home page", async ({ page }) => {
    await page.goto("/departures");

    await expect(page.getByRole("heading", { name: "Departures" })).toBeVisible();

    // Wait for at least one departure card to load (skeleton replaced by real content)
    const cards = page.locator("a:has-text('View Details')");
    await expect(cards.first()).toBeVisible();

    // At least one card rendered
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
  });

  test("should show Mars as a destination", async ({ page }) => {
    await page.goto("/departures");

    await expect(page.getByText("Mars")).toBeVisible();
  });
});
