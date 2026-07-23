/** Shared design tokens for the Ask PM landing page (hard-coded dark). */

export const BRAND = "#5b43d6";
export const BRAND_HOVER = "#6d54e6";
export const BRAND_LIGHT = "#a48bf0";

/** JetBrains Mono, loaded in the root layout, for code & metadata. */
export const mono = "font-[family-name:var(--font-jetbrains-mono)]";

/** Classification → soft status color (never color-only; always paired with a label). */
export const CLASS_STYLE = {
  bug: { label: "Bug", text: "text-red-300", chip: "border-red-500/25 bg-red-500/10 text-red-300" },
  feature: { label: "Feature Request", text: "text-sky-300", chip: "border-sky-500/25 bg-sky-500/10 text-sky-300" },
  question: { label: "Customer Question", text: "text-[#a48bf0]", chip: "border-[#5b43d6]/30 bg-[#5b43d6]/12 text-[#a48bf0]" },
  churn: { label: "Churn Risk", text: "text-amber-300", chip: "border-amber-500/25 bg-amber-500/10 text-amber-300" },
} as const;

export type ClassKey = keyof typeof CLASS_STYLE;
