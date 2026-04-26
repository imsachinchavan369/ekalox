import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

interface CreatorProductRouteContext {
  params: Promise<{ productId: string }>;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function normalizeText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isUserStoragePath(path: string, userId: string, folder: "reels" | "thumbnails") {
  return path.startsWith(`${userId}/${folder}/`) && !path.includes("..") && !path.includes("//");
}

export async function PATCH(request: NextRequest, { params }: CreatorProductRouteContext) {
  const { productId } = await params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Please log in again.", 401);
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return jsonError("Product could not be updated.", 400);
  }

  const title = normalizeText(body.title, 120);
  const caption = normalizeText(body.caption, 240);
  const aboutText = normalizeText(body.aboutText, 2000);
  const affiliateEnabled = body.affiliateEnabled === true;
  const category = normalizeText(body.category, 60);
  const visibility = body.visibility === "private" ? "private" : "public";
  const reelVideoPath = normalizeText(body.reelVideoPath, 500);
  const thumbnailPath = normalizeText(body.thumbnailPath, 500);
  const tags = Array.isArray(body.tags)
    ? body.tags.map((item) => normalizeText(item, 24)).filter(Boolean).slice(0, 8)
    : [];

  const [{ data: reel }, { data: product }] = await Promise.all([
    supabase
      .from("product_reels")
      .select("id, reel_video_path, thumbnail_path")
      .eq("product_id", productId)
      .eq("creator_user_id", user.id)
      .maybeSingle(),
    supabase
      .from("products")
      .select("id, visibility, moderation_status")
      .eq("id", productId)
      .maybeSingle(),
  ]);

  if (!reel || !product) {
    return jsonError("Product not found.", 404);
  }

  if (!title || !aboutText) {
    return jsonError("Title and about text are required.", 400);
  }

  if (visibility === "public" && product.moderation_status !== "clean") {
    return jsonError("This product is under moderation and cannot be made public yet.", 403);
  }

  if (reelVideoPath && !isUserStoragePath(reelVideoPath, user.id, "reels")) {
    return jsonError("Invalid reel preview path.", 400);
  }

  if (thumbnailPath && !isUserStoragePath(thumbnailPath, user.id, "thumbnails")) {
    return jsonError("Invalid thumbnail path.", 400);
  }

  const [{ error: productError }, { error: reelError }, visibilityHistoryResult] = await Promise.all([
    supabase
      .from("products")
      .update({
        category: category || "video",
        description: aboutText,
        affiliate_enabled: affiliateEnabled,
        summary: caption || null,
        tags,
        title,
        visibility,
      })
      .eq("id", productId),
    supabase
      .from("product_reels")
      .update({
        caption: caption || null,
        ...(reelVideoPath ? { reel_video_path: reelVideoPath } : {}),
        ...(thumbnailPath ? { thumbnail_path: thumbnailPath } : {}),
      })
      .eq("id", reel.id),
    visibility !== product.visibility
      ? supabase.from("product_visibility_history").insert({
          changed_by_user_id: user.id,
          from_visibility: product.visibility,
          note: "Creator changed visibility from manage product page.",
          product_id: productId,
          to_visibility: visibility,
        })
      : Promise.resolve({ error: null }),
  ]);

  if (productError || reelError || visibilityHistoryResult.error) {
    return jsonError("Product could not be updated.", 400);
  }

  return NextResponse.json({ success: true });
}
