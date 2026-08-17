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
  /** Changes when new content has landed. Re-arms the one-shot latch so the
      next page can load even if the sentinel never left the viewport (with a
      large rootMargin on a short append, it usually doesn't). */
  resetKey,
}: {
  onReach: () => void;
  disabled?: boolean;
  rootMargin?: string;
  resetKey?: unknown;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  // Held in refs so re-renders don't tear down the observer mid-scroll.
  const cb = useRef(onReach);
  cb.current = onReach;
  const isDisabled = useRef(disabled);
  isDisabled.current = disabled;
  // Latch: one intersection may fire loadMore only once. Cleared when the
  // sentinel leaves the viewport, so scrolling down again re-arms it.
  const armed = useRef(true);
  // Live intersection state, so a resetKey change can tell the difference
  // between "new content pushed the sentinel off-screen" (re-arm on the next
  // approach, handled by the observer) and "content landed but the sentinel is
  // STILL in view" — where re-arming would fire again with the user stationary.
  const intersecting = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Older browsers (and jsdom) lack IO: without it the page still works, the
    // user just gets the explicit button below the feed.
    if (typeof IntersectionObserver === "undefined") return;

    // `disabled` is deliberately NOT a dependency. Toggling it would rebuild
    // the observer, and a fresh IO fires immediately for an already-intersecting
    // target — so every finished page would instantly request the next one with
    // the user stationary, looping without bound.
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        intersecting.current = hit;
        if (!hit) {
          armed.current = true; // scrolled away: allow the next approach to fire
          return;
        }
        if (isDisabled.current || !armed.current) return;
        armed.current = false;
        cb.current();
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  // New content landed. If it pushed the sentinel out of view the observer has
  // already re-armed us; if the sentinel is still on screen we deliberately stay
  // latched, so the user has to actually scroll to pull the next page.
  useEffect(() => {
    if (!intersecting.current) armed.current = true;
  }, [resetKey]);

  return <div ref={ref} aria-hidden className="h-px w-full" />;
}
