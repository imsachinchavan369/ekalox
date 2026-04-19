import { CTA_LABELS } from "@/lib/constants/cta";
import type { CTAType, Product } from "@/types";

export type ProductCTAInput = Pick<Product, "status" | "isFree" | "priceInCents" | "ctaType">;

/**
 * Returns the best CTA action for a product based on status and pricing.
 */
export function getProductCTA(product: ProductCTAInput): CTAType {
  if (product.ctaType) {
    return product.ctaType;
  }

  if (product.status === "sold_out" || product.status === "archived") {
    return "join_waitlist";
  }

  if (product.status === "coming_soon") {
    return "preorder";
  }

  if (product.isFree || product.priceInCents <= 0) {
    return "download_free";
  }

  return "buy_now";
}

/**
 * Returns a user-facing label for the resolved product CTA.
 */
export function getProductCTALabel(product: ProductCTAInput): string {
  return CTA_LABELS[getProductCTA(product)];
}
