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
import { tracer, logger, meter, SeverityNumber } from "@/instrumentation";
import { SpanStatusCode } from "@opentelemetry/api";
import { useCurrency } from "@/contexts/CurrencyContext";

const bookingCounter = meter.createCounter("spaceport.frontend.bookings", {
  description: "Booking attempts by outcome",
});

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

    const span = tracer.startSpan("user.place_booking", {
      attributes: {
        "spaceport.departure.id": id ?? "",
        "spaceport.seat.class": seatClass,
      },
    });

    try {
      const resp = await fetch("/api/bookings", {
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
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => null);
        throw new Error(body?.error ?? `Booking failed (HTTP ${resp.status})`);
      }

      const data = await resp.json();
      span.addEvent("booking_completed", {
        "spaceport.booking.id": data.booking_id,
      });
      span.end();

      bookingCounter.add(1, { outcome: "success", "spaceport.seat.class": seatClass });
      logger.emit({
        severityNumber: SeverityNumber.INFO,
        body: `Booking created: ${data.booking_id}`,
        attributes: { "spaceport.booking.id": data.booking_id, "spaceport.departure.id": id ?? "" },
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
      const message = err instanceof Error ? err.message : "Unknown error";
      span.setStatus({ code: SpanStatusCode.ERROR, message });
      span.addEvent("booking_failed");
      span.end();

      bookingCounter.add(1, { outcome: "failure", "spaceport.seat.class": seatClass });
      logger.emit({
        severityNumber: SeverityNumber.ERROR,
        body: `Booking failed: ${message}`,
        attributes: { "spaceport.departure.id": id ?? "" },
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
