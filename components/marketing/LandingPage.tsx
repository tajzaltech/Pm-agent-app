"use client";

import { LandingNav } from "@/components/marketing/LandingNav";
import { HeroSection } from "@/components/marketing/HeroSection";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";
import { CapabilitiesSection } from "@/components/marketing/CapabilitiesSection";
import { IntegrationsSection } from "@/components/marketing/IntegrationsSection";
import { FinalCtaSection } from "@/components/marketing/FinalCtaSection";
import { LandingFooter } from "@/components/marketing/LandingFooter";

export function LandingPage() {
  return (
    <div
      data-landing
      className="min-h-screen scroll-smooth bg-white font-[family-name:var(--font-urbanist)] text-[#101018] antialiased [color-scheme:light]"
    >
      <LandingNav />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <CapabilitiesSection />
        <IntegrationsSection />
        <FinalCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
