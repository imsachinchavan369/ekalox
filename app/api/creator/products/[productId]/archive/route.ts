import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

interface CreatorArchiveRouteContext {
  params: Promise<{ productId: string }>;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(_request: Request, { params }: CreatorArchiveRouteContext) {
  const { productId } = await params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Please log in again.", 401);
  }

  const [{ data: reel }, { data: product }, { count: orderCount }, { count: downloadCount }] = await Promise.all([
    supabase.from("product_reels").select("id").eq("product_id", productId).eq("creator_user_id", user.id).maybeSingle(),
    supabase.from("products").select("id, visibility").eq("id", productId).maybeSingle(),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("product_id", productId),
    supabase.from("reel_downloads").select("*", { count: "exact", head: true }).eq("reel_id", productId),
  ]);

  if (!reel || !product) {
    return jsonError("Product not found.", 404);
  }

  const warning =
    (orderCount ?? 0) > 0 || (downloadCount ?? 0) > 0
      ? "This product has historical orders/downloads, so EKALOX archived it instead of hard deleting."
      : "Product archived and hidden from discovery.";

  const [{ error: updateError }, historyResult] = await Promise.all([
    supabase
      .from("products")
      .update({ is_archived: true, visibility: "private" })
      .eq("id", productId),
    supabase.from("product_visibility_history").insert({
      changed_by_user_id: user.id,
      from_visibility: product.visibility,
      note: "Creator archived item from manage product page.",
      product_id: productId,
      to_visibility: "private",
    }),
  ]);

  if (updateError || historyResult.error) {
    return jsonError("Product could not be archived.", 400);
  }

  return NextResponse.json({ success: true, warning });
}
