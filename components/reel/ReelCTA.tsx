import { CurrencySelector } from "@/components/common/CurrencySelector";
import { ProductCTAButton } from "@/components/common/ProductCTAButton";
import { ProductPrice } from "@/components/common/ProductPrice";
import type { SupportedCurrency } from "@/lib/utils/currency";

interface ReelCTAProps {
  ctaType: string;
  currencyCode?: string;
  displayCurrency: SupportedCurrency;
  onDisplayCurrencyChange: (currency: SupportedCurrency) => void;
  priceAmount?: number;
  priceCents?: number;
  productId: string;
}

export function ReelCTA({
  ctaType,
  currencyCode,
  displayCurrency,
  onDisplayCurrencyChange,
  priceAmount,
  priceCents,
  productId,
}: ReelCTAProps) {
  const amount = priceAmount ?? (priceCents ?? 0) / 100;
  const isPaid = ctaType !== "free" && amount > 0;

  return (
    <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <ProductPrice
          amount={amount}
          className="min-w-0 max-w-full truncate text-base font-bold text-white min-[390px]:text-[17px]"
          ctaType={ctaType}
          currency={currencyCode || "INR"}
          displayCurrency={displayCurrency}
        />
        {isPaid ? (
          <div className="shrink-0 [&_label]:gap-1 [&_select]:h-8 [&_select]:rounded-full [&_select]:border-white/15 [&_select]:bg-black/45 [&_select]:px-2.5 [&_select]:text-[11px] [&_select]:text-white [&_span]:sr-only">
            <CurrencySelector
              id={`reel-display-currency-${productId}`}
              label="Currency"
              value={displayCurrency}
              onChange={onDisplayCurrencyChange}
            />
          </div>
        ) : null}
      </div>
      <ProductCTAButton ctaType={ctaType} href={`/products/${productId}`} className="min-w-[8.25rem] max-[374px]:min-w-full max-[374px]:flex-1" />
    </div>
  );
}
