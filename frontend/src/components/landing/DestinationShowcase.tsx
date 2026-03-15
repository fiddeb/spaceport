import { Link } from "react-router-dom";
import { useInView } from "./useInView";

const destinations = [
  {
    name: "Mars Colony Alpha",
    teaser: "Red sands, frontier living, and the best sunsets in the system.",
    gradient:
      "bg-[linear-gradient(160deg,oklch(0.18_0.05_30)_0%,oklch(0.12_0.04_15)_50%,oklch(0.08_0.02_0)_100%)]",
    image: "/mars.png",
    prompt:
      "Mars colony at golden hour, red desert landscape with dome habitats and landing pads, distant mountains, warm dusty atmosphere, cinematic sci-fi concept art, dark moody tones",
    link: "/departures",
  },
  {
    name: "Titan Station Prometheus",
    teaser: "Saturn's rings as your backdrop. Research meets luxury.",
    gradient:
      "bg-[linear-gradient(160deg,oklch(0.16_0.04_60)_0%,oklch(0.12_0.03_45)_50%,oklch(0.08_0.02_30)_100%)]",
    prompt:
      "Space station orbiting Titan with Saturn's rings visible in background, metallic structure with warm interior lights, deep space darkness, cinematic composition, volumetric lighting",
    link: "/departures",
    image: "/titan.png",
  },
  {
    name: "Europa Deep Dive",
    teaser: "Beneath the ice, an ocean of discovery awaits.",
    gradient:
      "bg-[linear-gradient(160deg,oklch(0.14_0.06_220)_0%,oklch(0.10_0.05_230)_50%,oklch(0.06_0.03_240)_100%)]",
    prompt:
      "Underwater research station beneath Europa's ice crust, bioluminescent ocean depths, glass observation dome, deep blue and teal lighting, mysterious aquatic sci-fi atmosphere",
    link: "/departures",
    image: "/europa.png",
  },
  {
    name: "Moonbase Alpha",
    teaser: "The classic. Earth views, low gravity, duty-free shopping.",
    gradient:
      "bg-[linear-gradient(160deg,oklch(0.20_0.01_260)_0%,oklch(0.14_0.01_270)_50%,oklch(0.08_0.005_280)_100%)]",
    prompt:
      "Lunar base on the Moon's surface with Earth rising in the starry sky, modern modular architecture, soft blue-white lighting, astronauts walking between buildings, cinematic wide shot",
    link: "/departures",
    image: "/moon.png",
  },
];

export function DestinationShowcase() {
  const { ref, inView } = useInView({ threshold: 0.15 });

  return (
    <section className="px-6 py-24 sm:px-8 lg:px-12" ref={ref}>
      <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Destinations
      </h2>
      <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {destinations.map((dest, i) => (
          <Link
            key={dest.name}
            to={dest.link}
            className={`group relative flex flex-col justify-end overflow-hidden border border-border p-6 transition-all duration-500 hover:scale-[1.02] hover:border-primary/40 hover:shadow-[0_0_30px_oklch(0.45_0.085_224/_0.15)] ${
              inView
                ? "animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                : "opacity-0"
            }`}
            style={{
              minHeight: "280px",
              animationDelay: inView ? `${i * 120}ms` : undefined,
              animationDuration: "600ms",
            }}
          >
            {/* Background gradient */}
            <div
              className={`absolute inset-0 ${dest.gradient} transition-transform duration-500 group-hover:scale-105`}
              data-prompt={dest.prompt}
            />

            {/* Overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />

            {/* Content */}
            <div className="relative z-10">
              {dest.image && (
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="mb-3 w-20 rounded object-contain"
                />
              )}
              <h3 className="text-lg font-bold text-foreground">
                {dest.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {dest.teaser}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
