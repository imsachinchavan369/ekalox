import type { ReactNode } from "react";

interface ReelOverlayProps {
  children: ReactNode;
}

export function ReelOverlay({ children }: ReelOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute inset-x-0 top-0 h-[30%] bg-[linear-gradient(to_bottom,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.42)_48%,rgba(0,0,0,0)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[48%] bg-[linear-gradient(to_top,rgba(0,0,0,0.74)_0%,rgba(0,0,0,0.44)_42%,rgba(0,0,0,0)_100%)]" />
      {children}
    </div>
  );
}
