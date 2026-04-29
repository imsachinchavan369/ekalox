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

function normalizeLandingMetadata(value: unknown, userId: string) {
  const landing = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const heroImageUrl = normalizeText(landing.heroImageUrl, 500);

  return {
    badgeText: normalizeText(landing.badgeText, 40) || null,
    featureBlocks: Array.isArray(landing.featureBlocks)
      ? landing.featureBlocks.flatMap((item) => {
          const record = item && typeof item === "object" && !Array.isArray(item) ? item as Record<string, unknown> : {};
          const title = normalizeText(record.title, 80);

          return title
            ? [{
                description: normalizeText(record.description, 180),
                iconName: normalizeText(record.iconName, 32) || null,
                title,
              }]
            : [];
        }).slice(0, 8)
      : [],
    heroImageUrl: heroImageUrl && isUserStoragePath(heroImageUrl, userId, "thumbnails") ? heroImageUrl : null,
    heroSubtitle: normalizeText(landing.heroSubtitle, 180) || null,
    heroTitle: normalizeText(landing.heroTitle, 120) || null,
    includedItems: Array.isArray(landing.includedItems)
      ? landing.includedItems.map((item) => normalizeText(item, 90)).filter(Boolean).slice(0, 12)
      : [],
    landingDescription: normalizeText(landing.landingDescription, 3000) || null,
    previewGallery: Array.isArray(landing.previewGallery)
      ? landing.previewGallery.flatMap((item, index) => {
          const record = item && typeof item === "object" && !Array.isArray(item) ? item as Record<string, unknown> : {};
          const title = normalizeText(record.title, 90);
          const imageUrl = normalizeText(record.imageUrl, 500);

          if (!title && !imageUrl) {
            return [];
          }

          return [{
            description: normalizeText(record.description, 180),
            displayOrder: Number(record.displayOrder) || index + 1,
            imageUrl: imageUrl && isUserStoragePath(imageUrl, userId, "thumbnails") ? imageUrl : null,
            title: title || `Preview ${index + 1}`,
          }];
        }).slice(0, 8)
      : [],
    productTheme: normalizeText(landing.productTheme, 32) || null,
  };
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
  const landing = normalizeLandingMetadata(body.landing, user.id);
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
        badge_text: landing.badgeText,
        feature_blocks: landing.featureBlocks,
        hero_image_url: landing.heroImageUrl,
        hero_subtitle: landing.heroSubtitle,
        hero_title: landing.heroTitle,
        included_items: landing.includedItems,
        landing_description: landing.landingDescription,
        preview_gallery: landing.previewGallery,
        product_theme: landing.productTheme,
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
