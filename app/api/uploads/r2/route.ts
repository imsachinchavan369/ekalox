import { NextRequest, NextResponse } from "next/server";

import { uploadFile } from "@/lib/r2";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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

  if (!(file instanceof File) || typeof path !== "string") {
    return jsonError("Missing file upload payload.", 400);
  }

  const normalizedPath = path.trim().replace(/^\/+/, "");

  if (!isAllowedR2Path(normalizedPath, user.id)) {
    return jsonError("Invalid R2 upload path.", 400);
  }

  try {
    const url = await uploadFile(file, normalizedPath, {
      contentType: file.type || "application/octet-stream",
    });

    return NextResponse.json({ path: normalizedPath, url });
  } catch (error) {
    console.error("[r2] upload failed", error);
    return jsonError(error instanceof Error ? error.message : "Upload failed. Please try again.", 500);
  }
}
