"use client";

import { useEffect, useState } from "react";

import { CurrencySelector } from "@/components/common/CurrencySelector";
import { ProductPrice } from "@/components/common/ProductPrice";
import { DEFAULT_CURRENCY, normalizeCurrency, type SupportedCurrency } from "@/lib/utils/currency";

interface ProductDetailPriceProps {
  amount: number;
  ctaType: string;
  currency: string;
}

const STORAGE_KEY = "ekalox-display-currency";

export function ProductDetailPrice({ amount, ctaType, currency }: ProductDetailPriceProps) {
  const [displayCurrency, setDisplayCurrency] = useState<SupportedCurrency>(DEFAULT_CURRENCY);

  useEffect(() => {
    setDisplayCurrency(normalizeCurrency(window.localStorage.getItem(STORAGE_KEY)));
  }, []);

  const handleDisplayCurrencyChange = (nextCurrency: SupportedCurrency) => {
    setDisplayCurrency(nextCurrency);
    window.localStorage.setItem(STORAGE_KEY, nextCurrency);
    window.dispatchEvent(new Event("ekalox:display-currency"));
  };

  return (
    <div className="space-y-2">
      <ProductPrice
        amount={amount}
        className="block text-2xl font-black text-white"
        ctaType={ctaType}
        currency={currency}
        displayCurrency={displayCurrency}
      />
      <CurrencySelector
        id="product-display-currency"
        value={displayCurrency}
        onChange={handleDisplayCurrencyChange}
      />
    </div>
  );
}
