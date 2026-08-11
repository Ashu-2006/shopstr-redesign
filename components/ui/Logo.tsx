import { Sticker } from "@/components/ui/Sticker";

/** Wordmark with a sparkle letter-swap on the middle "o" of shopstr.
    Hovering the wordmark spins the sparkle once (hover: variants are
    hover-device-gated in Tailwind v4, so touch never sticks mid-spin). */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`ds-display group inline-flex items-center text-xl leading-none ${className}`}
    >
      sh
      <Sticker
        name="shape-sparkle-4pt"
        className="inline-block h-[0.78em] w-auto align-[-0.12em] mx-[0.02em] transition-transform duration-(--ds-dur-moderate) ease-swing group-hover:rotate-360"
      />
      pstr
    </span>
  );
}
