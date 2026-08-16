import type { ReactNode } from "react";
import { SheetHeader } from "@/components/ui/SheetHeader";
import { BottomNav } from "@/components/ui/BottomNav";

/** One frame for every settings detail page, so back-navigation, measure, and
    spacing are identical across them. Pure presentation. */
export function SettingsShell({
  title,
  lead,
  children,
}: {
  title: string;
  /** One line under the heading explaining what this screen controls. */
  lead?: string;
  children: ReactNode;
}) {
  return (
    <>
      <SheetHeader title={title} backTo="/settings" contentMax="max-w-[760px]" />
      <main className="mx-auto max-w-[760px] px-4 pb-28 pt-4 md:pb-12">
        {lead && <p className="mb-4 text-[0.94rem] text-text-muted">{lead}</p>}
        {children}
      </main>
      <BottomNav active="/profile" />
    </>
  );
}

/** A titled group of controls inside a settings page. */
export function SettingsSection({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <h2 className="ds-display text-lg">{title}</h2>
        {note && <span className="font-mono text-[0.66rem] text-text-subtle">{note}</span>}
      </div>
      {children}
    </section>
  );
}

/** The shared field shell: label, control, optional inline error. */
export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[0.66rem] uppercase tracking-[0.08em] text-text-muted">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="text-[0.78rem] font-semibold text-red">{error}</span>
      ) : hint ? (
        <span className="text-[0.76rem] text-text-subtle">{hint}</span>
      ) : null}
    </label>
  );
}

export const settingsInput =
  "w-full rounded-md border-2 border-ink bg-paper-pure px-3.5 py-3 text-[0.92rem] outline-none focus:border-purple";
