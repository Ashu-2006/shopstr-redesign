import { Sticker } from "@/components/ui/Sticker";

/** Wordmark with a sparkle letter-swap on the middle "o" of shopstr. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`ds-display inline-flex items-center text-xl leading-none ${className}`}
    >
      sh
      <Sticker
        name="shape-sparkle-4pt"
        className="inline-block h-[0.78em] w-auto align-[-0.12em] mx-[0.02em]"
      />
      pstr
    </span>
  );
}
