import { EkaloxLogo } from "@/components/common/EkaloxLogo";
import type { ReelProductCard } from "@/lib/uploads/queries";

import { FeaturedProductsSection } from "./FeaturedProductsSection";
import { HomeHeroSection } from "./HomeHeroSection";

interface HomePageProps {
  products: ReelProductCard[];
}

export function HomePage({ products }: HomePageProps) {
  const featuredProduct = products.find((product) => product.landing.isFeatured) ?? products[0] ?? null;
  const premiumProducts = products
    .filter((product) => product.ctaType !== "free" && product.productId !== featuredProduct?.productId)
    .slice(0, 6);
  const freeProducts = products
    .filter((product) => product.ctaType === "free" && product.productId !== featuredProduct?.productId)
    .slice(0, 6);

  return (
    <main className="min-h-screen overflow-x-hidden bg-black px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-5 text-slate-100 sm:px-6 sm:pb-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <header className="flex items-center justify-between gap-4">
          <EkaloxLogo />
          <div className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs font-black uppercase tracking-wide text-violet-100">
            Digital Marketplace
          </div>
        </header>

        <HomeHeroSection product={featuredProduct} />
        <FeaturedProductsSection
          products={premiumProducts}
          subtitle="Paid digital products with creator reels, secure checkout, and instant access after purchase."
          title="Premium Products"
        />
        <FeaturedProductsSection
          products={freeProducts}
          subtitle="Claim useful creator files instantly with the existing free download flow."
          title="Free Products"
        />
      </div>
    </main>
  );
}
