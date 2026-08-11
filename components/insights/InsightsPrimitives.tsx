"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * Chart palette. The categorical slots were validated with the data-viz
 * validator (adjacent-pair CVD ΔE ≥ 8, normal-vision ΔE ≥ 15, light surface):
 * the previous amber/orange pair sat at ΔE 9.6 normal-vision and was
 * indistinguishable. Yellow sits below 3:1 contrast, so every use of it is
 * paired with a visible label — never color alone.
 */
export const VIZ = {
  /** Categorical — classification identity. Fixed order, never cycled. */
  bug: "#e34948",
  feature: "#2a78d6",
  question: "#eda100",
  churn: "#4a3aa7",
  /** Sequential — one hue, light → dark, for magnitude (funnel, code areas). */
  ramp: ["#c9bcff", "#a48bf0", "#8e6cf3", "#5b43d6", "#4a35b8"],
  brand: "#5b43d6",
  grid: "#eeecf6",
  axis: "#8b8e9e",
} as const;

/** Counts a number up when it scrolls into view; static under reduced motion. */
export function CountUp({
  value,
  className,
  duration = 900,
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView || reduce) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, value, duration]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {reduce || !inView ? value : shown}
    </span>
  );
}

/** Compact trend line for a stat tile. Decorative — the number carries the value. */
export function Sparkline({
  data,
  stroke = VIZ.brand,
  className,
}: {
  data: number[];
  stroke?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (data.length < 2) return null;

  const w = 96;
  const h = 28;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => [i * step, h - 2 - ((v - min) / span) * (h - 4)] as const);
  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gradId = `spark-${stroke.replace("#", "")}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-7 w-24 overflow-visible", className)} aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <motion.path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        whileInView={reduce ? undefined : { pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

/** Card chrome shared by every panel on the page. */
export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
  delay = 0,
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "rounded-2xl border border-black/[0.06] bg-white p-5",
        "shadow-[0_1px_2px_rgba(16,17,24,0.04),0_12px_32px_-20px_rgba(46,26,120,0.18)]",
        className
      )}
    >
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-[14px] font-semibold tracking-[-0.01em]">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[12px] text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </motion.section>
  );
}

/** Shared recharts tooltip so every chart reads the same. */
export function VizTooltip({
  active,
  payload,
  label,
  unit = "",
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string; dataKey?: string }[];
  label?: string | number;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-black/[0.07] bg-white px-3 py-2 shadow-[0_16px_40px_-16px_rgba(46,26,120,0.35)]">
      {label !== undefined && (
        <p className="mb-1 text-[11px] font-medium text-muted-foreground">{label}</p>
      )}
      {payload.map((p) => (
        <p key={String(p.dataKey ?? p.name)} className="flex items-center gap-2 text-[12px]">
          <span className="size-2 shrink-0 rounded-[3px]" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto font-semibold tabular-nums">
            {p.value}
            {unit}
          </span>
        </p>
      ))}
    </div>
  );
}
