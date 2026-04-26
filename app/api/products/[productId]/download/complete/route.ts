import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

interface DownloadCompleteRouteContext {
  params: Promise<{ productId: string }>;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(_request: Request, { params }: DownloadCompleteRouteContext) {
  const { productId } = await params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Please log in to download this product.", 401);
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, title, cta_type, creator_profile_id, creator_profiles(handle)")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return jsonError("Product not found.", 404);
  }

  const isFree = product.cta_type === "free";
  const { data: paidOrder } = isFree
    ? { data: null }
    : await supabase
        .from("orders")
        .select("id")
        .eq("product_id", productId)
        .eq("buyer_user_id", user.id)
        .in("status", ["paid", "fulfilled"])
        .maybeSingle();

  if (!isFree && !paidOrder) {
    return jsonError("Purchase required before downloading this product.", 403);
  }

  if (isFree) {
    await supabase
      .from("free_claims")
      .upsert({ claim_source: "product_detail", product_id: productId, user_id: user.id }, { onConflict: "user_id,product_id" });
  }

  await supabase
    .from("reel_downloads")
    .upsert({ reel_id: productId, user_id: user.id }, { onConflict: "user_id,reel_id" });

  await supabase.from("product_history").insert({
    creator_name: getCreatorName(product.creator_profiles),
    event_type: isFree ? "free_download" : "paid_download",
    product_id: productId,
    product_title: product.title,
    user_id: user.id,
  });

  return NextResponse.json({ success: true });
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
