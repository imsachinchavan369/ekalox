import Link from "next/link";

import { ProductPrice } from "@/components/common/ProductPrice";
import { VerifiedByEkaloxBadge } from "@/components/common/VerifiedByEkaloxBadge";
import { ProductCTAButton } from "@/components/common/ProductCTAButton";
import { getCreatorHref } from "@/lib/reels/creator-routing";
import type { SupportedCurrency } from "@/lib/utils/currency";
import type { ReelProductCard } from "@/lib/uploads/queries";

interface ProductCardProps {
  displayCurrency?: SupportedCurrency;
  product: ReelProductCard;
}

export function ProductCard({ displayCurrency, product }: ProductCardProps) {
  const productHref = `/products/${product.productId}`;
  const reelHref = `/products/${product.productId}/reel`;

  return (
    <li className="group min-w-0">
      <article className="flex h-full min-h-[14.25rem] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 shadow-[0_18px_42px_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 hover:border-cyan-300/28 hover:bg-slate-900">
        <div className="relative aspect-[5/4] overflow-hidden bg-slate-950">
          <Link href={reelHref} className="absolute inset-0 z-10" aria-label={`Preview reel for ${product.title}`}>
            <span className="sr-only">Preview product reel</span>
          </Link>
          {product.reelUrl ? (
            <video
              src={product.reelUrl}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_42%),#020617] px-3 text-center text-xs font-semibold text-slate-500">
              EKALOX
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/58 to-transparent" />
          {product.verificationStatus === "verified" ? (
            <div className="absolute left-3 top-3 z-20">
              <VerifiedByEkaloxBadge />
            </div>
          ) : null}
          {product.reelUrl ? (
            <Link
              href={reelHref}
              aria-label={`Watch reel for ${product.title}`}
              className="absolute left-1/2 top-1/2 z-20 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/52 text-white shadow-[0_8px_22px_rgba(0,0,0,0.28)] transition hover:scale-105 hover:bg-black/68 active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="ml-0.5 h-[18px] w-[18px]" aria-hidden="true">
                <path d="M8.5 5.8v12.4L18 12 8.5 5.8Z" fill="currentColor" />
              </svg>
            </Link>
          ) : (
            <span className="absolute left-1/2 top-1/2 z-20 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white/55">
              <svg viewBox="0 0 24 24" className="ml-0.5 h-[18px] w-[18px]" aria-hidden="true">
                <path d="M8.5 5.8v12.4L18 12 8.5 5.8Z" fill="currentColor" />
              </svg>
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-3.5">
          <div className="min-w-0">
            <Link
              href={productHref}
              className="line-clamp-2 min-h-[2.25rem] text-[14.5px] font-black leading-[1.16] text-white transition hover:text-cyan-100 sm:text-[15.5px]"
            >
              {product.title}
            </Link>
            <Link
              href={getCreatorHref(product.creatorProfileId)}
              className="mt-1 block truncate text-xs font-semibold text-slate-400 transition hover:text-cyan-200"
            >
              @{product.creatorName}
            </Link>
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/10 pt-3">
            <ProductPrice
              amount={product.priceAmount}
              className="min-w-0 truncate text-sm font-black text-white"
              ctaType={product.ctaType}
              currency={product.priceCurrency}
              displayCurrency={displayCurrency}
            />
            <ProductCTAButton ctaType={product.ctaType} href={productHref} label="View" size="sm" />
          </div>
        </div>
      </article>
    </li>
  );
}
