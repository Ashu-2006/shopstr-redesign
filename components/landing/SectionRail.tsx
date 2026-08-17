import { useEffect, useState } from "react";

export interface RailSection {
  id: string;
  label: string;
  /** Tailwind bg for the ACTIVE cell. Each section owns its own accent, so the
      rail reads as a colour map of the page rather than one highlight colour. */
  activeBg: string;
  /** True when that accent needs white text (ink and purple only). */
  onDark?: boolean;
}

/**
 * The section index. Fixed to the viewport bottom on desktop for the whole
 * scroll: a table of contents, a progress indicator and a jump menu in one
 * component, so a long page is never disorienting.
 *
 * Active state comes from IntersectionObserver rather than scroll math, so it
 * costs nothing per frame and stays correct when sections change height.
 *
 * Mobile drops the fixed position (it would eat a third of a phone viewport and
 * collide with the app's own bottom nav) and becomes a horizontal scroller
 * pinned under the hero instead.
 */
export function SectionRail({ sections }: { sections: RailSection[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => !!el);
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        // The section occupying the most of the viewport wins, so a short
        // section sandwiched between two tall ones still gets its turn.
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (best) setActive(best.target.id);
      },
      // Bias the band toward the middle of the screen: what the user is
      // actually reading, not what has merely entered.
      { rootMargin: "-35% 0px -35% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  const cells = sections.map((s) => {
    const on = s.id === active;
    return (
      <a
        key={s.id}
        href={`#${s.id}`}
        aria-current={on ? "true" : undefined}
        className={`flex shrink-0 items-center justify-center whitespace-nowrap border-r-2 border-ink px-5 py-3.5 text-sm font-bold transition-colors duration-(--ds-dur-instant) last:border-r-0 lg:flex-1 lg:px-3 ${
          on
            ? `${s.activeBg} ${s.onDark ? "text-text-on-dark" : "text-ink"}`
            : "bg-paper-pure text-ink hover:bg-paper-2"
        }`}
      >
        {s.label}
      </a>
    );
  });

  return (
    <>
      {/* Desktop: pinned index for the whole scroll. */}
      <nav
        aria-label="Page sections"
        className="fixed inset-x-0 bottom-0 z-50 hidden border-t-2 border-ink lg:flex"
      >
        {cells}
      </nav>

      {/* Mobile: a scroller in the flow, so it never covers content. */}
      <nav
        aria-label="Page sections"
        className="no-scrollbar flex overflow-x-auto border-b-2 border-ink lg:hidden"
      >
        {cells}
      </nav>
    </>
  );
}
