import { useEffect, useRef } from "react";

/**
 * Bottom-of-feed trigger. Pure presentation: it owns no data, it just tells the
 * page when the end of the list has come into view.
 *
 * An IntersectionObserver rather than a scroll listener: the browser does the
 * geometry off the main thread, so the feed keeps scrolling smoothly while a
 * page appends. `rootMargin` fires it BEFORE the true bottom, so the next page
 * is usually already in flight by the time the user gets there and the scroll
 * never visibly stops.
 */
export function InfiniteSentinel({
  onReach,
  disabled = false,
  /** How far ahead of the bottom to start loading. */
  rootMargin = "800px",
}: {
  onReach: () => void;
  disabled?: boolean;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  // Held in a ref so re-renders don't tear down the observer mid-scroll.
  const cb = useRef(onReach);
  cb.current = onReach;

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;
    // Older browsers (and jsdom) lack IO: without it the page still works, the
    // user just gets the explicit button below the feed.
    if (typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) cb.current();
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [disabled, rootMargin]);

  return <div ref={ref} aria-hidden className="h-px w-full" />;
}
