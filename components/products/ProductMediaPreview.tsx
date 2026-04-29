import type { ReelProductCard } from "@/lib/uploads/queries";

interface ProductMediaPreviewProps {
  className?: string;
  mediaClassName?: string;
  media?: {
    heroImageUrl?: string | null;
    reelUrl?: string | null;
    thumbnailUrl?: string | null;
  };
  product?: ReelProductCard;
}

export function ProductMediaPreview({
  className = "",
  mediaClassName = "",
  media,
  product,
}: ProductMediaPreviewProps) {
  const heroImageUrl = media?.heroImageUrl;
  const thumbnailUrl = product?.thumbnailUrl || media?.thumbnailUrl;
  const reelUrl = product?.reelUrl || media?.reelUrl;
  const image = heroImageUrl || thumbnailUrl;

  return (
    <div className={`relative aspect-[9/16] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.24),transparent_42%),#080810] ${className}`}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className={`h-full w-full object-cover object-center ${mediaClassName}`} />
      ) : reelUrl ? (
        <video src={reelUrl} className={`h-full w-full object-cover object-center ${mediaClassName}`} muted playsInline preload="metadata" />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs font-black tracking-wide text-slate-500">
          EKALOX
        </div>
      )}
    </div>
  );
}
