/* Toast primitive. The only transient notice surface in the app.
   Enter: the CSS `.toast-in` keyframe (rises from the edge it lives on with a
   1% overshoot). Exit: framer tExit, so pages wrap it in <AnimatePresence>.
   Pure presentation: pages own the message state and the dismiss timer.
   Sits above the bottom nav / buy bar (both z-40). */

import type { ReactNode } from "react";
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
  return (
    <motion.div
      role="status"
      exit={{ opacity: 0, y: 8, transition: tExit }}
      className="toast-in pointer-events-none fixed inset-x-0 bottom-28 z-50 flex justify-center px-4 lg:bottom-8"
    >
      <div className="pointer-events-auto flex items-center gap-3 rounded-pill border-2 border-ink bg-ink px-5 py-3 text-sm font-bold text-text-on-dark">
        {children}
        {action}
      </div>
    </motion.div>
  );
}
