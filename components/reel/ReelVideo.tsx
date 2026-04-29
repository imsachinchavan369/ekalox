import type { Ref } from "react";

interface ReelVideoProps {
  videoRef: Ref<HTMLVideoElement>;
  src: string;
  poster?: string | null;
  muted: boolean;
  autoPlay: boolean;
  onPlay: () => void;
}

export function ReelVideo({ videoRef, src, poster, muted, autoPlay, onPlay }: ReelVideoProps) {
  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster || undefined}
      className="h-full max-h-full w-full max-w-full object-contain"
      muted={muted}
      playsInline
      preload="metadata"
      autoPlay={autoPlay}
      loop
      onPlay={onPlay}
    />
  );
}
