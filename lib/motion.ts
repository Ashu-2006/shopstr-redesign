/* Motion tokens for Framer Motion — the JS mirror of the CSS motion block in
   styles/design-system.css. Four durations on a ~2x scale, four curves; that is
   the whole vocabulary. Keep both files in sync.

   The entrance shape everywhere: fade in fast, overshoot 2-5%, settle. Opacity
   resolves before the transform does, so content is readable while it is still
   settling. */

/** Durations in seconds (Framer Motion's unit). */
export const dur = {
  /** 70ms — micro-feedback: icon opacity, row hover, press. */
  instant: 0.07,
  /** 140ms — THE WORKHORSE: hover, focus, color, most transitions. */
  fast: 0.14,
  /** 300ms — entrances: menus, popovers, step changes, list items. */
  moderate: 0.3,
  /** 560ms — large travel: drawers, page-level moves, image zoom. */
  slow: 0.56,
} as const;

/** Easing curves as cubic-bezier tuples. */
export const ease = {
  /** Symmetric, neutral. Default when nothing should call attention. */
  smooth: [0.45, 0.05, 0.55, 0.95],
  /** Max velocity at t=0, decelerates into place. Panels, slides, anything
      that should read as responsive rather than animated. */
  swing: [0, 0.55, 0.45, 1],
  /** Hesitates, then commits. Exits and dismissals. */
  exit: [0.65, 0.05, 0.36, 1],
  /** Overshoots both ends. Sticker pops only — one per screen, sparingly. */
  jumpy: [0.68, -0.55, 0.27, 1.55],
} as const;

/* ------------------------------------------------------------- TRANSITIONS */

/** Default tween: 140ms smooth. */
export const tFast = { duration: dur.fast, ease: ease.smooth };
/** Entrance tween: 300ms swing (already moving on frame one). */
export const tEnter = { duration: dur.moderate, ease: ease.swing };
/** Exit tween: faster than entry — the user already decided to dismiss. */
export const tExit = { duration: dur.fast, ease: ease.exit };
/** Layout smart-animate (persistent cards, shared elements). */
export const tLayout = { duration: dur.moderate, ease: ease.swing };

/* ---------------------------------------------------------------- VARIANTS */

/** List/feed item enter-exit. Pair with AnimatePresence. */
export const riseIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: tEnter },
  exit: { opacity: 0, y: -6, transition: tExit },
};

/** Small surface pop (badges, chips, sticker reveals). Bulges, never zooms. */
export const popIn = {
  initial: { opacity: 0, scale: 1 },
  animate: {
    opacity: 1,
    scale: [1, 1.02, 1.05, 1],
    transition: { duration: dur.moderate, ease: ease.smooth },
  },
  exit: { opacity: 0, transition: tExit },
};

/** Badge bump when a live count changes (cart). */
export const bump = {
  scale: [1.3, 1],
  transition: { duration: dur.moderate, ease: ease.smooth },
};

/** Error shake — three decaying swings over one moderate beat. */
export const shake = {
  x: [0, -8, 8, -6, 6, 0],
  transition: { duration: dur.moderate + dur.fast, ease: ease.smooth },
};
