import type { ReactNode } from "react";

interface ReelOverlayProps {
  children: ReactNode;
}

export function ReelOverlay({ children }: ReelOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute bottom-0 left-0 h-[35%] w-full bg-[linear-gradient(to_top,rgba(0,0,0,0.75)_0%,rgba(0,0,0,0.45)_35%,rgba(0,0,0,0)_70%)]" />
      {children}
    </div>
  );
}
