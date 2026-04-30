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
  const heroImageUrl = normalizeText(landing.heroImage ?? landing.heroImageUrl, 500);
  const featureInput = landing.features ?? landing.featureBlocks;
  const includesInput = landing.includes ?? landing.includedItems;
  const galleryInput = landing.galleryImages ?? landing.previewGallery;
  const extraSectionsInput = landing.extraSections;
  const pricingBox = landing.pricingBox && typeof landing.pricingBox === "object" && !Array.isArray(landing.pricingBox)
    ? landing.pricingBox as Record<string, unknown>
    : {};

  const normalized = {
    badgeText: normalizeText(landing.badgeText, 40) || null,
    featureBlocks: Array.isArray(featureInput)
      ? featureInput.flatMap((item) => {
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
    heroImage: heroImageUrl && isUserStoragePath(heroImageUrl, userId, "thumbnails") ? heroImageUrl : null,
    heroImageUrl: heroImageUrl && isUserStoragePath(heroImageUrl, userId, "thumbnails") ? heroImageUrl : null,
    heroSubtitle: normalizeText(landing.heroSubtitle, 180) || null,
    heroTitle: normalizeText(landing.heroTitle, 120) || null,
    includedItems: Array.isArray(includesInput)
      ? includesInput.map((item) => normalizeText(item, 90)).filter(Boolean).slice(0, 12)
      : [],
    landingDescription: normalizeText(landing.landingDescription, 3000) || null,
    extraSections: Array.isArray(extraSectionsInput)
      ? extraSectionsInput.flatMap((item) => {
          const record = item && typeof item === "object" && !Array.isArray(item) ? item as Record<string, unknown> : {};
          const title = normalizeText(record.title, 90);
          const body = normalizeText(record.body, 1200);

          return title || body ? [{ body, title: title || "Details" }] : [];
        }).slice(0, 4)
      : [],
    previewGallery: Array.isArray(galleryInput)
      ? galleryInput.flatMap((item, index) => {
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
    isFeatured: landing.isFeatured === true,
    isVerifiedByEkalox: landing.isVerifiedByEkalox === true,
    pricingBox: Object.keys(pricingBox).length > 0
      ? {
          heading: normalizeText(pricingBox.heading, 90) || null,
          note: normalizeText(pricingBox.note, 180) || null,
        }
      : null,
    productTheme: normalizeText(landing.productTheme, 32) || null,
  };

  return {
    ...normalized,
    features: normalized.featureBlocks,
    galleryImages: normalized.previewGallery,
    includes: normalized.includedItems,
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
  const landing = normalizeLandingMetadata(body.customization ?? body.landing, user.id);
  const tags = Array.isArray(body.tags)
    ? body.tags.map((item) => normalizeText(item, 24)).filter(Boolean).slice(0, 8)
    : [];

  const [{ data: reel }, { data: product }] = await Promise.all([
    supabase
      .from("product_reels")
      .select("id, caption, reel_video_path, thumbnail_path")
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

  const { error: productError } = await supabase
    .from("products")
    .update({
      category: category || "video",
      description: aboutText,
      affiliate_enabled: affiliateEnabled,
      badge_text: landing.badgeText,
      customization: landing,
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
    .eq("id", productId);

  if (productError) {
    console.error("Product update failed", productError);
    return jsonError(productError.message || "Product could not be updated.", 400);
  }

  const reelPatch = {
    ...(caption !== (reel.caption || "") ? { caption: caption || null } : {}),
    ...(reelVideoPath ? { reel_video_path: reelVideoPath } : {}),
    ...(thumbnailPath ? { thumbnail_path: thumbnailPath } : {}),
  };

  if (Object.keys(reelPatch).length > 0) {
    const { error: reelError } = await supabase
      .from("product_reels")
      .update(reelPatch)
      .eq("id", reel.id);

    if (reelError) {
      console.error("Product reel update failed", reelError);
      return jsonError(reelError.message || "Product could not be updated.", 400);
    }
  }

  if (visibility !== product.visibility) {
    const { error: visibilityHistoryError } = await supabase.from("product_visibility_history").insert({
      changed_by_user_id: user.id,
      from_visibility: product.visibility,
      note: "Creator changed visibility from manage product page.",
      product_id: productId,
      to_visibility: visibility,
    });

    if (visibilityHistoryError) {
      console.error("Product visibility history insert failed", visibilityHistoryError);
      return jsonError(visibilityHistoryError.message || "Product could not be updated.", 400);
    }
  }

  return NextResponse.json({ success: true });
}
