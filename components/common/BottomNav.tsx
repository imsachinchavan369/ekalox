"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Reels", icon: "play" },
  { href: "/products", label: "Products", icon: "grid" },
  { href: "/upload", label: "Upload", icon: "plus" },
  { href: "/profile", label: "Profile", icon: "user" },
] as const;

function getActiveTab(pathname: string) {
  if (pathname === "/") {
    return "Reels";
  }

  if (pathname === "/products" || pathname.startsWith("/products/") || pathname.startsWith("/creators/")) {
    return "Products";
  }

  if (pathname === "/upload") {
    return "Upload";
  }

  if (pathname === "/profile") {
    return "Profile";
  }

  return null;
}

export function isBottomNavPath(pathname: string) {
  return getActiveTab(pathname) !== null;
}

function NavIcon({ icon }: { icon: (typeof tabs)[number]["icon"] }) {
  if (icon === "play") {
    return (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
        <path d="M8 5.5v13l10-6.5-10-6.5Z" fill="currentColor" />
      </svg>
    );
  }

  if (icon === "grid") {
    return (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
        <path d="M5 5h6v6H5V5Zm8 0h6v6h-6V5ZM5 13h6v6H5v-6Zm8 0h6v6h-6v-6Z" fill="currentColor" />
      </svg>
    );
  }

  if (icon === "plus") {
    return (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
        <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0H5Z" fill="currentColor" />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);

  return (
    <nav className="fixed bottom-[max(0.55rem,env(safe-area-inset-bottom))] left-1/2 z-50 flex w-[calc(100%-1rem)] max-w-[25rem] -translate-x-1/2 items-center justify-around rounded-[1.55rem] border border-white/[0.07] bg-slate-950/68 px-1 py-1 text-white shadow-[0_12px_34px_rgba(0,0,0,0.36)] backdrop-blur-2xl">
      {tabs.map((tab) => {
        const isActive = tab.label === activeTab;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-[1.2rem] px-1 py-1 text-[10px] font-semibold transition active:scale-95 ${
              isActive ? "text-cyan-300" : "text-white/55 hover:bg-white/[0.035] hover:text-white"
            }`}
          >
            <NavIcon icon={tab.icon} />
            <span>{tab.label}</span>
            {isActive ? <span className="absolute bottom-0.5 h-px w-4 rounded-full bg-cyan-300/80" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
