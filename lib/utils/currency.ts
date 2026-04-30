export const SUPPORTED_CURRENCIES = ["INR", "USD", "EUR", "GBP", "AUD", "CAD", "SGD"] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: SupportedCurrency = "INR";

export const STATIC_EXCHANGE_RATES_TO_INR: Record<SupportedCurrency, number> = {
  INR: 1,
  USD: 83,
  EUR: 90,
  GBP: 105,
  AUD: 55,
  CAD: 61,
  SGD: 62,
};

export function normalizeCurrency(value: unknown): SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(value as SupportedCurrency)
    ? (value as SupportedCurrency)
    : DEFAULT_CURRENCY;
}

export function convertCurrency(
  amount: number,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
) {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  const amountInINR = amount * STATIC_EXCHANGE_RATES_TO_INR[fromCurrency];
  return amountInINR / STATIC_EXCHANGE_RATES_TO_INR[toCurrency];
}

export function formatCurrencyAmount(amount: number, currency: SupportedCurrency) {
  const roundedAmount = Number.isFinite(amount) ? amount : 0;
  const maximumFractionDigits = currency === "INR" ? 0 : 2;

  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    currency,
    maximumFractionDigits,
    minimumFractionDigits: 0,
    style: "currency",
  }).format(roundedAmount);
}

export function getPriceParts({
  amount,
  convertedAmount,
  currency,
  displayCurrency = DEFAULT_CURRENCY,
  isFree = false,
}: {
  amount: number;
  convertedAmount?: number | null;
  currency: SupportedCurrency;
  displayCurrency?: SupportedCurrency;
  isFree?: boolean;
}) {
  if (isFree || amount <= 0) {
    return { original: "Free", approximate: "" };
  }

  const original = formatCurrencyAmount(amount, currency);

  if (displayCurrency === currency) {
    return { original, approximate: "" };
  }

  if (convertedAmount === null || convertedAmount === undefined) {
    return { original, approximate: "" };
  }

  return {
    original,
    approximate: `approx ${formatCurrencyAmount(convertedAmount, displayCurrency)}`,
  };
}

export function formatPriceWithApproximation({
  amount,
  convertedAmount,
  currency,
  displayCurrency = DEFAULT_CURRENCY,
  isFree = false,
}: {
  amount: number;
  convertedAmount?: number | null;
  currency: SupportedCurrency;
  displayCurrency?: SupportedCurrency;
  isFree?: boolean;
}) {
  const parts = getPriceParts({ amount, convertedAmount, currency, displayCurrency, isFree });
  return parts.approximate ? `${parts.original} · ${parts.approximate}` : parts.original;
}

export function convertToCheckoutINR(product: {
  priceAmount?: number | null;
  priceCurrency?: string | null;
  priceCents?: number | null;
  currencyCode?: string | null;
}) {
  const sourceAmount =
    typeof product.priceAmount === "number" && Number.isFinite(product.priceAmount)
      ? product.priceAmount
      : Number(product.priceCents ?? 0) / 100;
  const sourceCurrency = normalizeCurrency(product.priceCurrency ?? product.currencyCode);
  const amountInINR = convertCurrency(sourceAmount, sourceCurrency, "INR");

  return {
    amountInINR,
    amountInPaise: Math.round(amountInINR * 100),
    currency: "INR" as const,
  };
}
