"use client";

import { cn } from "@/lib/utils";
import { mono } from "@/components/marketing/theme";

/**
 * Shared "premium glass panel" chrome used by every product-preview card
 * across the landing page (hero, pipeline stages, live demo). Gives every
 * card the same depth language: glass gradient, top light seam, faint grid
 * texture, and an icon-badge header — instead of a flat bordered box.
 */
export function PanelChrome({
  label,
  icon: Icon,
  tone = "neutral",
  glow = false,
  className,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "neutral" | "brand";
  glow?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border bg-gradient-to-b from-[#111119] to-[#08080c] p-5 backdrop-blur-2xl",
        glow
          ? "border-[#5b43d6]/40 shadow-[0_0_0_1px_rgba(91,67,214,0.22),0_50px_110px_-35px_rgba(91,67,214,0.55)]"
          : "border-white/[0.08] shadow-[0_40px_90px_-45px_rgba(0,0,0,0.9)]",
        className
      )}
    >
      {/* glass reflection seam */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      {/* faint texture, fading toward the bottom */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-dark opacity-[0.12] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
      {glow && <div className="pointer-events-none absolute -inset-px -z-10 rounded-[1.75rem] bg-[#5b43d6]/15 blur-xl" />}

      <div className="mb-4 flex shrink-0 items-center gap-2">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-lg",
            tone === "brand" ? "bg-[#5b43d6]/20 text-[#a48bf0]" : "bg-white/[0.06] text-white/40"
          )}
        >
          <Icon className="size-3.5" />
        </span>
        <span
          className={cn(
            `text-[10.5px] font-semibold uppercase tracking-wider ${mono}`,
            tone === "brand" ? "text-[#a48bf0]" : "text-white/40"
          )}
        >
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

/** A refined pill badge with an optional glow dot — used for classification/status chips. */
export function GlowChip({
  children,
  className,
  dot,
}: {
  children: React.ReactNode;
  className?: string;
  dot?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]",
        className
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full shadow-[0_0_6px_1px_currentColor]", dot)} />}
      {children}
    </span>
  );
}

/** A solid, depth-y primary action button (used across pipeline/demo cards). */
export function SolidButton({
  children,
  tone = "brand",
  className,
}: {
  children: React.ReactNode;
  tone?: "brand" | "emerald";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-semibold shadow-[0_10px_24px_-8px_var(--tw-shadow-color)] ring-1 ring-inset",
        tone === "brand" &&
          "bg-gradient-to-b from-[#6d54e6] to-[#5b43d6] text-white shadow-[#5b43d6]/60 ring-white/10",
        tone === "emerald" &&
          "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-emerald-500/40 ring-white/10",
        className
      )}
    >
      {children}
    </span>
  );
}

/** A ghost secondary button matching SolidButton's proportions. */
export function GhostButton({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 py-2 text-[12.5px] font-medium text-white/60",
        className
      )}
    >
      {children}
    </span>
  );
}
