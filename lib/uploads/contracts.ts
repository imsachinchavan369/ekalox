export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
export const MAX_REEL_VIDEO_DURATION_SECONDS = 60;
export const UPLOAD_STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "ekalox-uploads";

export const ALLOWED_REEL_MIME_PREFIXES = ["video/"] as const;
export const ALLOWED_THUMBNAIL_MIME_PREFIXES = ["image/"] as const;
export const EKALOX_UPLOAD_CATEGORIES = [
  "ai",
  "prompts",
  "music",
  "video",
  "design",
  "graphics",
  "templates",
  "presets",
  "websites",
  "code",
  "apps",
  "courses",
  "ebooks",
  "marketing",
  "social_media",
  "productivity",
  "business",
] as const;

export type ProductType = "free" | "paid";
export type UploadCategory = (typeof EKALOX_UPLOAD_CATEGORIES)[number];

export interface CreateProductMetadataRequest {
  category: UploadCategory;
  title: string;
  description: string;
  productType: ProductType;
  priceAmount: number;
  priceCurrency: string;
  reelVideoPath: string;
  downloadFilePath: string | null;
  downloadOriginalName: string | null;
  downloadMimeType: string | null;
  thumbnailPath: string | null;
}

export interface UploadApiError {
  error: string;
}

export function hasAllowedMimePrefix(mimeType: string, allowedPrefixes: readonly string[]) {
  return allowedPrefixes.some((prefix) => mimeType.startsWith(prefix));
}
