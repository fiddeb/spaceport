import { Hero } from "@/components/landing/Hero";
import { DestinationShowcase } from "@/components/landing/DestinationShowcase";
import { StatsSection } from "@/components/landing/StatsSection";

export function LandingPage() {
  return (
    <div className="w-full">
      <Hero />
      <DestinationShowcase />
      <StatsSection />
    </div>
  );
}
