"use client";

import Link from "next/link";
import { useState } from "react";

import { ProductDownloadAgainButton } from "@/components/products/ProductDownloadAgainButton";
import { ReviewModal } from "@/components/profile/ReviewModal";
import type { ProfileOrderItem, ProfileOrderReview } from "@/components/profile/types";

interface OrderCardProps {
  order: ProfileOrderItem;
}

export function OrderCard({ order }: OrderCardProps) {
  const [review, setReview] = useState<ProfileOrderReview | null>(order.review);
  const [reviewOpen, setReviewOpen] = useState(false);

  return (
    <li className="overflow-hidden rounded-3xl border border-cyan-300/12 bg-slate-900/82 p-3 shadow-xl shadow-black/20">
      <div className="flex gap-3">
        <Link href={`/products/${order.productId}`} className="flex aspect-[9/16] w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-black">
          {order.reelUrl ? (
            <video src={order.reelUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />
          ) : (
            <span className="px-2 text-center text-[11px] text-slate-500">No reel</span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link href={`/products/${order.productId}`} className="line-clamp-2 text-sm font-black text-white hover:text-cyan-100">
                {order.title}
              </Link>
              <p className="mt-1 truncate text-xs font-semibold text-slate-500">@{order.creatorName}</p>
            </div>
            <span className="shrink-0 rounded-full bg-cyan-300/12 px-2 py-1 text-[10px] font-bold uppercase text-cyan-200">
              {order.orderType === "free" ? "Free" : "Paid"}
            </span>
          </div>

          <p className="mt-2 text-[11px] font-semibold text-slate-500">
            {order.verifiedLabel} · {new Date(order.date).toLocaleDateString()}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ProductDownloadAgainButton productId={order.productId} />
            <button
              type="button"
              onClick={() => setReviewOpen(true)}
              className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-white transition hover:bg-white/16"
            >
              {review ? "Edit Review" : "Leave Review"}
            </button>
          </div>

          {review ? (
            <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-slate-400">
              Your review: {review.rating}/5{review.text ? ` · ${review.text}` : ""}
            </p>
          ) : null}
        </div>
      </div>

      {reviewOpen ? (
        <ReviewModal
          initialReview={review}
          onClose={() => setReviewOpen(false)}
          onSaved={setReview}
          productId={order.productId}
          title={order.title}
        />
      ) : null}
    </li>
  );
}
