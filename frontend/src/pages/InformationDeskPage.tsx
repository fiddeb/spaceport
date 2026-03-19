import { useEffect, useRef, useState, useCallback } from "react";
import { exhibits } from "@/data/informationDesk";
import { ExhibitNav } from "@/components/information/ExhibitNav";
import { ExhibitPanel } from "@/components/information/ExhibitPanel";

export function InformationDeskPage() {
  const [activeId, setActiveId] = useState<string | null>(
    exhibits[0]?.id ?? null,
  );

  // Track which section is in view via IntersectionObserver
  const sectionRefs = useRef<Map<string, IntersectionObserverEntry>>(new Map());

  const updateActive = useCallback(() => {
    // Pick the section with the largest visible ratio,
    // biased toward earlier sections when ratios are close.
    let best: string | null = null;
    let bestRatio = -1;

    for (const [id, entry] of sectionRefs.current) {
      if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
        bestRatio = entry.intersectionRatio;
        best = id;
      }
    }
    // Fallback: if nothing is intersecting, pick the first visible entry
    // by checking boundingClientRect.top closest to 0+
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
          sectionRefs.current.set(entry.target.id, entry);
        }
        updateActive();
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.1, 0.5, 1] },
    );

    // Observe all exhibit sections
    for (const exhibit of exhibits) {
      const el = document.getElementById(exhibit.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [updateActive]);

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
