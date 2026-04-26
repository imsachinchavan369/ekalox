"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useCreatorFollows } from "@/hooks/use-creator-follows";

interface CreatorStorefrontHeaderProps {
  creatorId: string;
  creatorName: string;
  followingCount: number;
  productCount: number;
  totalDownloads: number;
}

export function CreatorStorefrontHeader({
  creatorId,
  creatorName,
  followingCount,
  productCount,
  totalDownloads,
}: CreatorStorefrontHeaderProps) {
  const creatorIds = useMemo(() => [creatorId], [creatorId]);
  const { getFollowerCount, isFollowing, loginPrompt, toggleFollow } = useCreatorFollows(creatorIds);

  return (
    <div className="space-y-4 rounded-[1.75rem] border border-white/10 bg-slate-900/76 p-5 shadow-xl shadow-black/20">
      <Link href="/" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">
        Back to reels
      </Link>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.06] text-xl font-black text-white">
          {creatorName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Creator Storefront</p>
          <h1 className="truncate text-2xl font-black text-white">@{creatorName}</h1>
          <p className="text-sm text-slate-400">Verified digital product reels and downloads.</p>
        </div>
        <button
          type="button"
          onClick={() => void toggleFollow(creatorId)}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
            isFollowing(creatorId)
              ? "border-cyan-200/45 bg-cyan-300/12 text-cyan-100"
              : "border-white/35 text-white hover:border-white/60"
          }`}
        >
          {isFollowing(creatorId) ? "Following" : "Follow"}
        </button>
      </div>
      {loginPrompt ? <p className="text-xs font-semibold text-cyan-200">{loginPrompt}</p> : null}

      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-2xl bg-white/[0.045] p-3 text-center">
          <p className="text-lg font-black text-white">{getFollowerCount(creatorId)}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Followers</p>
        </div>
        <div className="rounded-2xl bg-white/[0.045] p-3 text-center">
          <p className="text-lg font-black text-white">{followingCount}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Following</p>
        </div>
        <div className="rounded-2xl bg-white/[0.045] p-3 text-center">
          <p className="text-lg font-black text-white">{productCount}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Products</p>
        </div>
        <div className="rounded-2xl bg-white/[0.045] p-3 text-center">
          <p className="text-lg font-black text-white">{totalDownloads}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Downloads</p>
        </div>
      </div>
    </div>
  );
}
