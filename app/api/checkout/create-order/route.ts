import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { convertToCheckoutINR } from "@/lib/utils/currency";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Please log in to buy this product.", 401);
  }

  let productId = "";
  try {
    const body = (await request.json()) as { productId?: unknown };
    productId = typeof body.productId === "string" ? body.productId : "";
  } catch {
    return jsonError("Checkout unavailable. Please try again.", 400);
  }

  if (!productId) {
    return jsonError("Checkout unavailable. Please try again.", 400);
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, title, cta_type, price_amount, price_currency, price_cents, currency_code, creator_profile_id, status, visibility, moderation_status, is_archived, creator_profiles(handle)")
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
    return jsonError("Product is not available for checkout.", 404);
  }

  if (product.cta_type === "free" || Number(product.price_cents) <= 0) {
    return jsonError("Free products can be downloaded directly.", 400);
  }

  const checkoutINR = convertToCheckoutINR({
    currencyCode: product.currency_code,
    priceAmount: Number(product.price_amount),
    priceCurrency: product.price_currency,
    priceCents: product.price_cents,
  });

  const { data: existingPaidOrder } = await supabase
    .from("orders")
    .select("id, status")
    .eq("product_id", productId)
    .eq("buyer_user_id", user.id)
    .in("status", ["paid", "fulfilled"])
    .maybeSingle();

  if (existingPaidOrder) {
    return NextResponse.json({
      order: {
        id: existingPaidOrder.id,
        product: {
          creatorName: getCreatorName(product.creator_profiles),
          currencyCode: product.price_currency || product.currency_code,
          priceAmount: Number(product.price_amount),
          priceCents: product.price_cents,
          productId: product.id,
          thumbnailUrl: null,
          title: product.title,
        },
        status: existingPaidOrder.status,
      },
      purchased: true,
    });
  }

  const { data: existingPendingOrder } = await supabase
    .from("orders")
    .select("id, status")
    .eq("product_id", productId)
    .eq("buyer_user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const order =
    existingPendingOrder ||
    (
      await supabase
        .from("orders")
        .insert({
          buyer_user_id: user.id,
          creator_profile_id: product.creator_profile_id,
          currency_code: checkoutINR.currency,
          payment_provider: "payment_provider_pending",
          product_id: product.id,
          status: "pending",
          total_price_cents: checkoutINR.amountInPaise,
          unit_price_cents: checkoutINR.amountInPaise,
        })
        .select("id, status")
        .single()
    ).data;

  if (!order) {
    return jsonError("Checkout unavailable. Please try again.", 500);
  }

  return NextResponse.json({
    order: {
      id: order.id,
      product: {
        creatorName: getCreatorName(product.creator_profiles),
        currencyCode: product.price_currency || product.currency_code,
        priceAmount: Number(product.price_amount),
        priceCents: product.price_cents,
        productId: product.id,
        thumbnailUrl: null,
        title: product.title,
      },
      status: order.status,
    },
  });
}

function getCreatorName(value: unknown) {
  if (Array.isArray(value)) {
    return getCreatorName(value[0]);
  }

  if (value && typeof value === "object" && "handle" in value && typeof value.handle === "string") {
    return value.handle;
  }

  return "Creator";
}
