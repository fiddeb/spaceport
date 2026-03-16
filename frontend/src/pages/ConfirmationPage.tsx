import { Link, useParams, useLocation } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LocationState {
  bookingId: string;
  totalPrice: number;
  currency: string;
  departureId: string;
  seatClass: string;
  passengerName: string;
}

export function ConfirmationPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const location = useLocation();
  const state = location.state as LocationState | null;

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <div className="mb-2 text-center text-5xl">🚀</div>
          <CardTitle className="text-center text-2xl">
            Booking Confirmed!
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-md bg-muted p-4">
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Booking ID</dt>
                <dd className="font-mono text-foreground">
                  {bookingId ?? state?.bookingId ?? "—"}
                </dd>
              </div>
              {state?.passengerName && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Passenger</dt>
                  <dd className="text-foreground">{state.passengerName}</dd>
                </div>
              )}
              {state?.seatClass && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Seat Class</dt>
                  <dd className="text-foreground">{state.seatClass}</dd>
                </div>
              )}
              {state?.totalPrice != null && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Total Price</dt>
                  <dd className="font-semibold text-primary">
                    {state.totalPrice.toFixed(2)} {state.currency || "UNC"}
                  </dd>
                </div>
              )}
            </dl>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Please arrive at the launch pad 2 hours before departure.
            Window Seat With Cosmic Radiation Disclaimer passengers: sign the waiver at Gate 7.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link to="/departures">Book Another Trip</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
