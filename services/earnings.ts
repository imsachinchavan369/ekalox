import type { SupabaseClient } from "@supabase/supabase-js";

import type { EarningsWalletSummary, SellerEarningRecord } from "@/lib/earnings/types";

interface SellerEarningRow {
  base_price: number | string;
  buyer_id: string;
  created_at: string;
  currency: string;
  final_price: number | string;
  gst_amount: number | string;
  id: string;
  order_id: string;
  payment_status: string;
  platform_fee: number | string;
  product_id: string;
  products?: { title?: string | null } | Array<{ title?: string | null }> | null;
  seller_earning: number | string;
  seller_id: string;
}

function toNumber(value: number | string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getProductTitle(value: SellerEarningRow["products"]) {
  if (Array.isArray(value)) {
    return value[0]?.title || "Product";
  }

  return value?.title || "Product";
}

function mapEarning(row: SellerEarningRow): SellerEarningRecord {
  return {
    basePrice: toNumber(row.base_price),
    buyerId: row.buyer_id,
    createdAt: row.created_at,
    currency: row.currency,
    finalPrice: toNumber(row.final_price),
    gstAmount: toNumber(row.gst_amount),
    id: row.id,
    orderId: row.order_id,
    paymentStatus: row.payment_status,
    platformFee: toNumber(row.platform_fee),
    productId: row.product_id,
    productTitle: getProductTitle(row.products),
    sellerEarning: toNumber(row.seller_earning),
    sellerId: row.seller_id,
  };
}

export async function recordSellerEarningForPaidOrder(supabase: SupabaseClient, orderId: string) {
  const { error } = await supabase.rpc("record_paid_order_earning_and_notifications", {
    p_order_id: orderId,
  });

  return !error;
}

export async function getSellerEarningsWallet(supabase: SupabaseClient, sellerId: string) {
  const { data, error } = await supabase
    .from("seller_earnings")
    .select("id, seller_id, buyer_id, product_id, order_id, final_price, base_price, gst_amount, platform_fee, seller_earning, currency, payment_status, created_at, products(title)")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  const earnings = error ? [] : ((data ?? []) as SellerEarningRow[]).map(mapEarning);
  const summary: EarningsWalletSummary = earnings.reduce(
    (current, earning) => ({
      availableBalance:
        current.availableBalance + (earning.paymentStatus === "paid" ? earning.sellerEarning : 0),
      pendingBalance:
        current.pendingBalance + (earning.paymentStatus === "pending" ? earning.sellerEarning : 0),
      totalEarnings: current.totalEarnings + earning.sellerEarning,
      totalSales: current.totalSales + 1,
    }),
    {
      availableBalance: 0,
      pendingBalance: 0,
      totalEarnings: 0,
      totalSales: 0,
    },
  );

  return {
    earnings,
    summary,
  };
}
