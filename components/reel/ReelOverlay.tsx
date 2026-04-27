import type { ReactNode } from "react";

interface ReelOverlayProps {
  children: ReactNode;
}

export function ReelOverlay({ children }: ReelOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute inset-x-0 top-0 h-[28%] bg-[linear-gradient(to_bottom,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.56)_42%,rgba(0,0,0,0)_100%)]" />
      <div className="absolute bottom-0 left-0 h-[42%] w-full bg-[linear-gradient(to_top,rgba(0,0,0,0.82)_0%,rgba(0,0,0,0.52)_38%,rgba(0,0,0,0)_78%)]" />
      {children}
    </div>
  );
}
