import type { ReelProductCard } from "@/lib/uploads/queries";

import { ProductCardPremium } from "./ProductCardPremium";

interface FeaturedProductsSectionProps {
  products: ReelProductCard[];
  title: string;
  subtitle: string;
}

export function FeaturedProductsSection({ products, subtitle, title }: FeaturedProductsSectionProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCardPremium key={product.productId} product={product} />
        ))}
      </div>
    </section>
  );
}
