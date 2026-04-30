"use client";

import { useEffect, useState } from "react";

import {
  DEFAULT_CURRENCY,
  formatPriceWithApproximation,
  normalizeCurrency,
  type SupportedCurrency,
} from "@/lib/utils/currency";
import {
  convertDisplayCurrency,
  getCachedDisplayExchangeRates,
  loadDisplayExchangeRates,
  type DisplayExchangeRates,
} from "@/lib/utils/display-currency";

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
  const [exchangeRates, setExchangeRates] = useState<DisplayExchangeRates | null>(null);

  useEffect(() => {
    setStoredCurrency(normalizeCurrency(window.localStorage.getItem(STORAGE_KEY)));
    setExchangeRates(getCachedDisplayExchangeRates());

    const handleStorage = () => {
      setStoredCurrency(normalizeCurrency(window.localStorage.getItem(STORAGE_KEY)));
      setExchangeRates(getCachedDisplayExchangeRates());
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("ekalox:display-currency", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("ekalox:display-currency", handleStorage);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    loadDisplayExchangeRates().then((rates) => {
      if (isMounted) {
        setExchangeRates(rates);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const sourceCurrency = normalizeCurrency(currency);
  const selectedDisplayCurrency = displayCurrency ?? storedCurrency;
  const convertedAmount =
    sourceCurrency === selectedDisplayCurrency
      ? amount
      : convertDisplayCurrency(amount, sourceCurrency, selectedDisplayCurrency, exchangeRates);

  return (
    <span className={className}>
      {formatPriceWithApproximation({
        amount,
        convertedAmount,
        currency: sourceCurrency,
        displayCurrency: selectedDisplayCurrency,
        isFree: ctaType === "free",
      })}
    </span>
  );
}
