import { NextRequest, NextResponse } from "next/server";

import { createRazorpayOrder, getPublicRazorpayKeyId } from "@/lib/payments/razorpay";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { convertToCheckoutINR } from "@/lib/utils/currency";

const AFFILIATE_COOKIE = "ekalox_affiliate_last_click";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
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

function getAffiliateClick(value: string | undefined) {
  if (!value) {
    return null;
  }

  const [affiliateUserId, productId] = value.split(":");

  if (!UUID_PATTERN.test(affiliateUserId || "") || !UUID_PATTERN.test(productId || "")) {
    return null;
  }

  return { affiliateUserId, productId };
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
    .select("id, title, cta_type, price_amount, price_currency, price_cents, currency_code, creator_profile_id, status, visibility, moderation_status, is_archived, affiliate_enabled, creator_profiles(handle)")
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

  const checkoutINR = convertToCheckoutINR({
    currencyCode: product.currency_code,
    priceAmount: Number(product.price_amount),
    priceCurrency: product.price_currency,
    priceCents: product.price_cents,
  });

  if (checkoutINR.amountInPaise <= 0) {
    return jsonError("Checkout unavailable for this product.", 400);
  }

  const { data: internalOrder, error: orderError } = await supabase
    .from("orders")
    .insert({
      buyer_user_id: user.id,
      creator_profile_id: product.creator_profile_id,
      currency_code: checkoutINR.currency,
      payment_provider: "razorpay_test",
      product_id: product.id,
      status: "pending",
      total_price_cents: checkoutINR.amountInPaise,
      unit_price_cents: checkoutINR.amountInPaise,
    })
    .select("id, status")
    .single();

  if (orderError || !internalOrder) {
    return jsonError("Checkout unavailable. Please try again.", 500);
  }

  const affiliateClick = getAffiliateClick(request.cookies.get(AFFILIATE_COOKIE)?.value);
  if (affiliateClick && affiliateClick.productId === product.id && product.affiliate_enabled) {
    const { data: creatorProfile } = await supabase
      .from("creator_profiles")
      .select("user_id")
      .eq("id", product.creator_profile_id)
      .maybeSingle();

    if (creatorProfile?.user_id && affiliateClick.affiliateUserId !== user.id && affiliateClick.affiliateUserId !== creatorProfile.user_id) {
      await supabase
        .from("order_affiliates")
        .insert({
          affiliate_user_id: affiliateClick.affiliateUserId,
          order_id: internalOrder.id,
          product_id: product.id,
        });
    }
  }

  try {
    const razorpayOrder = await createRazorpayOrder({
      amountInPaise: checkoutINR.amountInPaise,
      internalOrderId: internalOrder.id,
    });

    const { data: markedOrder, error: markError } = await supabase
      .rpc("mark_order_razorpay_created", {
        p_order_id: internalOrder.id,
        p_provider_order_id: razorpayOrder.id,
      })
      .maybeSingle();

    if (markError || !markedOrder) {
      return jsonError("Checkout unavailable. Please try again.", 500);
    }

    return NextResponse.json({
      order: {
        id: internalOrder.id,
        product: {
          creatorName: getCreatorName(product.creator_profiles),
          currencyCode: product.price_currency || product.currency_code,
          priceAmount: Number(product.price_amount),
          priceCents: product.price_cents,
          productId: product.id,
          thumbnailUrl: null,
          title: product.title,
        },
        razorpay: {
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          keyId: getPublicRazorpayKeyId(),
          orderId: razorpayOrder.id,
        },
        status: internalOrder.status,
      },
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Checkout unavailable. Please try again.", 502);
  }
}
