import { test, expect } from "@playwright/test";

const PRICING_SERVICE_URL =
  process.env.PRICING_SERVICE_URL ?? "http://localhost:8000";

test.describe("Error Scenario", () => {
  test("should display error when pricing service fails", async ({ page, request }) => {
    // Activate simulated failure in the pricing service
    await request.post(`${PRICING_SERVICE_URL}/simulate-failure`, {
      data: { count: 1 },
    });

    await page.goto("/book/1");

    await expect(page.getByText("Book Your Trip")).toBeVisible();

    // Fill form
    await page.locator("#passenger-name").fill("Unlucky Passenger");
    await page.locator("#seat-class").click();
    await page.getByRole("option", { name: /Economy Cryosleep/i }).click();

    // Submit — should trigger the simulated failure
    await page.getByRole("button", { name: "Confirm Booking" }).click();

    // Assert error message is shown in the UI
    const alert = page.locator("[role='alert']");
    await expect(alert).toBeVisible({ timeout: 10_000 });
    await expect(alert).toContainText(/failed|error/i);
  });
});
