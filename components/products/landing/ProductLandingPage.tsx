import Link from "next/link";
import type { ReactNode } from "react";

import { ProductDetailCreatorRow } from "@/components/products/ProductDetailCreatorRow";
import type { ReelProductCard } from "@/lib/uploads/queries";

import { ProductFeatureBlocks } from "./ProductFeatureBlocks";
import { ProductIncludedSection } from "./ProductIncludedSection";
import { ProductLandingHero } from "./ProductLandingHero";
import { ProductPreviewGallery } from "./ProductPreviewGallery";
import { ProductPricingCTA } from "./ProductPricingCTA";

interface ProductLandingPageProps {
  canReview: boolean;
  hasPurchased: boolean;
  isFree: boolean;
  product: ReelProductCard;
  relatedProducts: ReelProductCard[];
  reviewsSection: ReactNode;
}

export function ProductLandingPage({
  hasPurchased,
  isFree,
  product,
  relatedProducts,
  reviewsSection,
}: ProductLandingPageProps) {
  const fullDescription = product.landing.landingDescription || product.aboutText || product.caption;

  return (
    <main className="min-h-screen overflow-x-hidden bg-black px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-5 text-slate-100 sm:px-6 sm:pb-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/products" className="text-sm font-bold text-cyan-200 transition hover:text-cyan-100">
            Back to products
          </Link>
          <ProductDetailCreatorRow creatorId={product.creatorProfileId} creatorName={product.creatorName} />
        </div>

        <ProductLandingHero hasPurchased={hasPurchased} isFree={isFree} product={product} />
        <ProductPreviewGallery items={product.landing.previewGallery ?? []} product={product} />
        <ProductIncludedSection items={product.landing.includedItems ?? []} />
        <ProductFeatureBlocks items={product.landing.featureBlocks ?? []} />

        {fullDescription ? (
          <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-xl font-black text-white">Full Description</h2>
            <div className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-300">{fullDescription}</div>
          </section>
        ) : null}

        <ProductPricingCTA hasPurchased={hasPurchased} isFree={isFree} product={product} />

        {reviewsSection}

        <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-lg font-black text-white">More from this creator</h2>
          {relatedProducts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">No other public products from this creator yet.</p>
          ) : (
            <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {relatedProducts.map((item) => (
                <li key={item.productId}>
                  <Link href={`/products/${item.productId}`} className="block rounded-2xl border border-white/10 bg-black/26 p-3 transition hover:border-cyan-300/30">
                    <div className="aspect-[5/4] overflow-hidden rounded-xl bg-slate-950">
                      {item.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                      ) : item.reelUrl ? (
                        <video src={item.reelUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                      ) : null}
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm font-black text-white">{item.title}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
