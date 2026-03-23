import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { tracer, logger, bookingCounter, tracedFetch, SeverityNumber } from "@/instrumentation";
import { SpanStatusCode, trace, context } from "@opentelemetry/api";
import {
  SPACEPORT_BOOKING_ID,
  SPACEPORT_DEPARTURE_ID,
  SPACEPORT_SEAT_CLASS,
} from "@/semconv/attribute";
import { startSpaceportUserPlaceBooking } from "@/semconv/span";

const SEAT_CLASSES = ["economy-cryosleep", "business-warp", "first-class-nebula"];

export function ChaosMenu() {
  const [status, setStatus] = useState<string | null>(null);

  async function trigger(endpoint: string, body: object, label: string, successMsg?: string) {
    setStatus(`${label}…`);
    try {
      const resp = await fetch(`/chaos/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setStatus(successMsg ?? `${label} ✓`);
    } catch {
      setStatus(`${label} failed`);
    }
    setTimeout(() => setStatus(null), successMsg ? 4000 : 2000);
  }

  async function triggerApi(endpoint: string, body: object, label: string, successMsg?: string) {
    setStatus(`${label}…`);
    try {
      const resp = await fetch(`/api-chaos/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setStatus(successMsg ?? `${label} ✓`);
    } catch {
      setStatus(`${label} failed`);
    }
    setTimeout(() => setStatus(null), successMsg ? 4000 : 2000);
  }

  /** Fire N instrumented booking requests, recording metrics/traces/logs. */
  async function fireBookings(count: number) {
    for (let i = 0; i < count; i++) {
      const departureId = String(((i % 4) + 1));
      const seatClass = SEAT_CLASSES[i % SEAT_CLASSES.length];
      const span = startSpaceportUserPlaceBooking(tracer, departureId, seatClass);
      const ctx = trace.setSpan(context.active(), span);

      try {
        const resp = await tracedFetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            departure_id: Number(departureId),
            passenger_name: `Chaos Pilot ${i + 1}`,
            seat_class: seatClass,
            cryosleep_enabled: false,
            extra_baggage: 0,
            currency: "UNC",
          }),
        }, ctx);

        if (!resp.ok) {
          const rawText = await resp.text().catch(() => "");
          let body: Record<string, unknown> | null = null;
          try { body = JSON.parse(rawText); } catch { /* non-JSON */ }
          const errorDetail = (typeof body?.error === "string" ? body.error : "") || rawText || `HTTP ${resp.status}`;

          span.setStatus({ code: SpanStatusCode.ERROR, message: `Booking failed (HTTP ${resp.status})` });
          span.addEvent("booking_failed", {
            "error.message": `Booking failed (HTTP ${resp.status})`,
            "http.response.status_code": resp.status,
            "http.response.error": errorDetail,
          });
          span.end();

          bookingCounter.add(1, "failure", { spaceport_seat_class: seatClass });
          logger.emit({
            severityNumber: SeverityNumber.ERROR,
            body: `Chaos booking failed: HTTP ${resp.status}`,
            attributes: {
              [SPACEPORT_DEPARTURE_ID]: departureId,
              [SPACEPORT_SEAT_CLASS]: seatClass,
              "http.response.status_code": resp.status,
              "http.response.error": errorDetail,
              "chaos": true,
            },
          });
        } else {
          const data = await resp.json();
          span.addEvent("booking_completed", { [SPACEPORT_BOOKING_ID]: data.booking_id });
          span.end();
          bookingCounter.add(1, "success", { spaceport_seat_class: seatClass });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        span.setStatus({ code: SpanStatusCode.ERROR, message });
        span.end();
        bookingCounter.add(1, "failure", { spaceport_seat_class: seatClass });
      }
    }
  }

  /** Raw chaos POST — no status updates, for use inside scenarios. */
  async function injectChaos(endpoint: string, body: object) {
    const resp = await fetch(`/chaos/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error(`Chaos inject ${endpoint}: HTTP ${resp.status}`);
  }

  async function scenario(label: string, setup: () => Promise<void>, bookings: number, successMsg: string) {
    setStatus(`${label}…`);
    try {
      await setup();
      await fireBookings(bookings);
      setStatus(successMsg);
    } catch {
      setStatus(`${label} failed`);
    }
    setTimeout(() => setStatus(null), 4000);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
          {status ?? "⚡ Chaos"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Error Injection</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => trigger("simulate-failure", { count: 1 }, "1 failure")}>
          Fail next request
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => trigger("simulate-failure", { count: 3 }, "3 failures", "For a moment, nothing happened. Then, after a second or so, nothing continued to happen")}>
          Fail next 3 requests
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Latency Injection</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => trigger("simulate-latency", { count: 1, latency_ms: 2000 }, "2s latency ×1")}>
          2s latency — next request
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => trigger("simulate-latency", { count: 5, latency_ms: 2000 }, "2s latency ×5")}>
          2s latency — next 5 requests
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>CORS Injection</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => triggerApi("simulate-cors-block", { count: 1 }, "CORS block ×1", "Next API request will be rejected with 403 Forbidden")}>
          Block next request (CORS 403)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => triggerApi("simulate-cors-block", { count: 3 }, "CORS block ×3", "Next 3 API requests will be rejected with 403 Forbidden")}>
          Block next 3 requests (CORS 403)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Dashboard Scenarios</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => scenario(
          "Booking failures",
          () => injectChaos("simulate-failure", { count: 5 }),
          5,
          "5 failed bookings → Booking Failure Rate panel"
        )}>
          Booking failure rate ×5
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => scenario(
          "Pricing failures",
          () => injectChaos("simulate-failure", { count: 5 }),
          5,
          "5 pricing errors → Pricing Failures panel"
        )}>
          Pricing failure spike ×5
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => scenario(
          "Pricing latency",
          () => injectChaos("simulate-latency", { count: 5, latency_ms: 3000 }),
          5,
          "5 slow bookings → Pricing Latency panel"
        )}>
          Pricing latency spike ×5
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => scenario(
          "Mixed chaos",
          async () => {
            await injectChaos("simulate-failure", { count: 3 });
            await injectChaos("simulate-latency", { count: 3, latency_ms: 2000 });
          },
          6,
          "3 failures + 3 slow → all panels light up"
        )}>
          Mixed chaos ×6
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
