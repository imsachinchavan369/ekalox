import Link from "next/link";

import { ModerationStatusBadge } from "@/components/common/ModerationStatusBadge";
import { ProductPrice } from "@/components/common/ProductPrice";
import { RatingStars } from "@/components/common/RatingStars";
import { VerifiedByEkaloxBadge } from "@/components/common/VerifiedByEkaloxBadge";
import { ProductMediaPreview } from "@/components/products/ProductMediaPreview";
import type { ProductLandingMetadata } from "@/lib/uploads/contracts";

interface ProfileUploadCardProps {
  averageRating: number;
  category?: string | null;
  caption: string | null;
  createdAt: string;
  ctaType: string;
  downloadsCount: number;
  priceAmount: number;
  priceCurrency: string;
  productId: string;
  ratingCount: number;
  reelUrl: string | null;
  landing?: ProductLandingMetadata;
  thumbnailUrl?: string | null;
  verificationStatus?: string;
  visibility?: string;
  title: string;
}

export function ProfileUploadCard({
  averageRating,
  category,
  caption,
  createdAt,
  ctaType,
  downloadsCount,
  priceAmount,
  priceCurrency,
  productId,
  ratingCount,
  reelUrl,
  landing,
  thumbnailUrl,
  verificationStatus,
  visibility,
  title,
}: ProfileUploadCardProps) {
  const ratingLabel = ratingCount > 0 ? averageRating.toFixed(1) : "No ratings yet";

  return (
    <li className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/82 shadow-xl shadow-black/20">
      <div className="flex gap-3 p-3">
        <ProductMediaPreview
          className="w-20 shrink-0 rounded-2xl"
          media={{ heroImageUrl: landing?.heroImageUrl, reelUrl, thumbnailUrl }}
        />

        <div className="min-w-0 flex-1 py-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-sm font-black leading-5 text-white">{title}</h3>
              {caption ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{caption}</p> : null}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {verificationStatus === "verified" ? <VerifiedByEkaloxBadge /> : null}
                <ModerationStatusBadge status={verificationStatus} />
                {visibility ? (
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-300">
                    {visibility}
                  </span>
                ) : null}
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-cyan-300/12 px-2 py-1 text-[10px] font-bold uppercase text-cyan-200">
              <ProductPrice
                amount={priceAmount}
                ctaType={ctaType}
                currency={priceCurrency}
              />
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-400">
            <span className="text-slate-500">Uploaded {new Date(createdAt).toLocaleDateString()}</span>
            {category ? <span>{category}</span> : null}
            <span className="inline-flex items-center gap-1.5">
              <RatingStars rating={averageRating} sizeClassName="h-3 w-3" />
              <span>{ratingLabel}</span>
            </span>
            <span>{downloadsCount} downloads</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href={`/products/${productId}`}
              className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/16"
            >
              View product
            </Link>
            <Link
              href={`/creator/products/${productId}`}
              className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-100 transition hover:border-cyan-300/45 hover:bg-cyan-300/16"
            >
              Manage
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}
