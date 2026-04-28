import Link from "next/link";

import { EkaloxLogo } from "@/components/common/EkaloxLogo";

interface ReelHeaderProps {
  creatorHref: string;
  creatorName: string;
  followerCount: string;
  isFollowing: boolean;
  isSoundOn: boolean;
  onFollowToggle: () => void;
  onSoundToggle: () => void;
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

function VolumeOnIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" opacity=".95" />
      <path d="M16 8.5a5 5 0 0 1 0 7M18.4 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function VolumeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" opacity=".95" />
      <path d="m16 9 5 5m0-5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

export function ReelHeader({
  creatorHref,
  creatorName,
  followerCount,
  isFollowing,
  isSoundOn,
  onFollowToggle,
  onSoundToggle,
}: ReelHeaderProps) {
  return (
    <div className="pointer-events-auto absolute left-4 right-4 top-[calc(1rem+env(safe-area-inset-top))] text-white">
      <div className="flex items-start justify-between gap-3">
        <EkaloxLogo className="h-auto w-[110px] max-w-[110px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.78)]" />
        <button
          type="button"
          onClick={onSoundToggle}
          aria-label="Toggle reel audio"
          aria-pressed={isSoundOn}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/22 drop-shadow-lg backdrop-blur-md transition hover:bg-white/[0.07] active:scale-95 ${
            isSoundOn ? "text-cyan-100" : "text-white/88"
          }`}
        >
          {isSoundOn ? <VolumeOnIcon /> : <VolumeOffIcon />}
        </button>
      </div>

      <div className="mt-4 flex min-w-0 items-center gap-2 rounded-full border border-white/[0.08] bg-black/24 py-1 pl-1 pr-2 shadow-[0_10px_28px_rgba(0,0,0,0.22)] backdrop-blur-md">
        <Link
          href={creatorHref}
          aria-label={`Open ${creatorName} profile`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.1] text-[11px] font-semibold backdrop-blur-sm transition hover:bg-white/[0.14]"
        >
          {getInitials(creatorName)}
        </Link>
        <Link
          href={creatorHref}
          className="min-w-0 max-w-[8.4rem] truncate text-[13px] font-semibold drop-shadow transition hover:text-cyan-100 min-[390px]:max-w-[10.5rem]"
        >
          @{creatorName}
        </Link>
        <button
          type="button"
          onClick={onFollowToggle}
          title={`${followerCount} followers`}
          className={`ml-auto shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold drop-shadow transition active:scale-95 ${
            isFollowing
              ? "border-cyan-200/45 bg-cyan-300/12 text-cyan-100"
              : "border-white/42 bg-transparent text-white hover:border-white/65 hover:text-cyan-100"
          }`}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      </div>
    </div>
  );
}
