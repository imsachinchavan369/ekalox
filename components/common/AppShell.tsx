"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { BottomNav, isBottomNavPath } from "./BottomNav";
import { Footer } from "./Footer";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const showBottomNav = isBottomNavPath(pathname);
  const isReels = pathname === "/";
  const isLegal = pathname.startsWith("/legal");

  if (isLegal) {
    return <>{children}</>;
  }

  if (!showBottomNav) {
    return (
      <>
        {children}
        <Footer />
      </>
    );
  }

  return (
    <div className={isReels ? "h-[100dvh] overflow-hidden bg-black" : "min-h-[100dvh] bg-slate-950 pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:pb-[calc(6.5rem+env(safe-area-inset-bottom))]"}>
      {children}
      {!isReels ? <Footer /> : null}
      <BottomNav />
    </div>
  );
}
