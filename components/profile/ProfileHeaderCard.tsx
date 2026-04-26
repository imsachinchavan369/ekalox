"use client";

import { NotificationBell } from "@/components/notifications/NotificationBell";
import type { UserNotification } from "@/services/notifications";
import type { ProfileIdentity } from "./types";

interface ProfileHeaderCardProps {
  identity: ProfileIdentity;
  notifications: UserNotification[];
  onSettingsOpen: () => void;
}

function getInitials(displayName: string) {
  return displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "EK";
}

export function ProfileHeaderCard({ identity, notifications, onSettingsOpen }: ProfileHeaderCardProps) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-900/80 shadow-2xl shadow-black/25">
      <div className="bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.22),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(2,6,23,0.98))] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-cyan-300/25 bg-cyan-300/12 text-2xl font-black text-cyan-100 shadow-lg backdrop-blur">
              {identity.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={identity.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                getInitials(identity.displayName)
              )}
            </div>

            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Creator Profile</p>
              <h1 className="mt-1 truncate text-2xl font-black text-white sm:text-3xl">{identity.displayName}</h1>
              <p className="mt-1 truncate text-sm font-semibold text-slate-400">@{identity.username}</p>
              <p className="mt-3 line-clamp-3 max-w-2xl text-sm leading-6 text-slate-300">{identity.bio}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell notifications={notifications} />
            <button
              type="button"
              onClick={onSettingsOpen}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] text-slate-200 transition hover:border-cyan-300/35 hover:text-white active:scale-95"
              aria-label="Open profile settings"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Zm8.25 3.75c0 .54-.05 1.06-.15 1.57l2.01 1.55-2 3.46-2.39-.96a8.3 8.3 0 0 1-2.72 1.57l-.36 2.56h-4l-.36-2.56a8.3 8.3 0 0 1-2.72-1.57l-2.39.96-2-3.46 2.01-1.55A8.4 8.4 0 0 1 3.75 12c0-.54.05-1.06.15-1.57L1.89 8.88l2-3.46 2.39.96a8.3 8.3 0 0 1 2.72-1.57l.36-2.56h4l.36 2.56a8.3 8.3 0 0 1 2.72 1.57l2.39-.96 2 3.46-2.01 1.55c.1.51.15 1.03.15 1.57Z"
                  fill="none"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
