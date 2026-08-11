/* Skeleton primitive — the ONLY loading affordance in the app (no spinner
   exists, period). Rules, from the loading/empty-states spec:
   - Use when page chrome is painted and DATA is filling in. Shape-match the
     real layout so nothing reflows when content lands.
   - Card skeletons keep the live ink frame (border-2 border-ink + radius);
     Skeleton blocks fill only the content inside.
   - Sweep, not pulse. Reduced motion falls back to a static fill (CSS).
   Pure presentation. */

import type { CSSProperties } from "react";

type Shape = "line" | "rect" | "circle";

const RADIUS: Record<Shape, string> = {
  line: "rounded-sm",
  rect: "rounded-lg",
  circle: "rounded-full",
};

function px(v: number | string | undefined): string | undefined {
  return typeof v === "number" ? `${v}px` : v;
}

export function Skeleton({
  shape = "line",
  w,
  h,
  className = "",
}: {
  shape?: Shape;
  /** width; number = px. Lines default to 100%. */
  w?: number | string;
  /** height; number = px. Lines default to 0.75rem. */
  h?: number | string;
  className?: string;
}) {
  const style: CSSProperties = {
    width: px(w) ?? (shape === "line" ? "100%" : undefined),
    height: px(h) ?? (shape === "line" ? "0.75rem" : undefined),
  };
  return (
    <span
      aria-hidden="true"
      className={`ds-skeleton block ${RADIUS[shape]} ${className}`}
      style={style}
    />
  );
}
