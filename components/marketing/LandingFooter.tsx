"use client";

import Image from "next/image";
import Link from "next/link";

import { mono } from "@/components/marketing/theme";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Product", href: "#top" },
      { label: "How It Works", href: "#pipeline" },
      { label: "Integrations", href: "#ecosystem" },
      { label: "Security", href: "#security" },
      { label: "Pricing", href: "#cta" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Documentation", href: "#" },
      { label: "API", href: "#" },
      { label: "Changelog", href: "#" },
      { label: "System Status", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Company", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/[0.06] bg-[#050507] pt-16 pb-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5b43d6]/40 to-transparent" />
      <div className="mx-auto grid max-w-6xl gap-12 px-6 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <Link href="#top" className="flex items-center gap-2.5">
            <Image src="/apple-icon.png" alt="Ask PM" width={180} height={180} className="size-11 rounded-xl object-contain" />
            <span className="text-[16px] font-semibold text-white">Ask PM</span>
          </Link>
          <p className="mt-4 text-[13.5px] leading-relaxed text-white/45">
            The AI product manager between support, product, and engineering — turning tickets into development-ready work for human approval.
          </p>
          <p className={`mt-5 text-[11px] uppercase tracking-wider text-white/30 ${mono}`}>
            SOC 2-aligned · Human approval required
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-[13.5px] text-white/55 transition-colors hover:text-white">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-14 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-white/[0.06] px-6 pt-6 sm:flex-row">
        <p className={`text-[12px] text-white/35 ${mono}`}>© 2027 Ask PM — Support intelligence for product teams.</p>
        <div className="flex items-center gap-2 text-[12px] text-white/40">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
          </span>
          All systems operational
        </div>
      </div>
    </footer>
  );
}
