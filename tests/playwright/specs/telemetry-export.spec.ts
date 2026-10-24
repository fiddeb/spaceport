import { test, expect } from "@playwright/test";

test("exports all telemetry signals and propagates trace context", async ({ page }) => {
  test.setTimeout(30_000);
  const exported = new Set<string>();

  // A local OTLP response keeps this SDK compatibility check independent of a collector.
  await page.route("**/otlp/v1/*", async (route) => {
    const signal = new URL(route.request().url()).pathname.split("/").pop()!;
    const resourceKeys: Record<string, string> = {
      traces: "resourceSpans",
      logs: "resourceLogs",
      metrics: "resourceMetrics",
    };
    const resourceKey = resourceKeys[signal];
    expect(resourceKey).toBeDefined();
    const payload = route.request().postDataJSON();
    expect(payload[resourceKey!].length).toBeGreaterThan(0);
    expect(payload[resourceKey!][0].resource.attributes).toContainEqual({
      key: "service.name",
      value: { stringValue: "spaceport-frontend" },
    });
    exported.add(signal);
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  const request = page.waitForRequest((r) => new URL(r.url()).pathname === "/api/departures");
  await page.goto("/departures");
  expect((await request).headers()["traceparent"]).toMatch(/^00-[a-f0-9]{32}-[a-f0-9]{16}-0[01]$/);
  await expect(page.locator("a:has-text('View Details')").first()).toBeVisible();

  // The application's metric export interval is 15 seconds.
  await expect.poll(() => [...exported].sort(), { timeout: 20_000 }).toEqual([
    "logs", "metrics", "traces",
  ]);
});
