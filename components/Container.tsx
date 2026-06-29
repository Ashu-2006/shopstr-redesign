import type { ReactNode } from "react";

/** Centered max-width page container. Pure presentation. */
export function Container({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full px-4" style={{ maxWidth: "var(--ds-container-max)" }}>
      {children}
    </div>
  );
}
