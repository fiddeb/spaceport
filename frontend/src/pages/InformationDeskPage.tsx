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
      { rootMargin: "-80px 0px -40% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    // Observe all exhibit sections
    for (const exhibit of exhibits) {
      const el = document.getElementById(exhibit.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [updateActive]);

  return (
    <div className="flex flex-col gap-10">
      {/* Page header */}
      <header className="pt-2">
        <p className="mb-1 font-mono text-xs tracking-widest text-primary/60 uppercase">
          Information Desk
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Traveller's Guide to{" "}
          <span className="text-primary">Observability</span>
        </h1>
        <p className="mt-3 max-w-[60ch] text-muted-foreground">
          Everything you need to understand OpenTelemetry, semantic conventions,
          and modern observability — from first principles to hands-on
          experimentation.
        </p>
      </header>

      <div className="border-t border-border" />

      {/* Two-column layout: nav (desktop) + content */}
      <div className="flex gap-10">
        {/* Sticky side nav — hidden on mobile */}
        <aside className="hidden shrink-0 lg:block lg:w-56">
          <div className="sticky top-[4.5rem]">
            <ExhibitNav exhibits={exhibits} activeId={activeId} />
          </div>
        </aside>

        {/* Mobile topic selector */}
        <div className="mb-2 lg:hidden">
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
          <div className="flex flex-col gap-20">
            {exhibits.map((exhibit) => (
              <ExhibitPanel key={exhibit.id} exhibit={exhibit} />
            ))}
          </div>

          {/* Footer marker */}
          <div className="mt-20 border-t border-border pt-8 pb-4 text-center text-xs text-muted-foreground">
            End of exhibits — More content added each release
          </div>
        </div>
      </div>
    </div>
  );
}
