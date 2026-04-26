"use client";

import type { UserNotification } from "@/services/notifications";

interface NotificationDrawerProps {
  isOpen: boolean;
  notifications: UserNotification[];
  onClose: () => void;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function NotificationDrawer({ isOpen, notifications, onClose }: NotificationDrawerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/60 px-3 py-3 backdrop-blur-sm sm:px-5">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close notifications" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950 shadow-2xl shadow-black/45">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Updates</p>
            <h2 className="text-lg font-black text-white">Notifications</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-300 transition hover:border-cyan-300/35 hover:text-white"
            aria-label="Close notifications"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {notifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-5 text-sm text-slate-400">
              No notifications yet.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`rounded-2xl border p-4 ${
                    notification.isRead
                      ? "border-white/10 bg-white/[0.03]"
                      : "border-cyan-300/25 bg-cyan-300/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-black text-white">{notification.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">{notification.message}</p>
                    </div>
                    {!notification.isRead ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-300" /> : null}
                  </div>
                  <p className="mt-3 text-xs font-semibold text-slate-500">{formatDate(notification.createdAt)}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
