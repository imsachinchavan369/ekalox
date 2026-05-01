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

interface R2UploadErrorDetails {
  bucketConfigured: boolean;
  fileSize: number;
  fileType: string;
  publicBaseUrlConfigured: boolean;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function r2UploadErrorJson(message: string, status: number, details: R2UploadErrorDetails) {
  return NextResponse.json({
    details,
    error: "R2_UPLOAD_FAILED",
    message,
  }, { status });
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

function getSafeErrorName(error: unknown) {
  if (error instanceof Error && error.name) {
    return error.name;
  }

  return typeof error === "object" && error !== null && "name" in error
    ? String((error as { name?: unknown }).name || "UnknownError")
    : "UnknownError";
}

function getErrorMetadata(error: unknown) {
  return typeof error === "object" && error !== null && "$metadata" in error
    ? (error as { $metadata?: { httpStatusCode?: number; requestId?: string } }).$metadata
    : undefined;
}

function getR2EnvStatus() {
  return {
    R2_ACCOUNT_ID: Boolean(process.env.R2_ACCOUNT_ID),
    R2_ACCESS_KEY_ID: Boolean(process.env.R2_ACCESS_KEY_ID),
    R2_BUCKET_NAME: Boolean(process.env.R2_BUCKET_NAME),
    R2_PUBLIC_BASE_URL: Boolean(process.env.R2_PUBLIC_BASE_URL),
    R2_SECRET_ACCESS_KEY: Boolean(process.env.R2_SECRET_ACCESS_KEY),
  };
}

function getR2UploadErrorDetails(file: File, fileType: string): R2UploadErrorDetails {
  return {
    bucketConfigured: Boolean(process.env.R2_BUCKET_NAME),
    fileSize: file.size,
    fileType,
    publicBaseUrlConfigured: Boolean(process.env.R2_PUBLIC_BASE_URL),
  };
}

function hasMissingR2Env() {
  const envStatus = getR2EnvStatus();
  return Object.values(envStatus).some((exists) => !exists);
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
  const errorDetails = getR2UploadErrorDetails(file, fileType);

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

  if (hasMissingR2Env()) {
    console.error("[r2] upload blocked: missing server env", {
      bucketName: process.env.R2_BUCKET_NAME || null,
      env: getR2EnvStatus(),
      fileSize: file.size,
      fileType,
      label,
      path: normalizedPath,
    });
    return r2UploadErrorJson("R2 environment variables are missing on server", 500, errorDetails);
  }

  try {
    const url = await uploadFile(file, normalizedPath, {
      contentType: fileType,
    });

    return NextResponse.json({ path: normalizedPath, url });
  } catch (error) {
    const name = getSafeErrorName(error);
    const message = getSafeErrorMessage(error);
    const metadata = getErrorMetadata(error);
    console.error("[r2] upload failed", {
      bucketName: process.env.R2_BUCKET_NAME || null,
      env: getR2EnvStatus(),
      errorName: name,
      fileSize: file.size,
      fileType,
      label,
      message,
      requestId: metadata?.requestId,
      statusCode: metadata?.httpStatusCode,
      path: normalizedPath,
    });
    return r2UploadErrorJson(message || name, 500, errorDetails);
  }
}
