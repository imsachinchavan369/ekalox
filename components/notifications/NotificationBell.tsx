"use client";

import { useMemo, useState } from "react";

import { NotificationDrawer } from "@/components/notifications/NotificationDrawer";
import type { UserNotification } from "@/services/notifications";

interface NotificationBellProps {
  notifications: UserNotification[];
}

export function NotificationBell({ notifications }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localNotifications, setLocalNotifications] = useState(notifications);
  const unreadCount = useMemo(
    () => localNotifications.filter((notification) => !notification.isRead).length,
    [localNotifications],
  );

  async function openNotifications() {
    setIsOpen(true);

    if (unreadCount === 0) {
      return;
    }

    setLocalNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        isRead: true,
      })),
    );

    await fetch("/api/notifications/read-all", {
      method: "POST",
    }).catch(() => null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void openNotifications()}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] text-slate-200 transition hover:border-cyan-300/35 hover:text-white active:scale-95"
        aria-label="Open notifications"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            d="M18 9.8a6 6 0 0 0-12 0v2.9L4.7 15a1 1 0 0 0 .86 1.5h12.88A1 1 0 0 0 19.3 15L18 12.7V9.8Z"
            fill="none"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
          <path d="M9.75 18.25a2.25 2.25 0 0 0 4.5 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border border-slate-950 bg-cyan-300 px-1 text-[10px] font-black text-slate-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      <NotificationDrawer
        isOpen={isOpen}
        notifications={localNotifications}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
