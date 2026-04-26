import type { ReactNode } from "react";

import { LegalFooter } from "@/components/legal/LegalFooter";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950">
      {children}
      <LegalFooter />
    </div>
  );
}
