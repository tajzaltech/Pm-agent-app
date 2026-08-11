/** Shared design tokens for the Ask PM landing page (light, product-grade). */

export const BRAND = "#5b43d6";
export const BRAND_HOVER = "#4f39c4";
export const BRAND_SOFT = "#f3f0fe";

/** JetBrains Mono, loaded in the root layout, for metadata & code. */
export const mono = "font-[family-name:var(--font-jetbrains-mono)]";

/** Ink scale — one near-black, two greys. Nothing else carries text. */
export const INK = "text-[#101018]";
export const INK_MUTED = "text-[#5b5e70]";
export const INK_FAINT = "text-[#8b8e9e]";

/** Hairline border used on every surface. */
export const LINE = "border-[#e8e8ef]";

/** Card chrome: 1px hairline + a very soft two-stop shadow. */
export const CARD = `rounded-2xl border ${LINE} bg-white`;
export const CARD_SHADOW =
  "shadow-[0_1px_2px_rgba(16,17,24,0.04),0_12px_32px_-18px_rgba(16,17,24,0.14)]";
/** Deeper elevation, reserved for the hero product frame. */
export const LIFT =
  "shadow-[0_1px_2px_rgba(16,17,24,0.04),0_40px_90px_-40px_rgba(16,17,24,0.28)]";

/** Classification → soft status color (never color-only; always paired with a label). */
export const CLASS_STYLE = {
  bug: { label: "Bug", text: "text-[#c0392f]", chip: "border-[#f3d4d0] bg-[#fdf2f1] text-[#c0392f]" },
  feature: { label: "Feature Request", text: "text-[#1f6fb2]", chip: "border-[#cfe2f2] bg-[#f0f7fd] text-[#1f6fb2]" },
  question: { label: "Customer Question", text: "text-[#5b43d6]", chip: "border-[#ddd5fa] bg-[#f3f0fe] text-[#5b43d6]" },
  churn: { label: "Churn Risk", text: "text-[#a6690a]", chip: "border-[#f2e0bd] bg-[#fdf7ea] text-[#a6690a]" },
} as const;

export type ClassKey = keyof typeof CLASS_STYLE;
