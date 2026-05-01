import { NextRequest, NextResponse } from "next/server";

import { createPresignedUploadUrl, getR2EnvStatus, hasMissingR2Env } from "@/lib/r2";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { MAX_FILE_SIZE_BYTES, MAX_REEL_VIDEO_FILE_SIZE_BYTES } from "@/lib/uploads/contracts";

export const runtime = "nodejs";

type R2Folder =
  | `products/${string}/downloads/${string}`
  | `products/${string}/thumbnails/${string}`
  | `products/${string}/previews/${string}`
  | `products/${string}/customization/${string}`
  | `reels/${string}/videos/${string}`;

function jsonError(error: string, message: string, status: number) {
  return NextResponse.json({ error, message }, { status });
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

function getUploadContentType(path: string, fileType: string) {
  if (path.startsWith("reels/")) {
    return fileType || "video/mp4";
  }

  return fileType || "application/octet-stream";
}

function getSafeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || "R2 presigned upload failed");
}

/*
 * Cloudflare R2 bucket CORS for direct browser uploads:
 * Allowed methods: PUT, GET, HEAD
 * Allowed headers: content-type, content-length, x-amz-content-sha256, x-amz-date, authorization
 * Allowed origins: local dev origin and production domain.
 */
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("UNAUTHORIZED", "Please log in again.", 401);
  }

  const body = (await request.json().catch(() => null)) as {
    fileSize?: unknown;
    fileType?: unknown;
    label?: unknown;
    path?: unknown;
  } | null;

  const path = typeof body?.path === "string" ? body.path.trim().replace(/^\/+/, "") : "";
  const label = typeof body?.label === "string" ? body.label.slice(0, 80) : "file";
  const fileSize = Number(body?.fileSize);
  const fileType = getUploadContentType(path, typeof body?.fileType === "string" ? body.fileType : "");

  if (!path || !Number.isFinite(fileSize)) {
    return jsonError("INVALID_UPLOAD_REQUEST", "Upload request is missing file details.", 400);
  }

  if (!isAllowedR2Path(path, user.id)) {
    console.error("[r2] presign rejected: invalid path", { fileSize, fileType, label, path });
    return jsonError("INVALID_R2_PATH", "Invalid R2 upload path.", 400);
  }

  if (path.startsWith("reels/") && fileSize > MAX_REEL_VIDEO_FILE_SIZE_BYTES) {
    return jsonError("FILE_TOO_LARGE", "Video must be under 20MB", 413);
  }

  if (!path.startsWith("reels/") && fileSize > MAX_FILE_SIZE_BYTES) {
    return jsonError("FILE_TOO_LARGE", `${label} is too large. Max size is 50MB.`, 413);
  }

  if (path.startsWith("reels/") && !fileType.toLowerCase().startsWith("video/")) {
    return jsonError("INVALID_FILE_TYPE", "Reel video must be a valid video file.", 400);
  }

  if (hasMissingR2Env()) {
    console.error("[r2] presign blocked: missing server env", {
      bucketName: process.env.R2_BUCKET_NAME || null,
      env: getR2EnvStatus(),
      fileSize,
      fileType,
      label,
      path,
    });
    return jsonError("R2_PRESIGN_FAILED", "R2 environment variables are missing on server", 500);
  }

  try {
    const presigned = await createPresignedUploadUrl(path, { contentType: fileType });
    return NextResponse.json({ ...presigned, contentType: fileType });
  } catch (error) {
    const message = getSafeErrorMessage(error);
    console.error("[r2] presign failed", {
      bucketName: process.env.R2_BUCKET_NAME || null,
      env: getR2EnvStatus(),
      fileSize,
      fileType,
      label,
      message,
      path,
    });
    return jsonError("R2_PRESIGN_FAILED", message || "R2 presigned upload failed", 500);
  }
}
