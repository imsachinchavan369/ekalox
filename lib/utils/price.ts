export interface FormatPriceOptions {
  currency?: string;
  locale?: string;
}

/**
 * Converts a minor-unit amount (cents) into a localized currency string.
 */
export function formatPrice(amountInCents: number, options: FormatPriceOptions = {}): string {
  const { currency = "USD", locale = "en-US" } = options;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountInCents / 100);
}
