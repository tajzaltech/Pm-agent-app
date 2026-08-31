"use client";

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { INK, INK_FAINT, INK_MUTED, LINE, mono } from "@/components/marketing/theme";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "#how" },
      { label: "Capabilities", href: "#features" },
      { label: "Integrations", href: "#integrations" },
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
      { label: "System status", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className={cn("border-t bg-white pt-16 pb-10", LINE)}>
      <div className="mx-auto grid max-w-6xl gap-12 px-6 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <Link href="#top" className="flex items-center gap-2.5">
            <Image src="/regula8ai-logo.svg" alt="REGULA8AI" width={150} height={34} className="h-7 w-auto object-contain" />
          </Link>
          <p className={cn("mt-4 text-[13.5px] leading-relaxed", INK_MUTED)}>
            The product manager between support, product, and engineering — turning tickets into
            development-ready work for human approval.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className={cn("text-[11px] font-semibold uppercase tracking-[0.14em]", mono, INK_FAINT)}>{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className={cn("text-[13.5px] transition-colors hover:text-[#101018]", INK_MUTED)}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className={cn("mx-auto mt-14 flex max-w-6xl flex-col items-center justify-between gap-4 border-t px-6 pt-6 sm:flex-row", LINE)}>
        <p className={cn("text-[12px]", INK_FAINT)}>© 2027 Ask PM — Support intelligence for product teams.</p>
        <p className={cn("text-[12px]", INK_FAINT)}>All systems operational</p>
      </div>
    </footer>
  );
}
