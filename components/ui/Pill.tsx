import type { ButtonHTMLAttributes, ReactNode } from "react";

type Tone =
  | "default"
  | "ink"
  | "purple"
  | "yellow"
  | "green"
  | "pink"
  | "blue"
  | "orange"
  | "red";

const TONES: Record<Tone, string> = {
  default: "bg-paper-pure text-ink border-ink",
  ink: "bg-ink text-text-on-dark border-ink",
  purple: "bg-purple text-on-purple border-purple",
  // all six accents take black text
  yellow: "bg-yellow text-ink border-ink",
  green: "bg-green text-ink border-ink",
  pink: "bg-pink text-ink border-ink",
  blue: "bg-blue text-ink border-ink",
  orange: "bg-orange text-ink border-ink",
  red: "bg-red text-ink border-ink",
};

/**
 * Pill / chip. Used for filters, tags, small labels. When `as="button"` it is
 * interactive (filter chips); otherwise a static span.
 */
export function Pill({
  tone = "default",
  active = false,
  children,
  className = "",
  interactive = false,
  ...rest
}: {
  tone?: Tone;
  active?: boolean;
  interactive?: boolean;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    "inline-flex items-center gap-2 rounded-pill border-2 px-3.5 py-2 text-sm font-semibold whitespace-nowrap";
  const cls = [
    base,
    active ? TONES.ink : TONES[tone],
    interactive ? "ds-press cursor-pointer" : "",
    className,
  ].join(" ");

  if (interactive) {
    return (
      <button {...rest} className={cls}>
        {children}
      </button>
    );
  }
  return <span className={cls}>{children}</span>;
}
