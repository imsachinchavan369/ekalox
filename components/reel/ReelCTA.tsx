import { ProductCTAButton } from "@/components/common/ProductCTAButton";
import { ProductPrice } from "@/components/common/ProductPrice";

interface ReelCTAProps {
  ctaType: string;
  currencyCode?: string;
  priceAmount?: number;
  priceCents?: number;
  productId: string;
}

export function ReelCTA({ ctaType, currencyCode, priceAmount, priceCents, productId }: ReelCTAProps) {
  return (
    <div className="pointer-events-auto flex items-center justify-between gap-3">
      <ProductPrice
        amount={priceAmount ?? (priceCents ?? 0) / 100}
        className="min-w-0 text-base font-semibold text-white"
        ctaType={ctaType}
        currency={currencyCode || "INR"}
      />
      <ProductCTAButton ctaType={ctaType} href={`/products/${productId}`} />
    </div>
  );
}
