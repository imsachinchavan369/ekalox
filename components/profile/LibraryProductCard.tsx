import Link from "next/link";

import { ProductDownloadAgainButton } from "@/components/products/ProductDownloadAgainButton";

interface LibraryProductCardProps {
  productId: string;
  reelUrl: string | null;
  title: string;
}

export function LibraryProductCard({ productId, reelUrl, title }: LibraryProductCardProps) {
  return (
    <li className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/82 p-3 shadow-xl shadow-black/20">
      <div className="flex gap-3">
        <Link href={`/products/${productId}`} className="flex aspect-[9/16] w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-black">
          {reelUrl ? (
            <video src={reelUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />
          ) : (
            <span className="px-2 text-center text-[11px] text-slate-500">No reel</span>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/products/${productId}`} className="line-clamp-2 text-sm font-black text-white hover:text-cyan-100">
            {title}
          </Link>
          <div className="mt-3">
            <ProductDownloadAgainButton productId={productId} />
          </div>
        </div>
      </div>
    </li>
  );
}
