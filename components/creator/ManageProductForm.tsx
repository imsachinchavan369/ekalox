"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ProductVisibilityToggle } from "@/components/creator/ProductVisibilityToggle";
import { calculateAffiliateEarnings } from "@/lib/earnings/calculateEarnings";
import {
  ALLOWED_REEL_MIME_PREFIXES,
  ALLOWED_THUMBNAIL_MIME_PREFIXES,
  MAX_FILE_SIZE_BYTES,
  UPLOAD_STORAGE_BUCKET,
  hasAllowedMimePrefix,
} from "@/lib/uploads/contracts";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface ManageProductFormProps {
  initialProduct: {
    aboutText?: string | null;
    affiliateEnabled?: boolean;
    caption: string | null;
    category?: string | null;
    ctaType?: string;
    priceAmount?: number;
    priceCurrency?: string;
    productId: string;
    reelUrl: string | null;
    tags?: string[];
    thumbnailUrl?: string | null;
    title: string;
    verificationStatus?: string;
    visibility?: string;
  };
  userId: string;
}

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function ManageProductForm({ initialProduct, userId }: ManageProductFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [title, setTitle] = useState(initialProduct.title);
  const [caption, setCaption] = useState(initialProduct.caption || "");
  const [aboutText, setAboutText] = useState(initialProduct.aboutText || "");
  const [category, setCategory] = useState(initialProduct.category || "video");
  const [affiliateEnabled, setAffiliateEnabled] = useState(Boolean(initialProduct.affiliateEnabled));
  const [tags, setTags] = useState((initialProduct.tags || []).join(", "));
  const [visibility, setVisibility] = useState<"public" | "private">(
    initialProduct.visibility === "private" ? "private" : "public",
  );
  const [reelVideoFile, setReelVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isRequestingVerification, setIsRequestingVerification] = useState(false);
  const affiliatePreview = calculateAffiliateEarnings(
    initialProduct.ctaType === "free" ? 0 : initialProduct.priceAmount || 1000,
  );
  const formatRupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

  const saveProduct = async () => {
    setIsSaving(true);
    setMessage("");

    try {
      let reelVideoPath: string | null = null;
      let thumbnailPath: string | null = null;

      if (reelVideoFile) {
        if (reelVideoFile.size > MAX_FILE_SIZE_BYTES || !hasAllowedMimePrefix(reelVideoFile.type || "", ALLOWED_REEL_MIME_PREFIXES)) {
          setMessage("Reel preview must be a valid video under 50MB.");
          setIsSaving(false);
          return;
        }

        reelVideoPath = `${userId}/reels/${Date.now()}-${crypto.randomUUID()}-${sanitizeName(reelVideoFile.name)}`;
        const { error } = await supabase.storage.from(UPLOAD_STORAGE_BUCKET).upload(reelVideoPath, reelVideoFile, {
          cacheControl: "3600",
          contentType: reelVideoFile.type || "video/mp4",
          upsert: false,
        });

        if (error) {
          setMessage(error.message);
          setIsSaving(false);
          return;
        }
      }

      if (thumbnailFile) {
        if (thumbnailFile.size > MAX_FILE_SIZE_BYTES || !hasAllowedMimePrefix(thumbnailFile.type || "", ALLOWED_THUMBNAIL_MIME_PREFIXES)) {
          setMessage("Thumbnail must be a valid image under 50MB.");
          setIsSaving(false);
          return;
        }

        thumbnailPath = `${userId}/thumbnails/${Date.now()}-${crypto.randomUUID()}-${sanitizeName(thumbnailFile.name)}`;
        const { error } = await supabase.storage.from(UPLOAD_STORAGE_BUCKET).upload(thumbnailPath, thumbnailFile, {
          cacheControl: "3600",
          contentType: thumbnailFile.type || "image/jpeg",
          upsert: false,
        });

        if (error) {
          setMessage(error.message);
          setIsSaving(false);
          return;
        }
      }

      const response = await fetch(`/api/creator/products/${initialProduct.productId}`, {
        body: JSON.stringify({
          aboutText,
          affiliateEnabled,
          caption,
          category,
          reelVideoPath,
          tags: tags
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          thumbnailPath,
          title,
          visibility,
        }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setMessage(payload.error || "Product could not be updated.");
        return;
      }

      setMessage("Product metadata updated.");
      router.refresh();
    } catch {
      setMessage("Product could not be updated.");
    } finally {
      setIsSaving(false);
    }
  };

  const archiveProduct = async () => {
    setIsArchiving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/creator/products/${initialProduct.productId}/archive`, { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; warning?: string };

      if (!response.ok) {
        setMessage(payload.error || "Product could not be archived.");
        return;
      }

      setMessage(payload.warning || "Product archived and hidden from discovery.");
      router.refresh();
    } catch {
      setMessage("Product could not be archived.");
    } finally {
      setIsArchiving(false);
    }
  };

  const requestVerification = async () => {
    setIsRequestingVerification(true);
    setMessage("");

    try {
      const response = await fetch(`/api/creator/products/${initialProduct.productId}/verification-request`, { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setMessage(payload.error || "Verification could not be requested.");
        return;
      }

      setMessage("Verification requested.");
      router.refresh();
    } catch {
      setMessage("Verification could not be requested.");
    } finally {
      setIsRequestingVerification(false);
    }
  };

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-slate-900/72 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">Manage reel/product</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Update public metadata, switch visibility, refresh reel preview media, or archive the listing.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-3">
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Title</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/45" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Short description</span>
            <textarea value={caption} onChange={(event) => setCaption(event.target.value)} className="min-h-20 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-white outline-none focus:border-cyan-300/45" />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">About this product</span>
            <textarea value={aboutText} onChange={(event) => setAboutText(event.target.value)} className="min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-white outline-none focus:border-cyan-300/45" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-400">Category</span>
              <input value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/45" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-400">Tags</span>
              <input value={tags} onChange={(event) => setTags(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/45" />
            </label>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400">Visibility</span>
            <ProductVisibilityToggle value={visibility} onChange={setVisibility} />
          </div>
          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={affiliateEnabled}
                onChange={(event) => setAffiliateEnabled(event.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span>
                <span className="block text-sm font-black text-white">Enable affiliate for this product</span>
                <span className="mt-1 block text-xs leading-5 text-slate-400">
                  Future paid orders can use a last-click affiliate split. Existing orders stay unchanged.
                </span>
              </span>
            </label>
            {affiliateEnabled ? (
              <div className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
                <p>Final price: <span className="font-black text-white">{formatRupees(affiliatePreview.finalPrice)}</span></p>
                <p>Seller earns: <span className="font-black text-cyan-100">{formatRupees(affiliatePreview.sellerEarning)}</span></p>
                <p>Affiliate earns: <span className="font-black text-cyan-100">{formatRupees(affiliatePreview.affiliateEarning)}</span></p>
                <p>Platform earns: <span className="font-black text-cyan-100">{formatRupees(affiliatePreview.platformEarning)}</span></p>
              </div>
            ) : null}
          </section>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-400">New reel preview</span>
              <input type="file" accept="video/*" onChange={(event) => setReelVideoFile(event.target.files?.[0] ?? null)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-500 file:px-3 file:py-1.5 file:font-semibold file:text-slate-950" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-400">New thumbnail</span>
              <input type="file" accept="image/*" onChange={(event) => setThumbnailFile(event.target.files?.[0] ?? null)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-500 file:px-3 file:py-1.5 file:font-semibold file:text-slate-950" />
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-black">
            {initialProduct.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={initialProduct.thumbnailUrl} alt="" className="aspect-[5/4] w-full object-cover" />
            ) : initialProduct.reelUrl ? (
              <video src={initialProduct.reelUrl} className="aspect-[5/4] w-full object-cover" muted playsInline preload="metadata" />
            ) : (
              <div className="flex aspect-[5/4] items-center justify-center text-xs font-semibold text-slate-500">Preview unavailable</div>
            )}
          </div>

          <button
            type="button"
            onClick={saveProduct}
            disabled={isSaving}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#23d3ee,#0b74f1)] px-5 py-2.5 text-sm font-black tracking-wide text-white shadow-[0_8px_22px_rgba(14,116,241,0.24)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            onClick={archiveProduct}
            disabled={isArchiving}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-rose-300/25 bg-rose-300/10 px-5 py-2.5 text-sm font-black tracking-wide text-rose-100 transition hover:border-rose-300/45 hover:bg-rose-300/16 disabled:cursor-wait disabled:opacity-70"
          >
            {isArchiving ? "Archiving..." : "Delete / archive item"}
          </button>
          {initialProduct.verificationStatus !== "verified" && initialProduct.verificationStatus !== "verification_requested" ? (
            <button
              type="button"
              onClick={requestVerification}
              disabled={isRequestingVerification}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-2.5 text-sm font-black tracking-wide text-cyan-100 transition hover:border-cyan-300/45 hover:bg-cyan-300/16 disabled:cursor-wait disabled:opacity-70"
            >
              {isRequestingVerification ? "Requesting..." : "Request EKALOX verification"}
            </button>
          ) : null}
          {message ? <p className="text-xs font-semibold text-cyan-200">{message}</p> : null}
        </div>
      </div>
    </section>
  );
}
