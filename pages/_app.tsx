import { useEffect, useState } from "react";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { motion, MotionConfig } from "framer-motion";
import { IconContext } from "@phosphor-icons/react";
import { Agentation } from "agentation";
import { AppProviders } from "@/data/store";
import { useAppBoot } from "@/data/hooks";
import { LeftSidebar } from "@/components/ui/LeftSidebar";
import { BootScreen } from "@/components/ui/BootScreen";
import { dur, ease, tFast } from "@/lib/motion";
import "@/styles/globals.css";

/**
 * Boot gate. The splash sits OVER the app (which mounts and loads behind it),
 * so releasing it reveals real content instead of starting a second load.
 * It stays mounted through its own fade-out, then unmounts.
 * The /dev/* playgrounds skip it: they are review surfaces, and a splash in
 * front of them just costs a second per reload.
 */
function BootGate() {
  const router = useRouter();
  const { booting } = useAppBoot();
  const [mounted, setMounted] = useState(true);
  const skip = router.pathname.startsWith("/dev/");

  useEffect(() => {
    if (booting) return;
    // Matches --ds-dur-slow (560ms), the fade on BootScreen.
    const t = setTimeout(() => setMounted(false), 560);
    return () => clearTimeout(t);
  }, [booting]);

  if (skip || !mounted) return null;
  return <BootScreen leaving={!booting} />;
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  // /dev/* are standalone surfaces (playgrounds, the landing page): no app nav.
  const standalone = router.pathname.startsWith("/dev/");
  return (
    <AppProviders>
      <BootGate />
      {/* Every Phosphor icon defaults to the regular weight and inherits the
          current text color + font size (1em). Per-icon size/color/weight
          overrides still win. Regular, not duotone: duotone's second tone
          reads as a rendering artifact on functional glyphs (close, chevron,
          caret) where a single clean stroke is what the control needs. */}
      <IconContext.Provider value={{ weight: "regular", color: "currentColor", size: "1em" }}>
      {/* reducedMotion="user" makes every framer animation respect the OS setting.
          Default transition is the 140ms/smooth workhorse from lib/motion. */}
      <MotionConfig reducedMotion="user" transition={tFast}>
        {/* Persistent desktop-only left nav rail (hidden < md). Rendered OUTSIDE
            the route-fade below so it never re-fades on navigation. It's
            position:fixed, so the md:pl-20 inset on the content wrapper (not a
            transform) is what keeps page content clear of the collapsed rail. */}
        {/* /dev/* routes are standalone surfaces (playgrounds, the landing
            page): no app nav rail, and therefore no inset for it either. */}
        {!standalone && <LeftSidebar />}
        <div className={standalone ? "" : "md:pl-20"}>
        {/* Route transition is a fade-IN keyed on the route. We deliberately do
            NOT wrap this in <AnimatePresence mode="wait">: a "wait" exit keeps the
            outgoing page mounted while it animates out, and dynamic pages
            (/listing/[id], /c/[category], …) re-render with an empty route param
            during that window and flip to their "not found" branch — which could
            wedge the exit so the incoming page never mounted (the buyer flow
            appeared to dead-end on "Listing not found"). Mounting the new page
            immediately and fading it in is deadlock-proof.
            Opacity-only: a transform/filter here would re-anchor position:fixed
            children (bottom nav, buy bar) to this wrapper instead of the viewport.
            Key on pathname (not asPath) so shallow query changes — e.g. the
            checkout step in ?step= — don't remount and refade the page. */}
        <motion.div
          key={router.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: dur.moderate, ease: ease.swing }}
        >
          <Component {...pageProps} />
        </motion.div>
        </div>
      </MotionConfig>
      </IconContext.Provider>
      {process.env.NODE_ENV === "development" && <Agentation />}
    </AppProviders>
  );
}
