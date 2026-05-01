import { NextRequest, NextResponse } from "next/server";

import { uploadFile } from "@/lib/r2";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { MAX_FILE_SIZE_BYTES } from "@/lib/uploads/contracts";

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

function getUploadContentType(file: File, path: string) {
  if (path.startsWith("reels/")) {
    return file.type || "video/mp4";
  }

  return file.type || "application/octet-stream";
}

function getSafeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error || "Unknown R2 upload error");
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
  const fileType = getUploadContentType(file, normalizedPath);

  if (!isAllowedR2Path(normalizedPath, user.id)) {
    console.error("[r2] invalid upload path", {
      fileType,
      label,
      path: normalizedPath,
    });
    return jsonError("Invalid R2 upload path.", 400);
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    console.error("[r2] upload rejected: file too large", {
      fileSize: file.size,
      fileType,
      label,
      maxFileSize: MAX_FILE_SIZE_BYTES,
      path: normalizedPath,
    });
    return jsonError(`${label} is too large. Max size is 50MB.`, 413);
  }

  if (normalizedPath.startsWith("reels/") && !fileType.toLowerCase().startsWith("video/")) {
    console.error("[r2] upload rejected: reel is not a video", {
      fileType,
      label,
      path: normalizedPath,
    });
    return jsonError("Reel video must be a valid video file.", 400);
  }

  try {
    const url = await uploadFile(file, normalizedPath, {
      contentType: fileType,
    });

    return NextResponse.json({ path: normalizedPath, url });
  } catch (error) {
    const message = getSafeErrorMessage(error);
    const metadata = typeof error === "object" && error !== null && "$metadata" in error
      ? (error as { $metadata?: { httpStatusCode?: number; requestId?: string } }).$metadata
      : undefined;
    console.error("[r2] upload failed", {
      fileSize: file.size,
      fileType,
      label,
      message,
      requestId: metadata?.requestId,
      statusCode: metadata?.httpStatusCode,
      path: normalizedPath,
    });
    return jsonError(`${label} upload failed. Please try again.`, 500);
  }
}
