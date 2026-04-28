import type { ReactNode } from "react";

interface ReelOverlayProps {
  children: ReactNode;
}

export function ReelOverlay({ children }: ReelOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute inset-x-0 bottom-0 h-[40%] bg-[linear-gradient(to_top,rgba(0,0,0,0.85),rgba(0,0,0,0.4),transparent)]" />
      {children}
    </div>
  );
}
