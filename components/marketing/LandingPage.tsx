"use client";

import { LandingNav } from "@/components/marketing/LandingNav";
import { HeroSection } from "@/components/marketing/HeroSection";
import { PipelineSection } from "@/components/marketing/PipelineSection";
import { LiveDemoSection } from "@/components/marketing/LiveDemoSection";
import { EcosystemSection } from "@/components/marketing/EcosystemSection";
import { FinalCtaSection } from "@/components/marketing/FinalCtaSection";
import { LandingFooter } from "@/components/marketing/LandingFooter";

export function LandingPage() {
  return (
    <div
      data-landing
      className="min-h-screen scroll-smooth bg-[#050507] font-[family-name:var(--font-urbanist)] text-white antialiased [color-scheme:dark]"
    >
      <LandingNav />
      <main>
        <HeroSection />
        <PipelineSection />
        <LiveDemoSection />
        <EcosystemSection />
        <FinalCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
