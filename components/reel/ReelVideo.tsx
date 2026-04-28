import type { Ref } from "react";

interface ReelVideoProps {
  videoRef: Ref<HTMLVideoElement>;
  src: string;
  muted: boolean;
  autoPlay: boolean;
  onPlay: () => void;
}

export function ReelVideo({ videoRef, src, muted, autoPlay, onPlay }: ReelVideoProps) {
  return (
    <video
      ref={videoRef}
      src={src}
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
