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

export async function uploadProductFileAction(formData: FormData) {
  const fileEntry = formData.get("file");
  const titleInput = normalize(formData.get("title"));

  if (!(fileEntry instanceof File) || fileEntry.size <= 0) {
    redirect("/upload?error=Please+select+a+file");
  }

  const file = fileEntry;

  if (file.size > MAX_FILE_SIZE_BYTES) {
    redirect("/upload?error=File+is+too+large.+Max+size+is+50MB");
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

  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${user.id}/${Date.now()}-${randomUUID()}-${safeFileName}`;

  const { error: storageError } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });

  if (storageError) {
    redirect(`/upload?error=${encodeURIComponent(storageError.message)}`);
  }

  const { data: creatorProfile, error: creatorProfileError } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (creatorProfileError || !creatorProfile) {
    redirect("/upload?error=Creator+profile+not+found");
  }

  const baseTitle = titleInput || file.name.replace(/\.[^/.]+$/, "") || "Untitled reel";
  const slug = `${slugify(baseTitle) || "reel"}-${Date.now()}`;

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      creator_profile_id: creatorProfile.id,
      title: baseTitle,
      slug,
      description: "Reel-first product listing",
      category: "video",
      status: "draft",
      cta_type: "free",
      price_cents: 0,
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
    reel_video_path: filePath,
    caption: baseTitle,
  });

  if (reelError) {
    redirect(`/upload?error=${encodeURIComponent(reelError.message)}`);
  }

  redirect(`/upload?success=1&file=${encodeURIComponent(baseTitle)}`);
}
