"use client";

import { useEffect, useState } from "react";

import {
  DEFAULT_CURRENCY,
  formatPriceWithApproximation,
  normalizeCurrency,
  type SupportedCurrency,
} from "@/lib/utils/currency";

interface ProductPriceProps {
  amount: number;
  className?: string;
  currency: string;
  ctaType?: string;
  displayCurrency?: SupportedCurrency;
}

const STORAGE_KEY = "ekalox-display-currency";

export function ProductPrice({
  amount,
  className,
  currency,
  ctaType,
  displayCurrency,
}: ProductPriceProps) {
  const [storedCurrency, setStoredCurrency] = useState<SupportedCurrency>(DEFAULT_CURRENCY);

  useEffect(() => {
    setStoredCurrency(normalizeCurrency(window.localStorage.getItem(STORAGE_KEY)));

    const handleStorage = () => {
      setStoredCurrency(normalizeCurrency(window.localStorage.getItem(STORAGE_KEY)));
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("ekalox:display-currency", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("ekalox:display-currency", handleStorage);
    };
  }, []);

  return (
    <span className={className}>
      {formatPriceWithApproximation({
        amount,
        currency: normalizeCurrency(currency),
        displayCurrency: displayCurrency ?? storedCurrency,
        isFree: ctaType === "free",
      })}
    </span>
  );
}
