import { NextRequest, NextResponse } from "next/server";

import { getOrCreateCreatorProfile } from "@/lib/creator/get-or-create-creator-profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { checkUploadedReelForPolicyRisk } from "@/lib/moderation/upload-policy";
import { getR2ObjectKeyFromUrl } from "@/lib/r2";
import { EKALOX_UPLOAD_CATEGORIES, UPLOAD_STORAGE_BUCKET, type CreateProductMetadataRequest } from "@/lib/uploads/contracts";
import { assertDailyUploadLimit } from "@/lib/uploads/daily-upload-limit";
import { DEFAULT_CURRENCY, normalizeCurrency } from "@/lib/utils/currency";

function errorJson(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

function getStorageKey(reference: string) {
  const trimmed = reference.trim();
  const r2Key = getR2ObjectKeyFromUrl(trimmed);

  if (r2Key) {
    return r2Key;
  }

  return trimmed
    .split("?")[0]
    .replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/(?:public|sign)\//, "")
    .replace(/^https?:\/\/[^/]+\/storage\/v1\/object\//, "")
    .replace(new RegExp(`^${UPLOAD_STORAGE_BUCKET}/`), "")
    .replace(/^\/+/, "");
}

function isUserStoragePath(reference: string, userId: string, folder: "reels" | "downloads" | "thumbnails" | "previews" | "customization") {
  const key = getStorageKey(reference);

  if (!key || key.includes("..") || key.includes("//")) {
    return false;
  }

  const r2Prefixes = {
    customization: `products/${userId}/customization/`,
    downloads: `products/${userId}/downloads/`,
    previews: `products/${userId}/previews/`,
    reels: `reels/${userId}/videos/`,
    thumbnails: `products/${userId}/thumbnails/`,
  };
  const legacyPrefixes = {
    customization: `${userId}/thumbnails/`,
    downloads: `${userId}/downloads/`,
    previews: `${userId}/thumbnails/`,
    reels: `${userId}/reels/`,
    thumbnails: `${userId}/thumbnails/`,
  };

  return key.startsWith(r2Prefixes[folder]) || key.startsWith(legacyPrefixes[folder]);
}

function normalizeText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeLandingMetadata(value: unknown, userId: string) {
  const landing = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const heroImageUrl = normalizeText(landing.heroImageUrl, 500);
  const previewGallery = Array.isArray(landing.previewGallery)
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
          imageUrl: imageUrl && isUserStoragePath(imageUrl, userId, "customization") ? imageUrl : null,
          title: title || `Preview ${index + 1}`,
        }];
      }).slice(0, 8)
    : [];

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
    heroImageUrl: heroImageUrl && isUserStoragePath(heroImageUrl, userId, "customization") ? heroImageUrl : null,
    heroSubtitle: normalizeText(landing.heroSubtitle, 180) || null,
    heroTitle: normalizeText(landing.heroTitle, 120) || null,
    includedItems: Array.isArray(landing.includedItems)
      ? landing.includedItems.map((item) => normalizeText(item, 90)).filter(Boolean).slice(0, 12)
      : [],
    landingDescription: normalizeText(landing.landingDescription, 3000) || null,
    previewGallery,
    productTheme: normalizeText(landing.productTheme, 32) || null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return errorJson("Upload metadata must be sent as JSON", 415);
    }

    const body = (await request.json()) as Partial<CreateProductMetadataRequest>;

    const titleInput = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const productType = body.productType === "paid" ? "paid" : "free";
    const isFree = productType !== "paid";
    const parsedPriceAmount = Number(body.priceAmount);
    const priceAmount = isFree ? 0 : Number.isFinite(parsedPriceAmount) ? Number(parsedPriceAmount.toFixed(2)) : -1;
    const priceCurrency = isFree ? DEFAULT_CURRENCY : normalizeCurrency(body.priceCurrency);
    const priceCents = Math.round(priceAmount * 100);
    const reelVideoPath = typeof body.reelVideoPath === "string" ? body.reelVideoPath.trim() : "";
    const downloadFilePath = typeof body.downloadFilePath === "string" ? body.downloadFilePath.trim() : null;
    const downloadOriginalName = typeof body.downloadOriginalName === "string" ? body.downloadOriginalName : null;
    const downloadMimeType = typeof body.downloadMimeType === "string" ? body.downloadMimeType : null;
    const thumbnailPath = typeof body.thumbnailPath === "string" ? body.thumbnailPath.trim() : null;

    if (!titleInput) {
      return errorJson("Product title is required", 400);
    }

    if (!description) {
      return errorJson("Product description is required", 400);
    }

    if (!EKALOX_UPLOAD_CATEGORIES.includes(category as CreateProductMetadataRequest["category"])) {
      return errorJson("Please select a category.", 400);
    }

    if (!reelVideoPath) {
      return errorJson("Missing reel video path", 400);
    }

    if (!downloadFilePath) {
      return errorJson("Please upload the product file buyers will receive.", 400);
    }

    if (!isFree && (priceAmount <= 0 || priceCents <= 0)) {
      return errorJson("Paid products must have a price greater than 0", 400);
    }

    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return errorJson("Please log in again", 401);
    }

    console.info("[upload] authenticated upload request", {
      authUserEmail: user.email,
      authUserId: user.id,
    });

    if (!isUserStoragePath(reelVideoPath, user.id, "reels")) {
      return errorJson("Invalid reel video path", 400);
    }

    if (!isUserStoragePath(downloadFilePath, user.id, "downloads")) {
      return errorJson("Invalid download file path", 400);
    }

    if (thumbnailPath && !isUserStoragePath(thumbnailPath, user.id, "thumbnails")) {
      return errorJson("Invalid thumbnail path", 400);
    }

    const landing = normalizeLandingMetadata(body.landing, user.id);

    let creatorProfile;
    try {
      creatorProfile = await getOrCreateCreatorProfile(user);
    } catch (error) {
      console.error("[upload] creator profile prepare failed", {
        authUserEmail: user.email,
        authUserId: user.id,
        message: error instanceof Error ? error.message : String(error),
      });
      return errorJson(error instanceof Error ? error.message : "Could not prepare your creator profile.", 400);
    }

    console.info("[upload] creator profile ready", {
      authUserId: user.id,
      creatorProfileId: creatorProfile.id,
      creatorUserId: creatorProfile.userId,
    });

    if (creatorProfile.accountSafetyStatus === "temporarily_restricted") {
      return errorJson("Your account is temporarily restricted from uploading while EKALOX reviews a policy issue.", 403);
    }

    if (creatorProfile.accountSafetyStatus === "suspended") {
      return errorJson("Your account is suspended from uploading.", 403);
    }

    try {
      await assertDailyUploadLimit(creatorProfile.id);
    } catch (error) {
      return errorJson(error instanceof Error ? error.message : "Upload limit reached", 429);
    }

    const slug = `${slugify(titleInput) || "reel-product"}-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const policyRisk = await checkUploadedReelForPolicyRisk({
      caption: description,
      originalFileName: downloadOriginalName,
      reelVideoPath,
      title: titleInput,
    });
    const productModerationFields = policyRisk.isHighConfidenceRisk
      ? {
          admin_note: policyRisk.adminNote,
          moderated_at: nowIso,
          moderation_status: "under_review",
          status: "under_review",
          visibility: "private",
        }
      : {
          moderation_status: "clean",
          status: "published",
          visibility: "public",
        };

    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        creator_profile_id: creatorProfile.id,
        title: titleInput,
        slug,
        description,
        category,
        ...productModerationFields,
        verification_status: "unverified",
        cta_type: isFree ? "free" : "buy",
        price_amount: priceAmount,
        price_currency: priceCurrency,
        price_cents: priceCents,
        currency_code: priceCurrency,
        hero_title: landing.heroTitle,
        hero_subtitle: landing.heroSubtitle,
        hero_image_url: landing.heroImageUrl,
        badge_text: landing.badgeText,
        product_theme: landing.productTheme,
        preview_gallery: landing.previewGallery,
        included_items: landing.includedItems,
        feature_blocks: landing.featureBlocks,
        landing_description: landing.landingDescription,
        submitted_at: nowIso,
        published_at: nowIso,
      })
      .select("id")
      .single();

    if (productError || !product) {
      console.error("[upload] product insert failed", {
        authUserId: user.id,
        creatorProfileId: creatorProfile.id,
        error: productError,
      });
      return errorJson(productError?.message ?? "Product creation failed", 400);
    }

    if (policyRisk.isHighConfidenceRisk) {
      await Promise.all([
        supabase
          .from("users")
          .update({
            account_safety_status: "temporarily_restricted",
            restricted_at: nowIso,
            restricted_by: "system",
            restricted_reason: policyRisk.reason,
            restriction_note: policyRisk.adminNote,
          })
          .eq("id", user.id),
        supabase.from("admin_notifications").insert({
          actor_user_id: user.id,
          label: "Upload under review due to policy risk",
          notification_type: "policy_risk",
          product_id: product.id,
          related_id: product.id,
        }),
      ]);
    }

    const { error: reelError } = await supabase.from("product_reels").insert({
      product_id: product.id,
      creator_user_id: creatorProfile.userId,
      reel_video_path: reelVideoPath,
      thumbnail_path: thumbnailPath,
      caption: description,
    });

    if (reelError) {
      console.error("[upload] reel insert failed", reelError);
      await supabase.from("products").update({ is_archived: true, visibility: "private" }).eq("id", product.id);
      return errorJson("Could not save reel preview metadata. Please try again.", 400);
    }

    const { error: fileError } = await supabase.from("product_download_files").insert({
      product_id: product.id,
      creator_user_id: creatorProfile.userId,
      storage_path: downloadFilePath,
      original_name: downloadOriginalName,
      mime_type: downloadMimeType,
    });

    if (fileError) {
      console.error("[upload] downloadable file metadata insert failed", fileError);
      await supabase.from("products").update({ is_archived: true, visibility: "private" }).eq("id", product.id);
      return errorJson("Could not save downloadable product file metadata. Please try again.", 400);
    }

    return NextResponse.json({
      message: policyRisk.isHighConfidenceRisk
        ? "Your upload is under review due to policy risk."
        : "Product published.",
      success: true,
      underReview: policyRisk.isHighConfidenceRisk,
    }, { status: 200 });
  } catch (error) {
    console.error("[upload] unexpected upload metadata error", error);
    return errorJson("Invalid upload payload", 400);
  }
}
