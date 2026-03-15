import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useSpan } from "@/hooks/useSpan";
import { logger, meter, SeverityNumber } from "@/instrumentation";

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

export function DepartureListPage() {
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useSpan("user.browse_departures");

  useEffect(() => {
    pageViewCounter.add(1, { "page.name": "departure_list" });
    logger.emit({ severityNumber: SeverityNumber.INFO, body: "User viewing departure list" });
  }, []);

  useEffect(() => {
    fetch("/api/departures")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setDepartures(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-destructive">Failed to load departures: {error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Departures</h1>
        <p className="text-muted-foreground">
          Choose your next interstellar voyage. Snacks not included beyond lunar orbit.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-28" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departures.map((d) => (
            <Card key={d.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{d.destination}</CardTitle>
                <CardDescription>
                  {new Date(d.departure_time).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {d.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {d.seat_classes.map((sc) => (
                    <Badge key={sc} variant="secondary">
                      {sc}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {d.available_seats} seats available
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild>
                  <Link to={`/departures/${d.id}`}>View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
