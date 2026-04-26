import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

interface ReportRouteContext {
  params: Promise<{ productId: string }>;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

const allowedReasons = new Set([
  "scam_misleading",
  "wrong_file",
  "broken_download",
  "sexual_content",
  "violence_unsafe",
  "copyright",
  "spam",
  "other",
  "misleading_content",
  "scam",
  "adult_unsafe",
]);

export async function POST(request: NextRequest, { params }: ReportRouteContext) {
  const { productId } = await params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Please log in to report this product.", 401);
  }

  const body = (await request.json().catch(() => null)) as { note?: unknown; reason?: unknown } | null;
  const reason = typeof body?.reason === "string" ? body.reason : "";
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 500) : "";

  if (!allowedReasons.has(reason)) {
    return jsonError("Choose a valid report reason.", 400);
  }

  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const [{ data: product }, { data: recentReport }] = await Promise.all([
    supabase.from("products").select("id, creator_profile_id, creator_profiles(user_id)").eq("id", productId).maybeSingle(),
    supabase
      .from("reports")
      .select("id")
      .eq("product_id", productId)
      .eq("reporter_user_id", user.id)
      .gte("created_at", twelveHoursAgo)
      .maybeSingle(),
  ]);

  if (!product) {
    return jsonError("Product not found.", 404);
  }

  if (recentReport) {
    return jsonError("You already reported this item recently. Please wait before sending another report.", 429);
  }

  const creatorProfile = Array.isArray(product.creator_profiles) ? product.creator_profiles[0] : product.creator_profiles;
  const { data: reportData, error } = await supabase
    .from("reports")
    .insert({
      creator_id: creatorProfile?.user_id ?? null,
      creator_profile_id: product.creator_profile_id,
      note: note || null,
      product_id: productId,
      reason,
      reporter_user_id: user.id,
    })
    .select("id")
    .single();

  if (error || !reportData) {
    return jsonError("Could not submit report.", 400);
  }

  await supabase.from("admin_notifications").insert({
    actor_user_id: user.id,
    label: "New product report",
    notification_type: "report",
    product_id: productId,
    related_id: reportData.id,
  });

  return NextResponse.json({ success: true });
}
