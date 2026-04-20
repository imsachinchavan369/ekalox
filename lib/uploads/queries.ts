import { getSupabaseServerClient } from "@/lib/supabase";

interface ProductReelRow {
  id: string;
  product_id: string;
  caption: string | null;
  created_at: string;
  reel_video_path: string;
}

interface ProductRow {
  id: string;
  title: string;
  status: string;
  cta_type: string;
  price_cents: number;
  currency_code: string;
}

export interface MyReelProductCard {
  id: string;
  productId: string;
  title: string;
  caption: string | null;
  createdAt: string;
  status: string;
  ctaType: string;
  priceCents: number;
  currencyCode: string;
  reelUrl: string | null;
}

/**
 * Fetches reel-first product cards that belong to the currently authenticated creator.
 */
export async function getMyUploads(userId: string): Promise<MyReelProductCard[]> {
  const supabase = await getSupabaseServerClient();

  const { data: reelsData, error: reelsError } = await supabase
    .from("product_reels")
    .select("id, product_id, caption, created_at, reel_video_path")
    .eq("creator_user_id", userId)
    .order("created_at", { ascending: false });

  const reels = (reelsData ?? []) as ProductReelRow[];

  if (reelsError || reels.length === 0) {
    return [];
  }

  const productIds = reels.map((item) => item.product_id);

  const { data: productsData, error: productsError } = await supabase
    .from("products")
    .select("id, title, status, cta_type, price_cents, currency_code")
    .in("id", productIds);

  const products = (productsData ?? []) as ProductRow[];

  if (productsError || products.length === 0) {
    return [];
  }

  const productById = new Map(products.map((product) => [product.id, product]));
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;

  const cards = await Promise.all(
    reels.map(async (reel) => {
      const product = productById.get(reel.product_id);

      if (!product) {
        return null;
      }

      let reelUrl: string | null = null;

      if (bucket) {
        const { data: signedUrlData, error: signedUrlError } = await supabase
          .storage
          .from(bucket)
          .createSignedUrl(reel.reel_video_path, 60 * 60);

        reelUrl = signedUrlError ? null : signedUrlData.signedUrl;
      }

      return {
        id: reel.id,
        productId: reel.product_id,
        title: product.title,
        caption: reel.caption,
        createdAt: reel.created_at,
        status: product.status,
        ctaType: product.cta_type,
        priceCents: product.price_cents,
        currencyCode: product.currency_code,
        reelUrl,
      } satisfies MyReelProductCard;
    }),
  );

  return cards.filter((card): card is MyReelProductCard => card !== null);
}
