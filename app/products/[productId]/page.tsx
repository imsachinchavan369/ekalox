import Link from "next/link";
import { notFound } from "next/navigation";

import { ModerationStatusBadge } from "@/components/common/ModerationStatusBadge";
import { VerifiedByEkaloxBadge } from "@/components/common/VerifiedByEkaloxBadge";
import { ProductDetailActionButton } from "@/components/products/ProductDetailActionButton";
import { ProductDetailCreatorRow } from "@/components/products/ProductDetailCreatorRow";
import { ProductDetailPrice } from "@/components/products/ProductDetailPrice";
import { ProductPrice } from "@/components/common/ProductPrice";
import { ReportProductButton } from "@/components/products/ReportProductButton";
import { ProductReviewForm } from "@/components/products/ProductReviewForm";
import { getCurrentUser } from "@/lib/auth/guard";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getProductReviews,
  getPublicReelFeed,
  getPublicReelProductDetail,
  type ProductReview,
  type ReelProductCard,
} from "@/lib/uploads/queries";

interface ProductDetailPageProps {
  params: Promise<{ productId: string }>;
}

function formatDownloads(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }

  return `${value}`;
}

function getCategory(product: ReelProductCard) {
  const category = ((product as ReelProductCard & { category?: string | null }).category || "Uncategorized").trim();
  return category.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M12 4v9m0 0 3.5-3.5M12 13 8.5 9.5M5 18h14"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

function getStarBreakdown(reviews: ProductReview[]) {
  return [5, 4, 3, 2, 1].map((star) => ({
    count: reviews.filter((review) => Math.round(review.rating) === star).length,
    star,
  }));
}

function RelatedProductCard({ product }: { product: ReelProductCard }) {
  return (
    <li>
      <Link
        href={`/products/${product.productId}`}
        className="group block overflow-hidden rounded-2xl border border-white/10 bg-slate-900/78 shadow-lg shadow-black/15 transition hover:-translate-y-0.5 hover:border-cyan-300/25"
      >
        <div className="aspect-[5/4] overflow-hidden bg-slate-950">
          {product.reelUrl ? (
            <video
              src={product.reelUrl}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs font-bold text-slate-600">EKALOX</div>
          )}
        </div>
        <div className="space-y-2 p-3">
          <h3 className="line-clamp-2 min-h-[2.1rem] text-sm font-black leading-tight text-white">{product.title}</h3>
          <div className="flex items-center justify-between gap-2">
            <ProductPrice
              amount={product.priceAmount}
              className="truncate text-xs font-black text-white"
              ctaType={product.ctaType}
              currency={product.priceCurrency}
            />
            <span className="rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-bold text-cyan-200">
              View
            </span>
          </div>
        </div>
      </Link>
    </li>
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
  const category = getCategory(product);
  const ratingLabel = product.ratingCount > 0 ? product.averageRating.toFixed(1) : "No ratings";
  const isFree = product.ctaType === "free";
  const hasPurchased = Boolean(paidOrder);
  const canReview = Boolean(freeClaim || paidOrder);
  const starBreakdown = getStarBreakdown(reviews);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:items-start">
          <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-900/72 shadow-2xl shadow-black/25">
            <Link href={`/products/${product.productId}/reel`} className="group relative block aspect-[9/12] bg-black sm:aspect-[16/11] lg:aspect-[9/12]">
              {product.reelUrl ? (
                <video src={product.reelUrl} className="h-full w-full object-contain" muted playsInline preload="metadata" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                  Reel unavailable right now.
                </div>
              )}
              <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-xl shadow-black/30 transition group-hover:scale-105 group-hover:bg-black/70">
                <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6" aria-hidden="true">
                  <path d="M8.5 5.8v12.4L18 12 8.5 5.8Z" fill="currentColor" />
                </svg>
              </span>
            </Link>
          </div>

          <aside className="space-y-5 rounded-[1.75rem] border border-white/10 bg-slate-900/72 p-5 shadow-xl shadow-black/18 lg:sticky lg:top-5">
            <Link href="/products" className="inline-flex text-sm font-semibold text-cyan-300 transition hover:text-cyan-200">
              Back to products
            </Link>

            <ProductDetailCreatorRow creatorId={product.creatorProfileId} creatorName={product.creatorName} />

            <div>
              <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">{product.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {product.verificationStatus === "verified" ? <VerifiedByEkaloxBadge /> : null}
                <ModerationStatusBadge status={product.verificationStatus} />
              </div>
            </div>

            <ProductDetailPrice
              amount={product.priceAmount}
              ctaType={product.ctaType}
              currency={product.priceCurrency}
            />

            <div className="flex flex-col gap-3">
              <ProductDetailActionButton
                creatorName={product.creatorName}
                currencyCode={product.priceCurrency}
                hasPurchased={hasPurchased}
                isFree={isFree}
                priceAmount={product.priceAmount}
                priceCents={product.priceCents}
                productId={product.productId}
                thumbnailUrl={null}
                title={product.title}
              />
              <Link
                href={`/products/${product.productId}/reel`}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/12 px-5 py-2.5 text-sm font-black text-white transition hover:border-cyan-300/35 hover:text-cyan-100 active:scale-95"
              >
                Watch Reel
              </Link>
              <ReportProductButton productId={product.productId} />
            </div>

            <div className="grid grid-cols-3 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
              <div className="flex min-h-[7rem] flex-col items-center justify-center border-r border-white/10 p-3 text-center">
                <StarRating rating={product.averageRating} ratingCount={product.ratingCount} />
                <p className="mt-1 text-sm font-black text-white">{product.ratingCount > 0 ? ratingLabel : "No ratings yet"}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Rating</p>
              </div>
              <div className="flex min-h-[7rem] flex-col items-center justify-center border-r border-white/10 p-3 text-center">
                <p className="inline-flex items-center justify-center gap-1 text-sm font-black text-white">
                  <DownloadIcon />
                  {formatDownloads(product.downloadsCount)}
                </p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Downloads</p>
              </div>
              <div className="flex min-h-[7rem] flex-col items-center justify-center p-3 text-center">
                <p className="max-w-full truncate text-sm font-black text-white">{category}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Category</p>
              </div>
            </div>
          </aside>
        </section>

        <section className="space-y-6">
          <section className="rounded-[1.5rem] border border-white/10 bg-slate-900/64 p-5">
            <h2 className="text-lg font-black text-white">About this product</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {product.caption ||
                "Explore this EKALOX digital product through its reel preview, then open the product action when you are ready."}
            </p>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-slate-900/64 p-5">
            <h2 className="text-lg font-black text-white">What you get</h2>
            <ul className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
              <li className="rounded-2xl bg-white/[0.035] p-3">Product files or access after checkout/claim</li>
              <li className="rounded-2xl bg-white/[0.035] p-3">Reel preview for quick product context</li>
              <li className="rounded-2xl bg-white/[0.035] p-3">Creator-provided digital format</li>
              <li className="rounded-2xl bg-white/[0.035] p-3">Basic personal usage access unless stated otherwise</li>
            </ul>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-slate-900/64 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-white">Reviews</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {product.ratingCount > 0 ? `${product.ratingCount} verified reviews` : "No reviews yet"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StarRating rating={product.averageRating} ratingCount={product.ratingCount} />
                <span className="text-sm font-black text-white">{product.ratingCount > 0 ? ratingLabel : "No ratings yet"}</span>
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[18rem_minmax(0,1fr)]">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
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
                  <ProductReviewForm canReview={canReview} productId={product.productId} />
                ) : (
                  reviews.slice(0, 4).map((review) => (
                    <article key={review.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
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
                {reviews.length > 0 ? <ProductReviewForm canReview={canReview} productId={product.productId} /> : null}
              </div>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-slate-900/64 p-5">
            <h2 className="text-lg font-black text-white">More from this creator</h2>
            {relatedProducts.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">No other public products from this creator yet.</p>
            ) : (
              <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {relatedProducts.map((relatedProduct) => (
                  <RelatedProductCard key={relatedProduct.productId} product={relatedProduct} />
                ))}
              </ul>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
