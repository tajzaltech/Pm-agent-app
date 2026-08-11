"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { INK, INK_MUTED, LINE, mono } from "@/components/marketing/theme";

/** The page's only entrance animation: a short rise + fade, once, on scroll. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Solid brand CTA. */
export function PrimaryCta({
  href,
  children,
  large,
  className,
}: {
  href: string;
  children: React.ReactNode;
  large?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-xl bg-[#5b43d6] font-semibold text-white",
        "shadow-[0_1px_2px_rgba(16,17,24,0.10),0_10px_24px_-12px_rgba(91,67,214,0.7)]",
        "transition-colors duration-200 hover:bg-[#4f39c4]",
        large ? "h-12 px-6 text-[15px]" : "h-9 px-4 text-[13.5px]",
        className
      )}
    >
      {children}
      <ArrowRight
        className={cn("transition-transform duration-200 group-hover:translate-x-0.5", large ? "size-4" : "size-3.5")}
      />
    </Link>
  );
}

/** Outlined secondary action. */
export function SecondaryCta({
  href,
  children,
  large,
  className,
}: {
  href: string;
  children: React.ReactNode;
  large?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border bg-white font-medium text-[#101018]",
        LINE,
        "shadow-[0_1px_2px_rgba(16,17,24,0.04)] transition-colors duration-200 hover:bg-[#fafafc]",
        large ? "h-12 px-5 text-[15px]" : "h-9 px-4 text-[13.5px]",
        className
      )}
    >
      {children}
    </Link>
  );
}

/** Centered section header: eyebrow, title, one line of support copy. */
export function SectionHead({
  eyebrow,
  title,
  body,
  align = "center",
}: {
  eyebrow: string;
  title: React.ReactNode;
  body?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <p className={cn("text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5b43d6]", mono)}>{eyebrow}</p>
      <h2 className={cn("mt-3 text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] sm:text-[38px]", INK)}>
        {title}
      </h2>
      {body ? <p className={cn("mt-4 text-[15.5px] leading-relaxed", INK_MUTED)}>{body}</p> : null}
    </div>
  );
}

/** Small labelled pill used for integration / capability status. */
export function StatusPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "live" | "beta" | "neutral" }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        tone === "live" && "border-[#c9e9db] bg-[#f0faf6] text-[#0f7f5b]",
        tone === "beta" && "border-[#ddd5fa] bg-[#f3f0fe] text-[#5b43d6]",
        tone === "neutral" && "border-[#e8e8ef] bg-[#fafafc] text-[#8b8e9e]"
      )}
    >
      {children}
    </span>
  );
}
