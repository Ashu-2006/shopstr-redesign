import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "accent";

const VARIANTS: Record<Variant, string> = {
  // neutral is primary
  primary: "bg-ink text-text-on-dark border-ink",
  // purple is the structural accent
  secondary: "bg-purple text-on-purple border-purple",
  ghost: "bg-transparent text-text border-ink",
  accent: "bg-yellow text-ink border-ink",
};

/**
 * Chunky pill button. Stroke not shadow. Scale-on-press 0.96.
 * Pure presentation — caller passes onClick etc. via ...rest.
 */
export function Button({
  variant = "primary",
  full = false,
  children,
  className = "",
  ...rest
}: {
  variant?: Variant;
  full?: boolean;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-pill border-2 font-bold",
        "px-6 py-3.5 text-base ds-press select-none",
        full ? "w-full" : "",
        VARIANTS[variant],
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
