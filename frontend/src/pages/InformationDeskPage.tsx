import { useEffect, useRef, useState, useCallback } from "react";
import { exhibits, pageConfig } from "@/data/informationDesk";
import { ExhibitNav } from "@/components/information/ExhibitNav";
import { ExhibitPanel } from "@/components/information/ExhibitPanel";
import { useSpan } from "@/hooks/useSpan";
import {
  tracer,
  logger,
  pageViewCounter,
  exhibitViewCounter,
  exhibitDwellHistogram,
  SeverityNumber,
} from "@/instrumentation";
import {
  SPACEPORT_EXHIBIT_ID,
  SPACEPORT_EXHIBIT_TITLE,
  SPACEPORT_EXHIBIT_NUMBER,
} from "@/semconv/attribute";
import {
  SPAN_SPACEPORT_USER_VIEW_INFORMATION_DESK_NAME,
  SPAN_SPACEPORT_EXHIBIT_VIEW_NAME,
} from "@/semconv/span";
import type { Span } from "@opentelemetry/api";

// Metrics — instantiated once in instrumentation.ts, imported here

export function InformationDeskPage() {
  const [activeId, setActiveId] = useState<string | null>(
    exhibits[0]?.id ?? null,
  );

  // --- Telemetry: page-level span ---
  const { spanRef } = useSpan(SPAN_SPACEPORT_USER_VIEW_INFORMATION_DESK_NAME, {
    "spaceport.exhibit.count": exhibits.length,
  });

  // Track which exhibits have been seen (to avoid duplicate counter bumps)
  const seenExhibits = useRef(new Set<string>());
  // Track dwell time per exhibit
  const dwellStart = useRef<Map<string, number>>(new Map());
  // Active exhibit spans — linked to the page span, ended when exhibit leaves viewport
  const exhibitSpans = useRef<Map<string, Span>>(new Map());

  // Record page view once on mount
  useEffect(() => {
    pageViewCounter.add(1, "information_desk");
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

            // Start a linked span for this exhibit view
            if (!exhibitSpans.current.has(id)) {
              const exhibit = exhibits.find((e) => e.id === id);
              const title = exhibit?.title ?? id;
              const pageSpanCtx = spanRef.current?.spanContext();

              const exhibitSpan = tracer.startSpan(SPAN_SPACEPORT_EXHIBIT_VIEW_NAME, {
                attributes: {
                  [SPACEPORT_EXHIBIT_ID]: id,
                  [SPACEPORT_EXHIBIT_TITLE]: title,
                  [SPACEPORT_EXHIBIT_NUMBER]: exhibit?.number ?? 0,
                },
                // Link back to the page session span — shows relation
                // without making this a child span
                links: pageSpanCtx
                  ? [{ context: pageSpanCtx }]
                  : [],
              });
              exhibitSpans.current.set(id, exhibitSpan);
            }

            if (!seenExhibits.current.has(id)) {
              seenExhibits.current.add(id);
              const exhibit = exhibits.find((e) => e.id === id);
              const title = exhibit?.title ?? id;

              exhibitViewCounter.add(1, id, { spaceport_exhibit_title: title });
              spanRef.current?.addEvent("exhibit_viewed", {
                [SPACEPORT_EXHIBIT_ID]: id,
                [SPACEPORT_EXHIBIT_TITLE]: title,
                [SPACEPORT_EXHIBIT_NUMBER]: exhibit?.number ?? 0,
              });
              logger.emit({
                severityNumber: SeverityNumber.INFO,
                body: `Exhibit viewed: ${title}`,
                attributes: { [SPACEPORT_EXHIBIT_ID]: id },
              });
            }
          } else {
            // Exhibit left viewport — end the linked span and record dwell time
            const exhibitSpan = exhibitSpans.current.get(id);
            if (exhibitSpan) {
              exhibitSpan.end();
              exhibitSpans.current.delete(id);
            }

            const start = dwellStart.current.get(id);
            if (start) {
              const dwell = (performance.now() - start) / 1000;
              dwellStart.current.delete(id);
              exhibitDwellHistogram.record(dwell, id);
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
      // End any still-active exhibit spans
      for (const [, span] of exhibitSpans.current) {
        span.end();
      }
      exhibitSpans.current.clear();
      // Flush remaining dwell times on unmount
      for (const [id, start] of dwellStart.current) {
        const dwell = (performance.now() - start) / 1000;
        exhibitDwellHistogram.record(dwell, id);
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
          {pageConfig.label}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {pageConfig.title.split(/\*(.*?)\*/).map((part, i) =>
            i % 2 === 1 ? (
              <span key={i} className="text-primary">{part}</span>
            ) : (
              <span key={i}>{part}</span>
            ),
          )}
        </h1>
        <p className="mt-4 max-w-[60ch] text-lg text-muted-foreground">
          {pageConfig.subtitle}
        </p>
        {/* Cover image */}
        {pageConfig.coverImage && (
          <div className="mt-8 max-w-2xl overflow-hidden border border-border">
            <img
              src={pageConfig.coverImage}
              alt={pageConfig.coverImageAlt ?? ""}
              className="w-full object-cover"
            />
          </div>
        )}
        <p className="mt-8 font-mono text-xs text-muted-foreground/50">
          {pageConfig.scrollHint}
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

          {/* Closing slide */}
          <div className="flex min-h-[calc(100vh-3.5rem)] snap-start flex-col items-center justify-center border-t border-border py-16 text-center">
            <p className="mb-4 font-mono text-xs tracking-widest text-primary/60 uppercase">
              {pageConfig.closing.label}
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {pageConfig.closing.title.split(/\*(.*?)\*/).map((part, i) =>
                i % 2 === 1 ? (
                  <span key={i} className="text-primary">{part}</span>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {pageConfig.closing.subtitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
