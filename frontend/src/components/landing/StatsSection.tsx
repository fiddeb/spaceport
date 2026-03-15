import { useEffect, useRef, useState } from "react";
import { useInView } from "./useInView";

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  decimals?: number;
}

const stats: StatItem[] = [
  { value: 4, suffix: "", label: "Destinations", decimals: 0 },
  { value: 12, suffix: "", label: "Routes Weekly", decimals: 0 },
  { value: 2847, suffix: "", label: "Travellers Launched", decimals: 0 },
  { value: 99.2, suffix: "%", label: "On-Time*", decimals: 1 },
];

function useCountUp(target: number, active: boolean, duration = 1500, decimals = 0) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;

    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Number((eased * target).toFixed(decimals)));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, target, duration, decimals]);

  return value;
}

function StatCounter({ item, active, index }: { item: StatItem; active: boolean; index: number }) {
  const count = useCountUp(item.value, active, 1500, item.decimals);

  return (
    <div
      className={`flex flex-col items-center gap-2 px-6 py-4 transition-all duration-600 ${
        active
          ? "animate-in fade-in slide-in-from-bottom-3 fill-mode-both"
          : "opacity-0"
      }`}
      style={{
        animationDelay: active ? `${index * 100}ms` : undefined,
        animationDuration: "500ms",
      }}
    >
      <span className="text-4xl font-bold tabular-nums tracking-tight text-foreground sm:text-5xl">
        {item.value >= 1000
          ? count.toLocaleString("en-US", {
              minimumFractionDigits: item.decimals,
              maximumFractionDigits: item.decimals,
            })
          : item.decimals
            ? count.toFixed(item.decimals)
            : count}
        {item.suffix}
      </span>
      <span className="text-sm text-muted-foreground">{item.label}</span>
    </div>
  );
}

export function StatsSection() {
  const { ref, inView } = useInView({ threshold: 0.3 });

  return (
    <section ref={ref} className="border-t border-border px-6 py-24 sm:px-8">
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-y-8 lg:grid-cols-4 lg:divide-x lg:divide-border">
        {stats.map((item, i) => (
          <StatCounter key={item.label} item={item} active={inView} index={i} />
        ))}
      </div>
      <p className="mt-8 text-center text-xs text-muted-foreground">
        * Subject to gravitational delays
      </p>
    </section>
  );
}
