import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { tracer, logger, bookingCounter, SeverityNumber, tracedFetch } from "@/instrumentation";
import { SpanStatusCode, trace, context } from "@opentelemetry/api";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  SPACEPORT_BOOKING_ID,
  SPACEPORT_DEPARTURE_ID,
  SPACEPORT_SEAT_CLASS,
} from "@/semconv/attribute";
import { startSpaceportUserPlaceBookingInternal } from "@/semconv/span";

type BookingRequestError = Error & {
  httpStatus?: number;
  responseBody?: Record<string, unknown> | null;
  rawBody?: string;
  errorDetail?: string;
  bookingId?: string | number;
};

const SEAT_CLASSES = [
  { value: "economy-cryosleep", label: "Economy Cryosleep — Sleep through the boring parts" },
  { value: "business-warp", label: "Business Warp — Window Seat With Cosmic Radiation Disclaimer" },
  { value: "first-class-nebula", label: "First-Class Nebula — Unlimited champagne past the asteroid belt" },
];

export function BookingFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedCurrency } = useCurrency();
  const [passengerName, setPassengerName] = useState("");
  const [seatClass, setSeatClass] = useState("");
  const [cryosleep, setCryosleep] = useState(false);
  const [extraBaggage, setExtraBaggage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const span = startSpaceportUserPlaceBookingInternal(tracer, id ?? "", seatClass);
    const ctx = trace.setSpan(context.active(), span);

    try {
      const resp = await tracedFetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departure_id: Number(id),
          passenger_name: passengerName,
          seat_class: seatClass,
          cryosleep_enabled: cryosleep,
          extra_baggage: extraBaggage ? 1 : 0,
          currency: selectedCurrency,
        }),
      }, ctx);

      if (!resp.ok) {
        const rawText = await resp.text().catch(() => "");
        let body: Record<string, unknown> | null = null;
        try { body = JSON.parse(rawText); } catch { /* non-JSON body */ }
        const bodyError = typeof body?.error === "string" ? body.error : "";
        const errorDetail = bodyError || rawText || `HTTP ${resp.status}`;
        const bookingId = body?.booking_id;
        const bookingErr: BookingRequestError = new Error(`Booking failed (HTTP ${resp.status})`);
        bookingErr.httpStatus = resp.status;
        bookingErr.responseBody = body;
        bookingErr.rawBody = rawText;
        bookingErr.errorDetail = errorDetail;
        if (typeof bookingId === "string" || typeof bookingId === "number") {
          bookingErr.bookingId = bookingId;
        }
        throw bookingErr;
      }

      const data = await resp.json();
      span.addEvent("booking_completed", {
        [SPACEPORT_BOOKING_ID]: data.booking_id,
      });
      span.end();

      const okSpanCtx = span.spanContext();
      bookingCounter.add(1, "success", { spaceport_seat_class: seatClass });
      logger.emit({
        severityNumber: SeverityNumber.INFO,
        body: `Booking created: ${data.booking_id}`,
        attributes: {
          [SPACEPORT_BOOKING_ID]: data.booking_id,
          [SPACEPORT_DEPARTURE_ID]: id ?? "",
          [SPACEPORT_SEAT_CLASS]: seatClass,
          "spaceport.booking.currency": data.currency,
          "spaceport.booking.total_price": data.total_price,
          "trace_id": okSpanCtx.traceId,
          "span_id": okSpanCtx.spanId,
        },
      });

      navigate(`/confirmation/${data.booking_id}`, {
        state: {
          bookingId: data.booking_id,
          totalPrice: data.total_price,
          currency: data.currency,
          departureId: id,
          seatClass,
          passengerName,
        },
      });
    } catch (err) {
      const bookingErr = err as BookingRequestError;
      const message = err instanceof Error ? err.message : "Unknown error";
      const httpStatus = bookingErr.httpStatus;
      const serverBookingId = bookingErr.bookingId;

      const rawBody = bookingErr.rawBody;
      const errorDetail = bookingErr.errorDetail;
      span.setStatus({ code: SpanStatusCode.ERROR, message });
      span.addEvent("booking_failed", {
        "error.message": message,
        ...(httpStatus && { "http.response.status_code": httpStatus }),
        ...(errorDetail && { "http.response.error": errorDetail }),
        ...(rawBody && { "http.response.body": rawBody }),
      });
      span.end();

      bookingCounter.add(1, "failure", { spaceport_seat_class: seatClass });
      const errSpanCtx = span.spanContext();
      logger.emit({
        severityNumber: SeverityNumber.ERROR,
        body: `Booking failed: ${message}`,
        attributes: {
          [SPACEPORT_DEPARTURE_ID]: id ?? "",
          [SPACEPORT_SEAT_CLASS]: seatClass,
          "spaceport.booking.currency": selectedCurrency,
          "spaceport.passenger.name": passengerName,
          ...(httpStatus && { "http.response.status_code": httpStatus }),
          ...(errorDetail && { "http.response.error": errorDetail }),
          ...(rawBody && { "http.response.body": rawBody }),
          ...(serverBookingId && { [SPACEPORT_BOOKING_ID]: serverBookingId }),
          "error.type": err instanceof Error ? err.name : "Unknown",
          "trace_id": errSpanCtx.traceId,
          "span_id": errSpanCtx.spanId,
        },
      });

      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Book Your Trip</CardTitle>
          <CardDescription>
            Snacks not included beyond lunar orbit. Please pack accordingly.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="passenger-name">Passenger Name</Label>
              <Input
                id="passenger-name"
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                placeholder="Commander Starblast"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="seat-class">Seat Class</Label>
              <Select value={seatClass} onValueChange={setSeatClass} required>
                <SelectTrigger id="seat-class">
                  <SelectValue placeholder="Select your travel class" />
                </SelectTrigger>
                <SelectContent>
                  {SEAT_CLASSES.map((sc) => (
                    <SelectItem key={sc.value} value={sc.value}>
                      {sc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="cryosleep">Enable Cryosleep</Label>
              <Switch
                id="cryosleep"
                checked={cryosleep}
                onCheckedChange={setCryosleep}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="extra-baggage">Extra Baggage (1 stellar crate)</Label>
              <Switch
                id="extra-baggage"
                checked={extraBaggage}
                onCheckedChange={setExtraBaggage}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={submitting || !passengerName || !seatClass}
            >
              {submitting ? "Launching Booking..." : "Confirm Booking"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
