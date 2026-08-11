"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { BrandMark, type Brand } from "@/components/marketing/BrandTile";
import { INK, INK_FAINT, LINE, mono } from "@/components/marketing/theme";
import { PMAgentLogo } from "@/components/shared/BrandLogos";

const SOURCES: Brand[] = [
  { name: "Zendesk", slug: "zendesk", color: "03363D" },
  { name: "Intercom", slug: "intercom", color: "1F8DED" },
  { name: "GitHub", slug: "github", color: "181717" },
  { name: "GitLab", slug: "gitlab", color: "FC6D26" },
];

const OUTPUTS: Brand[] = [
  { name: "Jira", slug: "jira", color: "0052CC" },
  { name: "Linear", slug: "linear", color: "5E6AD2" },
  { name: "GitHub Issues", slug: "github", color: "181717" },
  { name: "Asana", slug: "asana", color: "F06A6A" },
];

/** Vertical anchor of each node inside the connector's 0–100 viewBox. */
const LANES = [12, 37.33, 62.67, 88];

export function WorkflowGraph() {
  const reduce = useReducedMotion();

  return (
    <div className="mt-14">
      {/* the graph — needs horizontal room, so it stands in for the list at md+ */}
      <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_110px_auto_110px_minmax(0,1fr)] md:items-stretch">
        <Column nodes={SOURCES} caption="Reads from" />

        <Connector direction="in" reduce={!!reduce} />

        <div className="flex flex-col items-center justify-center px-2">
          <div className="relative flex size-24 items-center justify-center">
            {!reduce && (
              <>
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full border border-[#5b43d6]/25"
                  animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full border border-[#5b43d6]/25"
                  animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeOut", delay: 1.3 }}
                />
              </>
            )}
            <span className="absolute inset-2 rounded-full bg-[#5b43d6]/[0.07] blur-md" />
            <span
              className={cn(
                "relative flex size-20 items-center justify-center rounded-full border bg-white",
                LINE,
                "shadow-[0_10px_30px_-12px_rgba(46,26,120,0.4)]"
              )}
            >
              <PMAgentLogo className="size-9 object-contain" />
            </span>
          </div>
          <p className={cn("mt-3 text-[13px] font-semibold tracking-[-0.01em]", INK)}>Ask PM</p>
          <p className={cn("mt-1 whitespace-nowrap text-[10.5px] uppercase tracking-[0.12em]", mono, INK_FAINT)}>
            Human approval
          </p>
        </div>

        <Connector direction="out" reduce={!!reduce} />

        <Column nodes={OUTPUTS} caption="Writes to" align="right" />
      </div>

      {/* below md the curves have nowhere to go, so the same story reads as three lists */}
      <div className="grid gap-4 md:hidden">
        <MobileGroup title="Reads from" nodes={SOURCES} />
        <div className="flex items-center justify-center gap-2 py-1">
          <PMAgentLogo className="size-7 object-contain" />
          <span className={cn("text-[13px] font-semibold", INK)}>Ask PM</span>
        </div>
        <MobileGroup title="Writes to" nodes={OUTPUTS} />
      </div>
    </div>
  );
}

function Column({
  nodes,
  caption,
  align = "left",
}: {
  nodes: Brand[];
  caption: string;
  align?: "left" | "right";
}) {
  return (
    <div className="flex flex-col justify-between py-1">
      <p
        className={cn(
          "mb-1 text-[10.5px] uppercase tracking-[0.14em]",
          mono,
          INK_FAINT,
          align === "right" && "text-right"
        )}
      >
        {caption}
      </p>
      {nodes.map((b) => (
        <div
          key={b.name}
          className={cn(
            "flex items-center gap-2.5 rounded-xl border bg-white px-3 py-2.5",
            LINE,
            "shadow-[0_1px_2px_rgba(16,17,24,0.04)]",
            align === "right" && "flex-row-reverse text-right"
          )}
        >
          <BrandMark brand={b} className="size-5 shrink-0" />
          <span className={cn("min-w-0 flex-1 truncate text-[13px] font-medium", INK)}>{b.name}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * The moving lines. `preserveAspectRatio="none"` lets the curves stretch to the
 * column, and `vector-effect="non-scaling-stroke"` keeps the stroke an even
 * width while they do. Flow is a dashed overlay whose offset animates.
 */
function Connector({ direction, reduce }: { direction: "in" | "out"; reduce: boolean }) {
  const paths = LANES.map((lane) =>
    direction === "in"
      ? `M0,${lane} C58,${lane} 42,50 100,50`
      : `M0,50 C58,50 42,${lane} 100,${lane}`
  );

  return (
    <div className="relative" aria-hidden>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`flow-${direction}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5b43d6" stopOpacity={direction === "in" ? 0.15 : 0.75} />
            <stop offset="100%" stopColor="#5b43d6" stopOpacity={direction === "in" ? 0.75 : 0.15} />
          </linearGradient>
        </defs>

        {paths.map((d) => (
          <g key={d}>
            {/* the rail */}
            <path d={d} fill="none" stroke="#e8e4f8" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            {/* the traffic */}
            <motion.path
              d={d}
              fill="none"
              stroke={`url(#flow-${direction})`}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeDasharray="5 11"
              vectorEffect="non-scaling-stroke"
              animate={reduce ? undefined : { strokeDashoffset: [0, -32] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

function MobileGroup({ title, nodes }: { title: string; nodes: Brand[] }) {
  return (
    <div className={cn("rounded-2xl border bg-white p-4", LINE)}>
      <p className={cn("mb-3 text-[10.5px] uppercase tracking-[0.14em]", mono, INK_FAINT)}>{title}</p>
      <div className="grid grid-cols-2 gap-2">
        {nodes.map((b) => (
          <div key={b.name} className={cn("flex items-center gap-2 rounded-xl border bg-[#fbfbfd] px-2.5 py-2", LINE)}>
            <BrandMark brand={b} className="size-4 shrink-0" />
            <span className={cn("min-w-0 flex-1 truncate text-[12px] font-medium", INK)}>{b.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
