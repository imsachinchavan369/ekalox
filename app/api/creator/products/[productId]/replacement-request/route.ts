import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

interface CreatorReplacementRouteContext {
  params: Promise<{ productId: string }>;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: NextRequest, { params }: CreatorReplacementRouteContext) {
  const { productId } = await params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Please log in again.", 401);
  }

  const body = (await request.json().catch(() => null)) as { note?: unknown; reason?: unknown } | null;
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 160) : "";
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 500) : "";

  if (!reason) {
    return jsonError("Add a replacement reason.", 400);
  }

  const [{ data: reel }, { data: file }, { data: creatorProfile }, { data: existingRequest }] = await Promise.all([
    supabase.from("product_reels").select("id").eq("product_id", productId).eq("creator_user_id", user.id).maybeSingle(),
    supabase.from("product_download_files").select("id").eq("product_id", productId).order("created_at", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("creator_profiles").select("id").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("file_replacement_requests")
      .select("id")
      .eq("product_id", productId)
      .eq("creator_user_id", user.id)
      .eq("status", "pending")
      .maybeSingle(),
  ]);

  if (!reel || !creatorProfile) {
    return jsonError("Product not found.", 404);
  }

  if (existingRequest) {
    return jsonError("A replacement request is already pending for this product.", 429);
  }

  const { data: requestData, error } = await supabase
    .from("file_replacement_requests")
    .insert({
      creator_profile_id: creatorProfile.id,
      creator_user_id: user.id,
      current_file_id: file?.id ?? null,
      note: note || null,
      product_id: productId,
      reason,
    })
    .select("id")
    .single();

  if (error || !requestData) {
    return jsonError("Request could not be created.", 400);
  }

  await supabase.from("admin_notifications").insert({
    actor_user_id: user.id,
    label: "New file replacement request",
    notification_type: "replacement_request",
    product_id: productId,
    related_id: requestData.id,
  });

  return NextResponse.json({ success: true });
}
