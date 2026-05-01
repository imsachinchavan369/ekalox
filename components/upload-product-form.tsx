"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PriceBreakdown } from "@/components/upload/PriceBreakdown";
import { uploadFileToR2 } from "@/lib/r2-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { CATEGORY_OPTIONS } from "@/lib/constants/categories";
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES, normalizeCurrency } from "@/lib/utils/currency";
import {
  ALLOWED_REEL_MIME_PREFIXES,
  ALLOWED_THUMBNAIL_MIME_PREFIXES,
  MAX_FILE_SIZE_BYTES,
  MAX_REEL_VIDEO_DURATION_SECONDS,
  hasAllowedMimePrefix,
  type CreateProductMetadataRequest,
} from "@/lib/uploads/contracts";

interface UploadProductFormProps {
  initialSuccess?: string;
  initialError?: string;
  initialProduct?: string;
}

function normalize(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function toFile(value: FormDataEntryValue | null): File | null {
  return value instanceof File && value.size > 0 ? value : null;
}

const REEL_DURATION_ERROR = "Your reel must be 60 seconds or less. Please upload a shorter demo video.";
const VIDEO_DURATION_READ_TIMEOUT_MS = 12000;

function canAllowUnknownVideoDuration(file: File) {
  const mimeType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  return mimeType === "video/mp4" || fileName.endsWith(".mp4");
}

function getVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    let settled = false;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    };

    const settle = (duration: number | null) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve(duration);
    };

    const fail = (error: Error) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(error);
    };

    const timeoutId = window.setTimeout(() => {
      settle(null);
    }, VIDEO_DURATION_READ_TIMEOUT_MS);

    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = video.duration;
      Number.isFinite(duration) && duration > 0 ? settle(duration) : settle(null);
    };
    video.onerror = () => {
      fail(new Error("Could not load video metadata"));
    };
    video.src = objectUrl;
    video.load();
  });
}

export function UploadProductForm({ initialSuccess, initialError, initialProduct }: UploadProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [priceCurrency, setPriceCurrency] = useState(DEFAULT_CURRENCY);
  const [priceInput, setPriceInput] = useState("");
  const [productType, setProductType] = useState<"free" | "paid">("free");
  const [reelVideoError, setReelVideoError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  const handleReelVideoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0] ?? null;
    setReelVideoError("");

    if (!file) {
      return;
    }

    if (!hasAllowedMimePrefix(file.type || "", ALLOWED_REEL_MIME_PREFIXES)) {
      input.value = "";
      setReelVideoError("Reel video must be a valid video file.");
      return;
    }

    try {
      const duration = await getVideoDuration(file);
      if (duration !== null && duration > MAX_REEL_VIDEO_DURATION_SECONDS) {
        input.value = "";
        setReelVideoError(REEL_DURATION_ERROR);
      } else if (duration === null && canAllowUnknownVideoDuration(file)) {
        setReelVideoError("Could not confirm video length yet. Upload will continue if this MP4 is 60 seconds or less.");
      }
    } catch {
      if (canAllowUnknownVideoDuration(file)) {
        setReelVideoError("Could not confirm video length yet. Upload will continue if this MP4 is 60 seconds or less.");
        return;
      }

      input.value = "";
      setReelVideoError("Could not load this video file. Please choose a valid MP4 video.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);

      const titleInput = normalize(formData.get("title"));
      const description = normalize(formData.get("description"));
      const category = normalize(formData.get("category"));
      const productTypeInput = normalize(formData.get("productType"));
      const isFree = productTypeInput !== "paid";
      const priceInput = normalize(formData.get("price"));
      const priceCurrencyInput = normalizeCurrency(normalize(formData.get("priceCurrency")) || DEFAULT_CURRENCY);

      const reelVideo = toFile(formData.get("reelVideo"));
      const downloadFile = toFile(formData.get("downloadFile"));
      const thumbnailFile = toFile(formData.get("thumbnail"));

      if (!titleInput) {
        router.push("/upload?error=Product+title+is+required");
        return;
      }

      if (!description) {
        router.push("/upload?error=Product+description+is+required");
        return;
      }

      if (!category) {
        router.push("/upload?error=Please+select+a+category.");
        return;
      }

      if (!reelVideo) {
        router.push("/upload?error=Please+select+a+reel+video");
        return;
      }

      if (!downloadFile) {
        router.push("/upload?error=Please+upload+the+product+file+buyers+will+receive.");
        return;
      }

      if (reelVideo.size > MAX_FILE_SIZE_BYTES) {
        router.push("/upload?error=Reel+video+is+too+large.+Max+size+is+50MB");
        return;
      }

      if (!hasAllowedMimePrefix(reelVideo.type || "", ALLOWED_REEL_MIME_PREFIXES)) {
        router.push("/upload?error=Reel+video+must+be+a+valid+video+file");
        return;
      }

      const reelVideoDuration = await getVideoDuration(reelVideo).catch(() => null);

      if (reelVideoDuration !== null && reelVideoDuration > MAX_REEL_VIDEO_DURATION_SECONDS) {
        setReelVideoError(REEL_DURATION_ERROR);
        return;
      }

      if (reelVideoDuration === null && !canAllowUnknownVideoDuration(reelVideo)) {
        setReelVideoError("Could not load this video file. Please choose a valid MP4 video.");
        return;
      }

      if (downloadFile.size > MAX_FILE_SIZE_BYTES) {
        router.push("/upload?error=Downloadable+file+is+too+large.+Max+size+is+50MB");
        return;
      }

      if (thumbnailFile && thumbnailFile.size > MAX_FILE_SIZE_BYTES) {
        router.push("/upload?error=Thumbnail+is+too+large.+Max+size+is+50MB");
        return;
      }

      if (thumbnailFile && !hasAllowedMimePrefix(thumbnailFile.type || "", ALLOWED_THUMBNAIL_MIME_PREFIXES)) {
        router.push("/upload?error=Thumbnail+must+be+a+valid+image+file");
        return;
      }

      const parsedPrice = Number(priceInput || "0");
      const priceAmount = isFree ? 0 : Number(parsedPrice.toFixed(2));
      const priceCurrency = isFree ? DEFAULT_CURRENCY : priceCurrencyInput;

      if (!isFree && (!Number.isFinite(parsedPrice) || parsedPrice <= 0 || priceAmount <= 0)) {
        router.push("/upload?error=Paid+products+must+have+a+price+greater+than+0");
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login?error=Please+log+in+again");
        return;
      }

      const sanitizeName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const reelVideoPath = `reels/${user.id}/videos/${Date.now()}-${crypto.randomUUID()}-${sanitizeName(reelVideo.name)}`;
      const downloadFilePath = `products/${user.id}/downloads/${Date.now()}-${crypto.randomUUID()}-${sanitizeName(downloadFile.name)}`;
      const thumbnailPath = thumbnailFile
        ? `products/${user.id}/thumbnails/${Date.now()}-${crypto.randomUUID()}-${sanitizeName(thumbnailFile.name)}`
        : null;
      setUploadStatus("Uploading reel video...");

      const reelVideoUrl = await uploadFileToR2(reelVideo, reelVideoPath, "reel video");

      setUploadStatus("Uploading product file...");
      const downloadFileUrl = await uploadFileToR2(downloadFile, downloadFilePath, "downloadable product file");

      let thumbnailUrl: string | null = null;
      if (thumbnailFile && thumbnailPath) {
        setUploadStatus("Uploading thumbnail...");
        thumbnailUrl = await uploadFileToR2(thumbnailFile, thumbnailPath, "thumbnail");
      }

      setUploadStatus("Saving product metadata...");
      const payload: CreateProductMetadataRequest = {
        category: category as CreateProductMetadataRequest["category"],
        title: titleInput,
        description,
        productType: isFree ? "free" : "paid",
        priceAmount,
        priceCurrency,
        reelVideoPath: reelVideoUrl,
        downloadFilePath: downloadFileUrl,
        downloadOriginalName: downloadFile.name,
        downloadMimeType: downloadFile.type || "application/octet-stream",
        thumbnailPath: thumbnailUrl,
      };

      const metadataResponse = await fetch("/api/uploads/product", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const metadataPayload = (await metadataResponse.json().catch(() => null)) as
        | { error?: string; message?: string; underReview?: boolean }
        | null;

      if (!metadataResponse.ok) {
        const errorMessage = metadataPayload?.error || "Product creation failed";
        router.push(`/upload?error=${encodeURIComponent(errorMessage)}`);
        return;
      }

      if (metadataPayload?.underReview) {
        router.push(`/upload?success=${encodeURIComponent(metadataPayload.message || "Your upload is under review due to policy risk.")}&product=${encodeURIComponent(titleInput)}`);
        return;
      }

      router.push(`/upload?success=1&product=${encodeURIComponent(titleInput)}`);
    } catch (error) {
      router.push(`/upload?error=${encodeURIComponent(error instanceof Error ? error.message : "Upload failed. Please check network and try again")}`);
    } finally {
      setUploadStatus("");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {initialSuccess ? (
        <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {initialSuccess === "1" ? "Product created" : initialSuccess}{initialProduct ? `: ${initialProduct}` : ""}
        </p>
      ) : null}

      {initialError ? (
        <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {initialError}
        </p>
      ) : null}

      {isSubmitting && uploadStatus ? (
        <p className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300">
          {uploadStatus}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block space-y-1 text-sm">
          <span className="text-slate-300">Product title</span>
          <input
            type="text"
            name="title"
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
            placeholder="My digital product"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-slate-300">Short caption / description</span>
          <textarea
            name="description"
            rows={3}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
            placeholder="What this product is about"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-slate-300">Category</span>
          <select
            name="category"
            required
            defaultValue=""
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
          >
            <option value="" disabled>
              Select category
            </option>
            {CATEGORY_OPTIONS.map((categoryOption) => (
              <option key={categoryOption.value} value={categoryOption.value}>
                {categoryOption.label}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="space-y-2 text-sm">
          <legend className="text-slate-300">Product type</legend>
          <label className="flex items-center gap-2 text-slate-300">
            <input
              type="radio"
              name="productType"
              value="free"
              checked={productType === "free"}
              onChange={() => setProductType("free")}
              className="h-4 w-4"
            />
            Free
          </label>
          <label className="flex items-center gap-2 text-slate-300">
            <input
              type="radio"
              name="productType"
              value="paid"
              checked={productType === "paid"}
              onChange={() => setProductType("paid")}
              className="h-4 w-4"
            />
            Paid
          </label>
        </fieldset>

        <label className="block space-y-1 text-sm">
          <span className="text-slate-300">Price amount (only for paid)</span>
          <input
            type="number"
            name="price"
            min="0"
            step="0.01"
            value={priceInput}
            onChange={(event) => setPriceInput(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
            placeholder="9.99"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-slate-300">Price currency</span>
          <select
            name="priceCurrency"
            value={priceCurrency}
            onChange={(event) => setPriceCurrency(normalizeCurrency(event.target.value))}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
          >
            {SUPPORTED_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </label>

        <PriceBreakdown currency={priceCurrency} isPaid={productType === "paid"} price={priceInput} />

        <label className="block space-y-1 text-sm">
          <span className="text-slate-300">Reel / demo video</span>
          <input
            type="file"
            name="reelVideo"
            accept="video/*"
            required
            onChange={(event) => void handleReelVideoChange(event)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-500 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-950 hover:file:bg-cyan-400"
          />
          <span className="block text-xs text-slate-500">Max reel length: 60 seconds</span>
          {reelVideoError ? (
            <span className="block text-xs font-semibold text-rose-300">{reelVideoError}</span>
          ) : null}
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-slate-300">Downloadable product file</span>
          <input
            type="file"
            name="downloadFile"
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-500 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-950 hover:file:bg-cyan-400"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-slate-300">Thumbnail (optional)</span>
          <input
            type="file"
            name="thumbnail"
            accept="image/*"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-500 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-950 hover:file:bg-cyan-400"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Uploading..." : "Create product reel"}
        </button>

        <p className="text-center text-xs leading-5 text-slate-500">
          By uploading, you agree to{" "}
          <Link href="/legal/seller-policy" className="font-semibold text-cyan-400 hover:text-cyan-300">
            Seller Policy
          </Link>{" "}
          &{" "}
          <Link href="/legal/terms" className="font-semibold text-cyan-400 hover:text-cyan-300">
            Terms
          </Link>
        </p>
      </form>
    </>
  );
}
