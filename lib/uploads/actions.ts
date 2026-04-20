"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

function normalize(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
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

function toFile(value: FormDataEntryValue | null): File | null {
  return value instanceof File && value.size > 0 ? value : null;
}

function toPriceCents(value: string, isFree: boolean): number {
  if (isFree) {
    return 0;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return -1;
  }

  return Math.round(parsed * 100);
}

export async function uploadProductFileAction(formData: FormData) {
  const titleInput = normalize(formData.get("title"));
  const caption = normalize(formData.get("caption"));
  const productType = normalize(formData.get("productType"));
  const isFree = productType !== "paid";
  const priceInput = normalize(formData.get("price"));

  const reelVideo = toFile(formData.get("reelVideo"));
  const downloadFile = toFile(formData.get("downloadFile"));
  const thumbnailFile = toFile(formData.get("thumbnail"));

  if (!titleInput) {
    redirect("/upload?error=Product+title+is+required");
  }

  if (!reelVideo) {
    redirect("/upload?error=Please+select+a+reel+video");
  }

  const reelVideoFile = reelVideo as File;

  if (reelVideoFile.size > MAX_FILE_SIZE_BYTES) {
    redirect("/upload?error=Reel+video+is+too+large.+Max+size+is+50MB");
  }

  if (downloadFile && downloadFile.size > MAX_FILE_SIZE_BYTES) {
    redirect("/upload?error=Downloadable+file+is+too+large.+Max+size+is+50MB");
  }

  if (thumbnailFile && thumbnailFile.size > MAX_FILE_SIZE_BYTES) {
    redirect("/upload?error=Thumbnail+is+too+large.+Max+size+is+50MB");
  }

  const priceCents = toPriceCents(priceInput, isFree);

  if (priceCents < 0) {
    redirect("/upload?error=Paid+products+must+have+a+price+greater+than+0");
  }

  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;

  if (!bucket) {
    redirect("/upload?error=Missing+NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET+env+var");
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login?error=Please+log+in+again");
  }

  const reelVideoPath = `${user.id}/reels/${Date.now()}-${randomUUID()}-${reelVideoFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const downloadFilePath = downloadFile
    ? `${user.id}/downloads/${Date.now()}-${randomUUID()}-${downloadFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
    : null;
  const thumbnailPath = thumbnailFile
    ? `${user.id}/thumbnails/${Date.now()}-${randomUUID()}-${thumbnailFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
    : null;

  const { error: reelUploadError } = await supabase.storage.from(bucket).upload(reelVideoPath, reelVideoFile, {
    cacheControl: "3600",
    upsert: false,
    contentType: reelVideoFile.type || "video/mp4",
  });

  if (reelUploadError) {
    redirect(`/upload?error=${encodeURIComponent(reelUploadError.message)}`);
  }

  if (downloadFile && downloadFilePath) {
    const { error: downloadUploadError } = await supabase
      .storage
      .from(bucket)
      .upload(downloadFilePath, downloadFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: downloadFile.type || "application/octet-stream",
      });

    if (downloadUploadError) {
      redirect(`/upload?error=${encodeURIComponent(downloadUploadError.message)}`);
    }
  }

  if (thumbnailFile && thumbnailPath) {
    const { error: thumbnailUploadError } = await supabase.storage.from(bucket).upload(thumbnailPath, thumbnailFile, {
      cacheControl: "3600",
      upsert: false,
      contentType: thumbnailFile.type || "image/jpeg",
    });

    if (thumbnailUploadError) {
      redirect(`/upload?error=${encodeURIComponent(thumbnailUploadError.message)}`);
    }
  }

  const { data: creatorProfile, error: creatorProfileError } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (creatorProfileError || !creatorProfile) {
    redirect("/upload?error=Creator+profile+not+found");
  }

  const slug = `${slugify(titleInput) || "reel-product"}-${Date.now()}`;

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      creator_profile_id: creatorProfile.id,
      title: titleInput,
      slug,
      description: caption || "Reel-first product listing",
      category: "video",
      status: "draft",
      cta_type: isFree ? "free" : "buy",
      price_cents: priceCents,
      currency_code: "USD",
    })
    .select("id")
    .single();

  if (productError || !product) {
    redirect(`/upload?error=${encodeURIComponent(productError?.message ?? "Product creation failed")}`);
  }

  const { error: reelError } = await supabase.from("product_reels").insert({
    product_id: product.id,
    creator_user_id: user.id,
    reel_video_path: reelVideoPath,
    thumbnail_path: thumbnailPath,
    caption: caption || titleInput,
  });

  if (reelError) {
    redirect(`/upload?error=${encodeURIComponent(reelError.message)}`);
  }

  if (downloadFile && downloadFilePath) {
    const { error: fileError } = await supabase.from("product_download_files").insert({
      product_id: product.id,
      creator_user_id: user.id,
      storage_path: downloadFilePath,
      original_name: downloadFile.name,
      mime_type: downloadFile.type || null,
    });

    if (fileError) {
      redirect(`/upload?error=${encodeURIComponent(fileError.message)}`);
    }
  }

  redirect(`/upload?success=1&product=${encodeURIComponent(titleInput)}`);
}
