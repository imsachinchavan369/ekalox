import { ProductDetailActionButton } from "@/components/products/ProductDetailActionButton";
import { ProductDetailPrice } from "@/components/products/ProductDetailPrice";
import type { ReelProductCard } from "@/lib/uploads/queries";

interface ProductPricingCTAProps {
  hasPurchased: boolean;
  isFree: boolean;
  product: ReelProductCard;
}

export function ProductPricingCTA({ hasPurchased, isFree, product }: ProductPricingCTAProps) {
  return (
    <section className="grid gap-6 rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.22),transparent_34%),rgba(255,255,255,0.04)] p-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center">
      <div>
        <p className="text-xs font-black uppercase tracking-wide text-violet-300">{isFree ? "Free access" : "Premium access"}</p>
        <h2 className="mt-2 text-3xl font-black text-white">Get this product now</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Instant Access. Secure Payment. {isFree ? "Download immediately." : "Download after purchase."}
        </p>
      </div>
      <div className="rounded-3xl border border-white/10 bg-black/28 p-4">
        <ProductDetailPrice amount={product.priceAmount} ctaType={product.ctaType} currency={product.priceCurrency} />
        <div className="mt-4">
          <ProductDetailActionButton
            creatorName={product.creatorName}
            currencyCode={product.priceCurrency}
            hasPurchased={hasPurchased}
            isFree={isFree}
            priceAmount={product.priceAmount}
            priceCents={product.priceCents}
            productId={product.productId}
            thumbnailUrl={product.landing.heroImageUrl || product.thumbnailUrl || null}
            title={product.title}
          />
        </div>
      </div>
    </section>
  );
}
