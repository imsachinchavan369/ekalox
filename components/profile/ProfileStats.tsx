"use client";

import { useMemo } from "react";

import { useCreatorFollows } from "@/hooks/use-creator-follows";

import type { ProfileDashboardStats } from "./types";

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-center shadow-lg shadow-black/10">
      <p className="truncate text-lg font-black text-white">{value}</p>
      <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

export function ProfileStats({ creatorProfileId, productCount, totalDownloads }: ProfileDashboardStats) {
  const creatorIds = useMemo(() => (creatorProfileId ? [creatorProfileId] : []), [creatorProfileId]);
  const { getFollowerCount, getFollowingCount } = useCreatorFollows(creatorIds);
  const followersCount = creatorProfileId ? getFollowerCount(creatorProfileId) : 0;

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatBox label="Followers" value={followersCount} />
      <StatBox label="Following" value={getFollowingCount()} />
      <StatBox label="Products" value={productCount} />
      <StatBox label="Downloads" value={totalDownloads} />
    </section>
  );
}
