/* Sticker / asset renderer. SVGs live in public/assets (served at /assets/*).
   Three modes — decoration (default), button (interactive), and inline glyph for
   letter-swaps. Pure presentation. */

export type StickerName =
  | "badge-bff-star"
  | "badge-love-heart"
  | "badge-new-arch"
  | "badge-new-oval"
  | "badge-new-round"
  | "badge-new-speech"
  | "shape-daisy-pair"
  | "shape-daisy-sm"
  | "shape-daisy-yellow"
  | "shape-diamond-circle"
  | "shape-hand"
  | "shape-heart-circle"
  | "shape-radial-disc"
  | "shape-rainbow-arc"
  | "shape-shooting-star"
  | "shape-smiley"
  | "shape-sparkle-4pt"
  | "shape-starburst"
  | "shape-sun-rays"
  | "shape-sunstar-purple"
  | "shape-sunstar-yellow";

export function stickerSrc(name: StickerName): string {
  return `/assets/${name}.svg`;
}

/**
 * Decorative sticker — position it absolutely via className/style at the call site.
 * Decorative only, so it's aria-hidden and never a pointer target.
 */
export function Sticker({
  name,
  className = "",
  style,
}: {
  name: StickerName;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={stickerSrc(name)}
      alt=""
      aria-hidden
      className={className}
      style={style}
      draggable={false}
    />
  );
}
