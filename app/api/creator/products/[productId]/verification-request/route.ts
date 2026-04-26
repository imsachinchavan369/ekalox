import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

interface CreatorVerificationRequestRouteContext {
  params: Promise<{ productId: string }>;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(_request: Request, { params }: CreatorVerificationRequestRouteContext) {
  const { productId } = await params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Please log in again.", 401);
  }

  const { data: reel } = await supabase
    .from("product_reels")
    .select("id")
    .eq("product_id", productId)
    .eq("creator_user_id", user.id)
    .maybeSingle();

  if (!reel) {
    return jsonError("Product not found.", 404);
  }

  const { error } = await supabase
    .from("products")
    .update({ verification_status: "verification_requested" })
    .eq("id", productId)
    .in("verification_status", ["unverified", "verification_rejected"]);

  if (error) {
    return jsonError("Could not request verification.", 400);
  }

  await supabase.from("admin_notifications").insert({
    actor_user_id: user.id,
    label: "Product verification requested",
    notification_type: "verification_request",
    product_id: productId,
    related_id: productId,
  });

  return NextResponse.json({ success: true });
}
