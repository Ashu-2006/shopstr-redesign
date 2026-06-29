import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { Agentation } from "agentation";
import { AppProviders } from "@/data/store";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  return (
    <AppProviders>
      {/* reducedMotion="user" makes every framer animation respect the OS setting. */}
      <MotionConfig reducedMotion="user" transition={{ type: "spring", bounce: 0, duration: 0.35 }}>
        {/* Route transition is OPACITY-ONLY: a transform/filter here would make
            position:fixed children (bottom nav, buy bar) anchor to this wrapper
            instead of the viewport. Movement is added inside pages via layout
            animations and staggered reveals. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={router.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          >
            <Component {...pageProps} />
          </motion.div>
        </AnimatePresence>
      </MotionConfig>
      {process.env.NODE_ENV === "development" && <Agentation />}
    </AppProviders>
  );
}
