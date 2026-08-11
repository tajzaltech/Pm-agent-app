"use client";

import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { BrandMark, type Brand } from "@/components/marketing/BrandTile";
import { INK, INK_MUTED, LINE } from "@/components/marketing/theme";
import { PrimaryCta, Reveal, SecondaryCta } from "@/components/marketing/ui";

const FLOW: Brand[] = [
  { name: "Zendesk", slug: "zendesk", color: "03363D" },
  { name: "GitHub", slug: "github", color: "181717" },
  { name: "Jira", slug: "jira", color: "0052CC" },
  { name: "Linear", slug: "linear", color: "5E6AD2" },
];

export function FinalCtaSection() {
  return (
    <section id="cta" className="scroll-mt-16 py-24 sm:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <div
            className={cn(
              "relative overflow-hidden rounded-[24px] border bg-white px-6 py-16 text-center sm:px-12",
              LINE,
              "shadow-[0_1px_2px_rgba(16,17,24,0.04),0_40px_90px_-50px_rgba(16,17,24,0.3)]"
            )}
          >
            <div className="pointer-events-none absolute inset-0 -z-10">
              <div className="absolute left-1/2 top-[-10rem] h-[24rem] w-[40rem] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(91,67,214,0.12),transparent)]" />
            </div>

            <h2 className={cn("mx-auto max-w-2xl text-[30px] font-semibold leading-[1.12] tracking-[-0.03em] sm:text-[44px]", INK)}>
              Your next engineering priority is already sitting in support.
            </h2>
            <p className={cn("mx-auto mt-5 max-w-lg text-[16px] leading-relaxed", INK_MUTED)}>
              Connect a support inbox and a repository. Ask PM will find the signal, investigate the
              code, and prepare the work for your review.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <PrimaryCta href="/signup" large>
                Start free
              </PrimaryCta>
              <SecondaryCta href="/signup" large>
                Book a product demo
              </SecondaryCta>
            </div>

            <div className={cn("mx-auto mt-14 flex max-w-2xl flex-wrap items-center justify-center gap-2 border-t pt-10", LINE)}>
              {FLOW.map((b, i) => (
                <span key={b.name} className="flex items-center gap-2">
                  <span className={cn("flex size-11 items-center justify-center rounded-xl border bg-white", LINE)}>
                    <BrandMark brand={b} className="size-5" />
                  </span>
                  {i < FLOW.length - 1 && <ArrowRight className="size-3.5 text-[#c5c7d1]" aria-hidden />}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
