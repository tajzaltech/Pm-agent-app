"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { PrimaryCta } from "@/components/marketing/ui";

const LINKS = [
  { label: "How it works", href: "#how" },
  { label: "Capabilities", href: "#features" },
  { label: "Integrations", href: "#integrations" },
  { label: "Security", href: "#security" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-200",
          scrolled ? "border-b border-[#ececf2] bg-white/85 backdrop-blur-xl" : "border-b border-transparent bg-transparent"
        )}
      >
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="#top" className="flex items-center gap-2.5">
            <Image
              src="/ask-pm-logo-v3.png"
              alt="Ask PM"
              width={512}
              height={512}
              className="size-9 object-contain"
              priority
            />
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-[#101018]">Ask PM</span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="rounded-lg px-3 py-1.5 text-[13.5px] font-medium text-[#5b5e70] transition-colors hover:text-[#101018]"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/signin"
              className="rounded-lg px-3 py-1.5 text-[13.5px] font-medium text-[#5b5e70] transition-colors hover:text-[#101018]"
            >
              Sign in
            </Link>
            <PrimaryCta href="/signup">Start free</PrimaryCta>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex size-9 items-center justify-center rounded-lg text-[#101018] lg:hidden"
            aria-label="Open menu"
          >
            <span className="flex flex-col gap-[5px]">
              <span className="h-0.5 w-5 rounded-full bg-current" />
              <span className="h-0.5 w-5 rounded-full bg-current" />
            </span>
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col bg-white lg:hidden"
          >
            <div className="flex h-16 items-center justify-between px-6">
              <span className="flex items-center gap-2.5">
                <Image src="/ask-pm-logo-v3.png" alt="Ask PM" width={512} height={512} className="size-9 object-contain" />
                <span className="text-[15px] font-semibold text-[#101018]">Ask PM</span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-9 items-center justify-center rounded-lg text-[#101018]"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-1 px-6">
              {LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-[#f0f0f5] py-4 text-2xl font-semibold tracking-[-0.02em] text-[#101018]"
                >
                  {l.label}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-3 px-6 pb-10">
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="flex h-12 items-center justify-center rounded-xl bg-[#5b43d6] text-[15px] font-semibold text-white"
              >
                Start free
              </Link>
              <Link
                href="/signin"
                onClick={() => setOpen(false)}
                className="flex h-12 items-center justify-center rounded-xl border border-[#e8e8ef] text-[15px] font-medium text-[#101018]"
              >
                Sign in
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
