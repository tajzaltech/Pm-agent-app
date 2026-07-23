"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";

import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Product", href: "#top", id: "top" },
  { label: "How It Works", href: "#pipeline", id: "pipeline" },
  { label: "Integrations", href: "#ecosystem", id: "ecosystem" },
  { label: "Use Cases", href: "#demo", id: "demo" },
  { label: "Security", href: "#security", id: "cta" },
  { label: "Pricing", href: "#cta", id: "cta" },
];

const SPY_IDS = ["top", "pipeline", "demo", "ecosystem", "cta"];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("top");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const els = SPY_IDS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:pt-4"
      >
        <nav
          className={cn(
            "mx-auto flex h-14 max-w-6xl items-center justify-between rounded-2xl px-4 transition-all duration-500 sm:px-5",
            scrolled
              ? "border border-white/[0.08] bg-[#09090d]/80 shadow-[0_1px_0_0_rgba(91,67,214,0.25)_inset,0_20px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl"
              : "border border-transparent bg-transparent"
          )}
        >
          <Link href="#top" className="flex items-center gap-2.5">
            <Image src="/apple-icon.png" alt="Ask PM" width={180} height={180} className="size-10 rounded-xl object-contain" priority />
            <span className="text-[15px] font-semibold tracking-tight text-white">Ask PM</span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className={cn(
                  "relative rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                  active === l.id ? "text-white" : "text-white/55 hover:text-white"
                )}
              >
                {active === l.id && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 -z-10 rounded-lg bg-white/[0.06] ring-1 ring-[#5b43d6]/30"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <GlowButton href="/signup">Start Free</GlowButton>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex size-9 items-center justify-center rounded-lg text-white lg:hidden"
            aria-label="Open menu"
          >
            <span className="flex flex-col gap-[5px]">
              <span className="h-0.5 w-5 rounded-full bg-current" />
              <span className="h-0.5 w-5 rounded-full bg-current" />
            </span>
          </button>
        </nav>
      </motion.header>

      {/* full-screen mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col bg-[#050507]/95 backdrop-blur-2xl lg:hidden"
          >
            <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(91,67,214,0.3),transparent)] blur-2xl" />
            <div className="flex h-16 items-center justify-between px-6">
              <span className="flex items-center gap-2.5">
                <Image src="/apple-icon.png" alt="Ask PM" width={180} height={180} className="size-10 rounded-xl object-contain" priority />
                <span className="text-[15px] font-semibold text-white">Ask PM</span>
              </span>
              <button type="button" onClick={() => setOpen(false)} className="flex size-9 items-center justify-center rounded-lg text-white" aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-1 px-6">
              {LINKS.map((l, i) => (
                <motion.a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + i * 0.05 }}
                  className="border-b border-white/[0.06] py-4 text-2xl font-semibold tracking-tight text-white/80"
                >
                  {l.label}
                </motion.a>
              ))}
            </div>
            <div className="flex flex-col gap-3 px-6 pb-10">
              <Link href="/signup" onClick={() => setOpen(false)} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#5b43d6] text-[15px] font-semibold text-white">
                Start Free <ArrowRight className="size-4" />
              </Link>
              <Link href="/signin" onClick={() => setOpen(false)} className="flex h-12 items-center justify-center rounded-xl border border-white/12 text-[15px] font-medium text-white/80">
                Sign In
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Primary CTA with a soft purple glow. */
export function GlowButton({
  href,
  children,
  className,
  large,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  large?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative inline-flex items-center gap-2 rounded-xl bg-[#5b43d6] font-semibold text-white transition-all duration-300 hover:bg-[#6d54e6]",
        "shadow-[0_8px_30px_-6px_rgba(91,67,214,0.6)] hover:shadow-[0_12px_44px_-6px_rgba(91,67,214,0.8)]",
        large ? "h-12 px-6 text-[15px]" : "h-9 px-3.5 text-[13px]",
        className
      )}
    >
      <span className="absolute inset-0 -z-10 rounded-xl opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-60" style={{ background: "#5b43d6" }} />
      {children}
      <ArrowRight className={cn("transition-transform duration-300 group-hover:translate-x-0.5", large ? "size-4" : "size-3.5")} />
    </Link>
  );
}
