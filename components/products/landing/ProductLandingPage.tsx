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
  const customization = product.customization;
  const basicDescription = (product.aboutText || product.caption || "").trim();
  const customDescription = (customization.landingDescription || "").trim();
  const normalizedBasicDescription = basicDescription.replace(/\r\n/g, "\n");
  const normalizedHeroSubtitle = (customization.heroSubtitle || "").trim().replace(/\r\n/g, "\n");
  const normalizedCustomDescription = customDescription.replace(/\r\n/g, "\n");
  const shouldRenderCustomDescription = Boolean(
    customDescription &&
    normalizedCustomDescription !== normalizedBasicDescription &&
    normalizedCustomDescription !== normalizedHeroSubtitle,
  );
  const hasCustomContent = Boolean(
    customization.heroTitle ||
    customization.heroSubtitle ||
    customization.heroImage ||
    customization.heroImageUrl ||
    customization.badgeText ||
    (customization.galleryImages?.length ?? customization.previewGallery?.length ?? 0) > 0 ||
    (customization.includes?.length ?? customization.includedItems?.length ?? 0) > 0 ||
    (customization.features?.length ?? customization.featureBlocks?.length ?? 0) > 0 ||
    (customization.extraSections?.length ?? 0) > 0 ||
    customization.pricingBox?.heading ||
    customization.pricingBox?.note ||
    shouldRenderCustomDescription,
  );
  const defaultSubtitle = basicDescription.split(/\r?\n/).find((line) => line.trim())?.trim();
  const customGalleryItems = customization.galleryImages ?? customization.previewGallery ?? [];
  const fallbackGalleryItems = product.thumbnailUrl || product.reelUrl
    ? [{
        description: null,
        displayOrder: 1,
        imageUrl: product.thumbnailUrl || null,
        title: "Preview",
      }]
    : [];
  const galleryItems = customGalleryItems.length > 0 ? customGalleryItems : fallbackGalleryItems;
  const featureItems = customization.features ?? customization.featureBlocks ?? [];
  const includedItems = customization.includes ?? customization.includedItems ?? [];

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
          subtitle={hasCustomContent ? customization.heroSubtitle || defaultSubtitle : defaultSubtitle}
        />

        {hasCustomContent ? (
          <>
            <ProductPreviewGallery items={galleryItems} product={product} />
            {includedItems.length > 0 ? (
              <ProductIncludedSection items={includedItems} />
            ) : null}
            <ProductFeatureBlocks items={featureItems} />
            {shouldRenderCustomDescription ? (
              <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                <h2 className="text-xl font-black text-white">Details</h2>
                <ProductDescriptionText className="mt-3" text={customDescription} />
              </section>
            ) : null}
            {(customization.extraSections ?? []).map((section) => (
              <section key={section.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                <h2 className="text-xl font-black text-white">{section.title}</h2>
                {section.body ? <ProductDescriptionText className="mt-3" text={section.body} /> : null}
              </section>
            ))}
          </>
        ) : (
          <>
            <ProductFeatureStrip description={basicDescription} />
            <ProductPreviewGallery items={galleryItems} product={product} />

            {basicDescription ? (
              <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                <h2 className="text-xl font-black text-white">Product Description</h2>
                <ProductDescriptionText className="mt-3" text={basicDescription} />
              </section>
            ) : null}

            <ProductIncludedSection items={[]} />
          </>
        )}

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
