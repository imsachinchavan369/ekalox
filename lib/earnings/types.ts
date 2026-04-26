export interface EarningsBreakdown {
  basePrice: number;
  finalPrice: number;
  gstAmount: number;
  platformFee: number;
  sellerEarning: number;
}

export interface AffiliateEarningsBreakdown {
  affiliateEarning: number;
  basePrice: number;
  finalPrice: number;
  gstAmount: number;
  platformEarning: number;
  sellerEarning: number;
}

export interface SellerEarningRecord extends EarningsBreakdown {
  buyerId: string;
  createdAt: string;
  currency: string;
  id: string;
  orderId: string;
  paymentStatus: string;
  productId: string;
  productTitle: string;
  sellerId: string;
}

export interface EarningsWalletSummary {
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  totalSales: number;
}
