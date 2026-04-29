import Link from "next/link";
import type { ReactNode } from "react";

import { ProductDetailCreatorRow } from "@/components/products/ProductDetailCreatorRow";
import { ProductMediaPreview } from "@/components/products/ProductMediaPreview";
import type { ReelProductCard } from "@/lib/uploads/queries";

import { ProductDescriptionText } from "./ProductDescriptionText";
import { ProductFeatureStrip } from "./ProductFeatureStrip";
import { ProductFeatureBlocks } from "./ProductFeatureBlocks";
import { ProductIncludedSection } from "./ProductIncludedSection";
import { ProductLandingHero } from "./ProductLandingHero";
import { ProductPreviewGallery } from "./ProductPreviewGallery";

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
  const basicDescription = (product.aboutText || product.caption || "").trim();
  const landingDescription = (product.landing.landingDescription || "").trim();
  const hasCustomFullDescription =
    landingDescription.length > 0 &&
    landingDescription.replace(/\r\n/g, "\n") !== basicDescription.replace(/\r\n/g, "\n");
  const hasCustomContent = Boolean(
    product.landing.heroTitle ||
    product.landing.heroSubtitle ||
    product.landing.heroImageUrl ||
    product.landing.badgeText ||
    (product.landing.previewGallery?.length ?? 0) > 0 ||
    (product.landing.includedItems?.length ?? 0) > 0 ||
    (product.landing.featureBlocks?.length ?? 0) > 0 ||
    hasCustomFullDescription,
  );
  const defaultSubtitle = basicDescription.split(/\r?\n/).find((line) => line.trim())?.trim();

  return (
    <main className="min-h-screen overflow-x-hidden bg-black px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-5 text-slate-100 sm:px-6 sm:pb-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/products" className="text-sm font-bold text-cyan-200 transition hover:text-cyan-100">
            Back to products
          </Link>
          <ProductDetailCreatorRow creatorId={product.creatorProfileId} creatorName={product.creatorName} />
        </div>

        <ProductLandingHero
          hasPurchased={hasPurchased}
          isFree={isFree}
          product={product}
          subtitle={hasCustomContent ? product.landing.heroSubtitle || undefined : defaultSubtitle}
        />

        {hasCustomContent ? (
          <>
            <ProductPreviewGallery items={product.landing.previewGallery ?? []} product={product} />
            {(product.landing.includedItems?.length ?? 0) > 0 ? (
              <ProductIncludedSection items={product.landing.includedItems ?? []} />
            ) : null}
            <ProductFeatureBlocks items={product.landing.featureBlocks ?? []} />
            {hasCustomFullDescription ? (
              <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                <h2 className="text-xl font-black text-white">Full Description</h2>
                <ProductDescriptionText className="mt-3" text={landingDescription} />
              </section>
            ) : null}
          </>
        ) : (
          <>
            <ProductFeatureStrip description={basicDescription} />
            <ProductPreviewGallery items={product.landing.previewGallery ?? []} product={product} />

            {basicDescription ? (
              <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                <h2 className="text-xl font-black text-white">Product Description</h2>
                <ProductDescriptionText className="mt-3" text={basicDescription} />
              </section>
            ) : null}

            <ProductIncludedSection items={[]} />
          </>
        )}

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
                    <ProductMediaPreview product={item} className="rounded-xl" />
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
