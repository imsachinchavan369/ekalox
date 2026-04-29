import { notFound } from "next/navigation";

import { ProductLandingPage } from "@/components/products/landing/ProductLandingPage";
import { ProductReviewForm } from "@/components/products/ProductReviewForm";
import { getCurrentUser } from "@/lib/auth/guard";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getProductReviews,
  getPublicReelFeed,
  getPublicReelProductDetail,
  type ProductReview,
} from "@/lib/uploads/queries";

interface ProductDetailPageProps {
  params: Promise<{ productId: string }>;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="m12 3 2.6 5.7 6.2.7-4.6 4.2 1.2 6.1-5.4-3.1-5.4 3.1 1.2-6.1-4.6-4.2 6.2-.7L12 3Z"
        fill={filled ? "#FFD700" : "none"}
        stroke={filled ? "#FFD700" : "rgba(255,255,255,0.55)"}
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function StarRating({ rating, ratingCount }: { rating: number; ratingCount: number }) {
  const filledStars = ratingCount > 0 ? Math.min(Math.max(Math.round(rating), 0), 5) : 0;

  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, index) => (
        <StarIcon key={index} filled={index < filledStars} />
      ))}
    </span>
  );
}

function getStarBreakdown(reviews: ProductReview[]) {
  return [5, 4, 3, 2, 1].map((star) => ({
    count: reviews.filter((review) => Math.round(review.rating) === star).length,
    star,
  }));
}

function ReviewsSection({
  averageRating,
  canReview,
  productId,
  ratingCount,
  reviews,
}: {
  averageRating: number;
  canReview: boolean;
  productId: string;
  ratingCount: number;
  reviews: ProductReview[];
}) {
  const ratingLabel = ratingCount > 0 ? averageRating.toFixed(1) : "No ratings";
  const starBreakdown = getStarBreakdown(reviews);

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-white">Reviews</h2>
          <p className="mt-1 text-sm text-slate-400">
            {ratingCount > 0 ? `${ratingCount} verified reviews` : "No reviews yet"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StarRating rating={averageRating} ratingCount={ratingCount} />
          <span className="text-sm font-black text-white">{ratingLabel}</span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="rounded-2xl border border-white/10 bg-black/22 p-4">
          <p className="text-sm font-black text-white">Star breakdown</p>
          <div className="mt-4 space-y-2">
            {starBreakdown.map(({ count, star }) => (
              <div key={star} className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-10">{star} star</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <span
                    className="block h-full rounded-full bg-cyan-300"
                    style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : "0%" }}
                  />
                </span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {reviews.length === 0 ? (
            <ProductReviewForm canReview={canReview} productId={productId} />
          ) : (
            reviews.slice(0, 4).map((review) => (
              <article key={review.id} className="rounded-2xl border border-white/10 bg-black/22 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-white">{review.userName}</p>
                    <p className="mt-1 text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                  <StarRating rating={review.rating} ratingCount={1} />
                </div>
                {review.text ? <p className="mt-3 text-sm leading-6 text-slate-300">{review.text}</p> : null}
              </article>
            ))
          )}
          {reviews.length > 0 ? <ProductReviewForm canReview={canReview} productId={productId} /> : null}
        </div>
      </div>
    </section>
  );
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { productId } = await params;
  const [product, allProducts, reviews, currentUser] = await Promise.all([
    getPublicReelProductDetail(productId),
    getPublicReelFeed(),
    getProductReviews(productId),
    getCurrentUser(),
  ]);

  if (!product) {
    notFound();
  }

  const supabase = await getSupabaseServerClient();
  const [{ data: paidOrder }, { data: freeClaim }] = currentUser
    ? await Promise.all([
        supabase
          .from("orders")
          .select("id")
          .eq("product_id", product.productId)
          .eq("buyer_user_id", currentUser.id)
          .in("status", ["paid", "fulfilled"])
          .maybeSingle(),
        supabase
          .from("free_claims")
          .select("id")
          .eq("product_id", product.productId)
          .eq("user_id", currentUser.id)
          .maybeSingle(),
      ])
    : [{ data: null }, { data: null }];

  const relatedProducts = allProducts
    .filter((item) => item.creatorProfileId === product.creatorProfileId && item.productId !== product.productId)
    .slice(0, 4);
  const isFree = product.ctaType === "free";
  const hasPurchased = Boolean(paidOrder);
  const canReview = Boolean(freeClaim || paidOrder);

  return (
    <ProductLandingPage
      canReview={canReview}
      hasPurchased={hasPurchased}
      isFree={isFree}
      product={product}
      relatedProducts={relatedProducts}
      reviewsSection={
        <ReviewsSection
          averageRating={product.averageRating}
          canReview={canReview}
          productId={product.productId}
          ratingCount={product.ratingCount}
          reviews={reviews}
        />
      }
    />
  );
}
