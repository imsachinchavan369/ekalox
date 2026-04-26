import type { AffiliateEarningsBreakdown, EarningsBreakdown } from "./types";

const GST_RATE = 0.18;
const PLATFORM_FEE_RATE = 0.2;
const AFFILIATE_SELLER_RATE = 0.6;
const AFFILIATE_RATE = 0.25;
const AFFILIATE_PLATFORM_RATE = 0.15;

function roundCurrency(value: number) {
  return Math.round(Number.isFinite(value) ? value : 0);
}

export function calculateEarnings(finalPriceInput: number): EarningsBreakdown {
  const finalPrice = Number.isFinite(finalPriceInput) && finalPriceInput > 0 ? finalPriceInput : 0;

  if (finalPrice <= 0) {
    return {
      basePrice: 0,
      finalPrice: 0,
      gstAmount: 0,
      platformFee: 0,
      sellerEarning: 0,
    };
  }

  const basePrice = finalPrice / (1 + GST_RATE);
  const platformFee = basePrice * PLATFORM_FEE_RATE;

  return {
    basePrice: roundCurrency(basePrice),
    finalPrice: roundCurrency(finalPrice),
    gstAmount: roundCurrency(finalPrice - basePrice),
    platformFee: roundCurrency(platformFee),
    sellerEarning: roundCurrency(basePrice - platformFee),
  };
}

export function calculateAffiliateEarnings(finalPriceInput: number): AffiliateEarningsBreakdown {
  const finalPrice = Number.isFinite(finalPriceInput) && finalPriceInput > 0 ? finalPriceInput : 0;

  if (finalPrice <= 0) {
    return {
      affiliateEarning: 0,
      basePrice: 0,
      finalPrice: 0,
      gstAmount: 0,
      platformEarning: 0,
      sellerEarning: 0,
    };
  }

  const basePrice = finalPrice / (1 + GST_RATE);

  return {
    affiliateEarning: roundCurrency(basePrice * AFFILIATE_RATE),
    basePrice: roundCurrency(basePrice),
    finalPrice: roundCurrency(finalPrice),
    gstAmount: roundCurrency(finalPrice - basePrice),
    platformEarning: roundCurrency(basePrice * AFFILIATE_PLATFORM_RATE),
    sellerEarning: roundCurrency(basePrice * AFFILIATE_SELLER_RATE),
  };
}
