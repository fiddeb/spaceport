import { test, expect } from "@playwright/test";

test.describe("Place Booking", () => {
  test("should complete a booking and reach confirmation page", async ({ page }) => {
    await page.goto("/book/1");

    await expect(page.getByText("Book Your Trip")).toBeVisible();

    // Fill passenger name
    await page.locator("#passenger-name").fill("Test Traveler");

    // Open seat class select (Radix UI select)
    await page.locator("#seat-class").click();
    await page.getByRole("option", { name: /Economy Cryosleep/i }).click();

    // Submit the form
    await page.getByRole("button", { name: "Confirm Booking" }).click();

    // Wait for navigation to confirmation page
    await page.waitForURL(/\/confirmation\//, { timeout: 10_000 });

    // Assert confirmation content
    await expect(page.getByText("Booking Confirmed!")).toBeVisible();
    await expect(page.getByText("Booking ID")).toBeVisible();
  });
});
