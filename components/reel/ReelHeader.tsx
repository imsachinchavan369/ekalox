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
    <>
      <EkaloxLogo className="pointer-events-auto absolute left-[18px] top-[calc(18px+env(safe-area-inset-top))] h-8 max-h-[34px] w-auto drop-shadow-[0_2px_10px_rgba(0,0,0,0.78)]" />

      <button
        type="button"
        onClick={onSoundToggle}
        aria-label="Toggle reel audio"
        aria-pressed={isSoundOn}
        className={`pointer-events-auto absolute right-[18px] top-[calc(18px+env(safe-area-inset-top))] flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/40 drop-shadow-lg backdrop-blur-md transition hover:bg-black/50 active:scale-95 ${
          isSoundOn ? "text-cyan-100" : "text-white/88"
        }`}
      >
        {isSoundOn ? <VolumeOnIcon /> : <VolumeOffIcon />}
      </button>

      <div className="pointer-events-auto absolute left-[18px] right-16 top-[calc(4rem+env(safe-area-inset-top))] flex min-w-0 items-center gap-2 text-white">
        <Link
          href={creatorHref}
          aria-label={`Open ${creatorName} profile`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold drop-shadow transition hover:bg-white/20"
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
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold drop-shadow transition active:scale-95 ${
            isFollowing
              ? "border-white/40 bg-transparent text-cyan-100"
              : "border-white/40 bg-transparent text-white hover:border-white/65 hover:text-cyan-100"
          }`}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      </div>
    </>
  );
}
