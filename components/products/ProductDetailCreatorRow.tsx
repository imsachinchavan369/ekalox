"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useCreatorFollows } from "@/hooks/use-creator-follows";
import { getCreatorHref } from "@/lib/reels/creator-routing";

interface ProductDetailCreatorRowProps {
  creatorId: string;
  creatorName: string;
}

function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "E"
  );
}

export function ProductDetailCreatorRow({ creatorId, creatorName }: ProductDetailCreatorRowProps) {
  const creatorIds = useMemo(() => [creatorId], [creatorId]);
  const { isFollowing, toggleFollow } = useCreatorFollows(creatorIds);
  const creatorHref = getCreatorHref(creatorId);
  const followed = isFollowing(creatorId);

  return (
    <div className="flex items-center gap-3">
      <Link
        href={creatorHref}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-2.5 transition hover:border-cyan-300/25 hover:bg-white/[0.055]"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-300/12 text-sm font-black text-cyan-100">
          {getInitials(creatorName)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-black text-white">{creatorName}</span>
          <span className="block truncate text-xs font-semibold text-slate-400">@{creatorName}</span>
        </span>
      </Link>
      <button
        type="button"
        onClick={() => void toggleFollow(creatorId)}
        className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black transition active:scale-95 ${
          followed
            ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
            : "border-white/20 text-white hover:border-cyan-300/45 hover:text-cyan-100"
        }`}
      >
        {followed ? "Following" : "Follow"}
      </button>
    </div>
  );
}
