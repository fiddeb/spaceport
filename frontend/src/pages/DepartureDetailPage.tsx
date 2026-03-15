import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useSpan } from "@/hooks/useSpan";
import { useCurrency } from "@/contexts/CurrencyContext";
import { logger, meter, SeverityNumber } from "@/instrumentation";
import { context } from "@opentelemetry/api";

const pageViewCounter = meter.createCounter("spaceport.frontend.page_views", {
  description: "Page views by page name",
});

interface Departure {
  id: number;
  destination: string;
  departure_time: string;
  description: string;
  seat_classes: string[];
  available_seats: number;
}

interface PriceEntry {
  seat_class: string;
  base_price: number;
  demand_multiplier: number;
  total_price: number;
  currency: string;
}

interface Recommendation {
  departure_id: number;
  destination: string;
  reason: string;
}

interface DetailResponse {
  departure: Departure;
  pricing: { departure_id: number; prices: PriceEntry[] };
  recommendations: { departure_id: number; recommendations: Recommendation[] };
}

export function DepartureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { convert } = useCurrency();

  const { contextRef } = useSpan("user.view_departure", {
    "spaceport.departure.id": id ?? "",
    "spaceport.departure.destination": data?.departure.destination ?? "",
  });

  useEffect(() => {
    pageViewCounter.add(1, { "page.name": "departure_detail" });
    logger.emit({
      severityNumber: SeverityNumber.INFO,
      body: `User viewing departure ${id}`,
      attributes: { "spaceport.departure.id": id ?? "" },
    });
  }, [id]);

  useEffect(() => {
    context.with(contextRef.current, () => fetch(`/api/departures/${id}`))
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-6 w-3/4" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-destructive">
          {error ?? "Departure not found"}
        </p>
        <Button asChild>
          <Link to="/departures">Back to Departures</Link>
        </Button>
      </div>
    );
  }

  const { departure, pricing } = data;
  const recs = data.recommendations.recommendations ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/departures">← Back to Departures</Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {departure.destination}
        </h1>
        <p className="text-muted-foreground">
          Departure: {new Date(departure.departure_time).toLocaleString()}
        </p>
        <p className="mt-2 text-muted-foreground">{departure.description}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {departure.available_seats} seats remaining
        </p>
      </div>

      <Separator />

      <div>
        <h2 className="mb-4 text-xl font-semibold">Pricing</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pricing.prices.map((p) => (
            <Card key={p.seat_class}>
              <CardHeader>
                <CardTitle className="text-lg">{p.seat_class}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">
                    {convert(p.total_price)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Base: {convert(p.base_price)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <Button size="lg" asChild>
          <Link to={`/book/${departure.id}`}>Book Now</Link>
        </Button>
      </div>

      {recs.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="mb-4 text-xl font-semibold">
              You might also enjoy
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recs.map((rec) => (
                <Card key={rec.departure_id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {rec.destination}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {rec.reason}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="mt-2"
                    >
                      <Link to={`/departures/${rec.departure_id}`}>View →</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
