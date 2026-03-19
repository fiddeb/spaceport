import { useEffect, useRef, useState, useCallback } from "react";
import { exhibits } from "@/data/informationDesk";
import { ExhibitNav } from "@/components/information/ExhibitNav";
import { ExhibitPanel } from "@/components/information/ExhibitPanel";
import { useSpan } from "@/hooks/useSpan";
import {
  tracer,
  logger,
  meter,
  SeverityNumber,
} from "@/instrumentation";
import { SpanStatusCode } from "@opentelemetry/api";

// Metrics — reuse the existing page_views counter, add exhibit-specific ones
const pageViewCounter = meter.createCounter("spaceport.frontend.page_views", {
  description: "Page views by page name",
});
const exhibitViewCounter = meter.createCounter(
  "spaceport.frontend.exhibit_views",
  { description: "Exhibits scrolled into view" },
);
const exhibitDwellHistogram = meter.createHistogram(
  "spaceport.frontend.exhibit_dwell_time",
  { description: "Seconds an exhibit was in the viewport", unit: "s" },
);

export function InformationDeskPage() {
  const [activeId, setActiveId] = useState<string | null>(
    exhibits[0]?.id ?? null,
  );

  // --- Telemetry: page-level span ---
  const { spanRef } = useSpan("user.view_information_desk", {
    "spaceport.exhibit.count": exhibits.length,
  });

  // Track which exhibits have been seen (to avoid duplicate counter bumps)
  const seenExhibits = useRef(new Set<string>());
  // Track dwell time per exhibit
  const dwellStart = useRef<Map<string, number>>(new Map());

  // Record page view once on mount
  useEffect(() => {
    pageViewCounter.add(1, { "page.name": "information_desk" });
    logger.emit({
      severityNumber: SeverityNumber.INFO,
      body: "User viewing information desk",
    });
  }, []);

  // Track which section is in view via IntersectionObserver
  const sectionRefs = useRef<Map<string, IntersectionObserverEntry>>(new Map());

  const updateActive = useCallback(() => {
    let best: string | null = null;
    let bestRatio = -1;

    for (const [id, entry] of sectionRefs.current) {
      if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
        bestRatio = entry.intersectionRatio;
        best = id;
      }
    }
    if (!best) {
      let closestDist = Infinity;
      for (const [id, entry] of sectionRefs.current) {
        const dist = Math.abs(entry.boundingClientRect.top);
        if (dist < closestDist) {
          closestDist = dist;
          best = id;
        }
      }
    }
    if (best) setActiveId(best);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          sectionRefs.current.set(id, entry);

          // --- Telemetry: exhibit enters/leaves viewport ---
          if (entry.isIntersecting) {
            if (!dwellStart.current.has(id)) {
              dwellStart.current.set(id, performance.now());
            }

            if (!seenExhibits.current.has(id)) {
              seenExhibits.current.add(id);
              const exhibit = exhibits.find((e) => e.id === id);
              const title = exhibit?.title ?? id;

              exhibitViewCounter.add(1, {
                "spaceport.exhibit.id": id,
                "spaceport.exhibit.title": title,
              });
              spanRef.current?.addEvent("exhibit_viewed", {
                "spaceport.exhibit.id": id,
                "spaceport.exhibit.title": title,
                "spaceport.exhibit.number": exhibit?.number ?? 0,
              });
              logger.emit({
                severityNumber: SeverityNumber.INFO,
                body: `Exhibit viewed: ${title}`,
                attributes: { "spaceport.exhibit.id": id },
              });
            }
          } else {
            // Exhibit left viewport — record dwell time
            const start = dwellStart.current.get(id);
            if (start) {
              const dwell = (performance.now() - start) / 1000;
              dwellStart.current.delete(id);
              exhibitDwellHistogram.record(dwell, {
                "spaceport.exhibit.id": id,
              });
            }
          }
        }
        updateActive();
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.1, 0.5, 1] },
    );

    for (const exhibit of exhibits) {
      const el = document.getElementById(exhibit.id);
      if (el) observer.observe(el);
    }

    return () => {
      observer.disconnect();
      // Flush remaining dwell times on unmount
      for (const [id, start] of dwellStart.current) {
        const dwell = (performance.now() - start) / 1000;
        exhibitDwellHistogram.record(dwell, {
          "spaceport.exhibit.id": id,
        });
      }
      dwellStart.current.clear();
    };
  }, [updateActive, spanRef]);

  // Enable snap-scrolling on the document while this page is mounted
  useEffect(() => {
    document.documentElement.style.scrollSnapType = "y proximity";
    return () => {
      document.documentElement.style.scrollSnapType = "";
    };
  }, []);

  return (
    <div className="mx-auto flex max-w-7xl flex-col px-6 pt-14">
      {/* Page header — also a snap section */}
      <header className="flex min-h-[calc(100vh-3.5rem)] snap-start flex-col justify-center py-16">
        <p className="mb-2 font-mono text-xs tracking-widest text-primary/60 uppercase">
          Information Desk
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          Traveller's Guide to{" "}
          <span className="text-primary">Observability</span>
        </h1>
        <p className="mt-4 max-w-[60ch] text-lg text-muted-foreground">
          Everything you need to understand OpenTelemetry, semantic conventions,
          and modern observability — from first principles to hands-on
          experimentation.
        </p>
        <p className="mt-8 font-mono text-xs text-muted-foreground/50">
          Scroll to begin &darr;
        </p>
      </header>

      {/* Two-column layout: nav (desktop) + snapping content */}
      <div className="flex gap-10">
        {/* Sticky side nav — hidden on mobile */}
        <aside className="hidden shrink-0 lg:block lg:w-56">
          <div className="sticky top-[4.5rem]">
            <ExhibitNav exhibits={exhibits} activeId={activeId} />
          </div>
        </aside>

        {/* Mobile topic selector — fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/90 px-4 py-2 backdrop-blur-sm lg:hidden">
          <select
            value={activeId ?? ""}
            onChange={(e) => {
              const el = document.getElementById(e.target.value);
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            {exhibits.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {String(ex.number).padStart(2, "0")} — {ex.title}
              </option>
            ))}
          </select>
        </div>

        {/* Exhibit panels */}
        <div className="min-w-0 flex-1">
          {exhibits.map((exhibit) => (
            <ExhibitPanel key={exhibit.id} exhibit={exhibit} />
          ))}

          {/* Footer marker */}
          <div className="flex min-h-[40vh] snap-start items-center justify-center border-t border-border text-sm text-muted-foreground">
            End of exhibits — More content added each release
          </div>
        </div>
      </div>
    </div>
  );
}
