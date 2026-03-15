import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section
      className="relative flex min-h-screen flex-col overflow-hidden"
      data-prompt="A vast futuristic spaceport terminal interior at dusk, towering glass walls revealing a star-filled sky, neon-lit boarding gates stretching into the distance, silhouettes of passengers with luggage, moody cinematic wide-angle shot, dark atmospheric lighting with teal and blue accent lights, volumetric fog"
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.10_0.02_260)_0%,oklch(0.14_0.01_326)_40%,oklch(0.12_0.04_220)_70%,oklch(0.08_0.02_250)_100%)]" />

      {/* Grain/noise overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />

      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_40%,oklch(0.25_0.06_220_/_0.3),transparent)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col gap-8 px-6 pt-20 sm:px-8 lg:px-12">
        {/* Hero image */}
        <img
          src="/hero.png"
          alt="Spaceport terminal"
          className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both mx-auto aspect-[16/9] max-h-[55vh] w-full max-w-7xl object-cover duration-700"
        />

        <div className="flex flex-col items-center gap-8 pb-12 text-center">
          <h1 className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both text-4xl font-bold tracking-tight text-foreground duration-700 sm:text-5xl lg:text-6xl">
            Your Gateway
            <br />
            <span className="text-primary">Beyond the Stars</span>
          </h1>

          <p className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both max-w-xl text-lg text-muted-foreground delay-200 duration-700 sm:text-xl">
            Book interplanetary voyages from the solar system's premier spaceport.
            Four destinations. Twelve routes weekly. Zero gravity surcharge.
          </p>

          <Button
            asChild
            size="lg"
            className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both h-12 px-8 text-base delay-400 duration-700"
          >
            <Link to="/departures">Browse Departures</Link>
          </Button>
        </div>
      </div>

      {/* Bottom fade into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
