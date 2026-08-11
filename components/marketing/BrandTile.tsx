"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export type Brand = {
  name: string;
  slug?: string;
  color?: string;
  /** Local SVG mark, for brands Simple Icons does not carry. */
  Logo?: React.ComponentType<{ className?: string }>;
};

/**
 * A real brand mark, loaded from Simple Icons (same source the onboarding cards
 * use). Falls back to a monogram tile when a slug is missing or fails to load,
 * so the layout never shows a broken image.
 */
export function BrandMark({ brand, className }: { brand: Brand; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (brand.Logo) return <brand.Logo className={cn("object-contain", className)} />;

  if (!brand.slug || failed) {
    return (
      <span
        className={cn(
          "flex items-center justify-center rounded-md bg-[#f3f0fe] text-[11px] font-bold text-[#5b43d6]",
          className
        )}
        aria-hidden
      >
        {brand.name.slice(0, 1)}
      </span>
    );
  }

  return (
    // Brand SVGs come from the Simple Icons CDN so the marks are the real ones.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://cdn.simpleicons.org/${brand.slug}/${brand.color ?? "101018"}`}
      alt={`${brand.name} logo`}
      onError={() => setFailed(true)}
      className={cn("object-contain", className)}
      draggable={false}
    />
  );
}

/** A bordered chip pairing the brand mark with its name. */
export function BrandChip({ brand, className }: { brand: Brand; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-[#e8e8ef] bg-white px-2.5 py-1.5 text-[12.5px] font-medium text-[#101018]",
        className
      )}
    >
      <BrandMark brand={brand} className="size-4" />
      {brand.name}
    </span>
  );
}
