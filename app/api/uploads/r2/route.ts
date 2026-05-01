import { NextRequest, NextResponse } from "next/server";

import { uploadFile } from "@/lib/r2";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type R2Folder =
  | `products/${string}/downloads/${string}`
  | `products/${string}/thumbnails/${string}`
  | `products/${string}/previews/${string}`
  | `products/${string}/customization/${string}`
  | `reels/${string}/videos/${string}`;

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function isAllowedR2Path(path: string, userId: string): path is R2Folder {
  const normalizedPath = path.trim().replace(/^\/+/, "");

  if (!normalizedPath || normalizedPath.includes("..") || normalizedPath.includes("//")) {
    return false;
  }

  return (
    normalizedPath.startsWith(`products/${userId}/downloads/`) ||
    normalizedPath.startsWith(`products/${userId}/thumbnails/`) ||
    normalizedPath.startsWith(`products/${userId}/previews/`) ||
    normalizedPath.startsWith(`products/${userId}/customization/`) ||
    normalizedPath.startsWith(`reels/${userId}/videos/`)
  );
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Please log in again.", 401);
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const path = formData?.get("path");
  const label = typeof formData?.get("label") === "string" ? String(formData.get("label")).slice(0, 80) : "file";

  if (!(file instanceof File) || typeof path !== "string") {
    return jsonError("Missing file upload payload.", 400);
  }

  const normalizedPath = path.trim().replace(/^\/+/, "");

  if (!isAllowedR2Path(normalizedPath, user.id)) {
    console.error("[r2] invalid upload path", {
      fileType: file.type || "application/octet-stream",
      label,
      path: normalizedPath,
    });
    return jsonError("Invalid R2 upload path.", 400);
  }

  try {
    const url = await uploadFile(file, normalizedPath, {
      contentType: file.type || "application/octet-stream",
    });

    return NextResponse.json({ path: normalizedPath, url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown R2 upload error";
    console.error("[r2] upload failed", {
      fileType: file.type || "application/octet-stream",
      label,
      message,
      path: normalizedPath,
    });
    return jsonError(`${label} upload failed. Please try again.`, 500);
  }
}
