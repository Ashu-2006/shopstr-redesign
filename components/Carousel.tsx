import { useEffect, useRef, type ReactNode } from "react";

/**
 * Horizontal snap rail. Pure-ish presentation: optional auto-advance for the
 * featured carousel (pauses on hover/touch), reduced-motion safe. Children are
 * laid out in a flex row; give each child a flex-basis class via `itemClass`.
 */
export function Carousel({
  children,
  auto = false,
  snap = true,
  fullBleed = false,
  className = "",
}: {
  children: ReactNode;
  auto?: boolean;
  snap?: boolean;
  /** Edge-to-edge: no side gutters, no gap (full-width hero banners). */
  fullBleed?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auto) return;
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let paused = false;
    const pause = () => (paused = true);
    const resume = () => (paused = false);
    el.addEventListener("pointerenter", pause);
    el.addEventListener("pointerdown", pause);
    el.addEventListener("pointerleave", resume);
    const id = window.setInterval(() => {
      if (paused) return;
      const first = el.firstElementChild as HTMLElement | null;
      const step = (first?.offsetWidth ?? 300) + 14;
      const max = el.scrollWidth - el.clientWidth - 4;
      el.scrollLeft = el.scrollLeft >= max ? 0 : el.scrollLeft + step;
    }, 2600);
    return () => {
      window.clearInterval(id);
      el.removeEventListener("pointerenter", pause);
      el.removeEventListener("pointerdown", pause);
      el.removeEventListener("pointerleave", resume);
    };
  }, [auto]);

  return (
    <div
      ref={ref}
      className={[
        "no-scrollbar flex overflow-x-auto scroll-smooth",
        fullBleed ? "gap-0" : "-mx-4 gap-3.5 px-4 pb-1",
        snap ? "snap-x snap-mandatory" : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
