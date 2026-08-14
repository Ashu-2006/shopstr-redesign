/* Toast primitive. The only transient notice surface in the app.
   Enter: the `.toast-in` CSS TRANSITION (not a keyframe). Toasts can be
   re-triggered rapidly, and a keyframe restarts from zero every time, so a
   second toast arriving mid-animation visibly snaps back. A transition can be
   interrupted and retargeted from wherever it currently sits. The mounted flag
   flips one frame after mount so the browser has a "from" state.
   Exit: framer tExit, so pages wrap it in <AnimatePresence>.
   Pure presentation: pages own the message state and the dismiss timer.
   Sits above the bottom nav / buy bar (both z-40). */

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { tExit } from "@/lib/motion";

export function Toast({
  children,
  action,
}: {
  children: ReactNode;
  /** Optional trailing action, e.g. a "View cart" link. */
  action?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // rAF (not a 0ms timeout) so the initial state is painted first; otherwise
    // React can batch both states into one frame and the transition never runs.
    const r = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(r);
  }, []);

  return (
    <motion.div
      role="status"
      data-mounted={mounted}
      exit={{ opacity: 0, transform: "translateY(8px)", transition: tExit }}
      className="toast-in pointer-events-none fixed inset-x-0 bottom-28 z-50 flex justify-center px-4 lg:bottom-8"
    >
      <div className="pointer-events-auto flex items-center gap-3 rounded-pill border-2 border-ink bg-ink px-5 py-3 text-sm font-bold text-text-on-dark">
        {children}
        {action}
      </div>
    </motion.div>
  );
}
