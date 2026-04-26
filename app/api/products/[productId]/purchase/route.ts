import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { convertToCheckoutINR } from "@/lib/utils/currency";

interface PurchaseRouteContext {
  params: Promise<{ productId: string }>;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(_request: Request, { params }: PurchaseRouteContext) {
  const { productId } = await params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Please log in to buy this product.", 401);
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, cta_type, price_amount, price_currency, price_cents, currency_code, creator_profile_id, status, visibility, moderation_status, is_archived")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return jsonError("Product not found.", 404);
  }

  if (
    !["published", "verified"].includes(product.status) ||
    product.visibility !== "public" ||
    product.is_archived ||
    product.moderation_status !== "clean"
  ) {
    return jsonError("Product is not available for purchase.", 404);
  }

  if (product.cta_type === "free") {
    return jsonError("Free products can be downloaded directly.", 400);
  }

  const checkoutINR = convertToCheckoutINR({
    currencyCode: product.currency_code,
    priceAmount: Number(product.price_amount),
    priceCurrency: product.price_currency,
    priceCents: product.price_cents,
  });

  const { data: existingOrder } = await supabase
    .from("orders")
    .select("id, status")
    .eq("product_id", productId)
    .eq("buyer_user_id", user.id)
    .in("status", ["paid", "fulfilled"])
    .maybeSingle();

  if (existingOrder) {
    return NextResponse.json({ purchased: true });
  }

  const { data: order } = await supabase.from("orders").insert({
    buyer_user_id: user.id,
    product_id: productId,
    creator_profile_id: product.creator_profile_id,
    status: "pending",
    unit_price_cents: checkoutINR.amountInPaise,
    total_price_cents: checkoutINR.amountInPaise,
    currency_code: checkoutINR.currency,
    payment_provider: "payment_provider_pending",
  }).select("id").single();

  return NextResponse.json({
    orderId: order?.id ?? null,
    paymentRequired: true,
    status: "secure_checkout_pending",
  });
}
