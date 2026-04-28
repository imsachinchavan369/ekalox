import type { ReactNode } from "react";

interface ReelOverlayProps {
  children: ReactNode;
}

export function ReelOverlay({ children }: ReelOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute inset-x-0 top-0 h-[11rem] bg-[linear-gradient(to_bottom,rgba(0,0,0,0.58)_0%,rgba(0,0,0,0.26)_54%,rgba(0,0,0,0)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[58%] bg-[linear-gradient(to_top,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.75)_38%,rgba(0,0,0,0.15)_76%,rgba(0,0,0,0)_100%)]" />
      {children}
    </div>
  );
}
