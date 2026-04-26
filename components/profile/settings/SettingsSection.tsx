import type { ReactNode } from "react";

export function SettingsSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="space-y-2">
      <h3 className="px-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-300">{title}</h3>
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">{children}</div>
    </section>
  );
}
