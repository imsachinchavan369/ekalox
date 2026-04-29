import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  UPLOAD_STORAGE_BUCKET,
  type ProductExtraSection,
  type ProductFeatureBlock,
  type ProductLandingMetadata,
  type ProductPreviewGalleryItem,
  type ProductPricingBox,
} from "@/lib/uploads/contracts";

interface ProductReelRow {
  id: string;
  product_id: string;
  caption: string | null;
  created_at: string;
  reel_video_path: string;
  thumbnail_path?: string | null;
}

interface ProductRow {
  id: string;
  creator_profile_id: string;
  title: string;
  summary?: string | null;
  description: string;
  category?: string | null;
  tags?: string[] | null;
  status: string;
  visibility?: string;
  verification_status?: string;
  moderation_status?: string;
  is_archived?: boolean;
  affiliate_enabled?: boolean;
  badge_text?: string | null;
  cta_type: string;
  customization?: unknown;
  feature_blocks?: unknown;
  hero_image_url?: string | null;
  hero_subtitle?: string | null;
  hero_title?: string | null;
  included_items?: unknown;
  is_featured?: boolean | null;
  is_verified_by_ekalox?: boolean | null;
  landing_description?: string | null;
  preview_gallery?: unknown;
  product_theme?: string | null;
  price_amount?: number | string | null;
  price_currency?: string | null;
  price_cents: number;
  currency_code: string;
}

interface CreatorProfileRow {
  id: string;
  handle: string;
  user_id: string;
}

interface UserRow {
  id: string;
  display_name: string;
}

export interface ReelProductCard {
  productId: string;
  title: string;
  caption: string | null;
  aboutText?: string | null;
  category?: string | null;
  creatorProfileId: string;
  creatorFollowingCount: number;
  creatorName: string;
  ctaType: string;
  priceAmount: number;
  priceCurrency: string;
  priceCents: number;
  currencyCode: string;
  createdAt: string;
  reelUrl: string | null;
  thumbnailUrl?: string | null;
  tags?: string[];
  verificationStatus?: string;
  visibility?: string;
  downloadsCount: number;
  averageRating: number;
  ratingCount: number;
  reviewsCount: number;
  moderationStatus?: string;
  affiliateEnabled?: boolean;
  customization: ProductLandingMetadata;
  landing: ProductLandingMetadata;
}

export interface ProductReview {
  id: string;
  rating: number;
  text: string | null;
  createdAt: string;
  userName: string;
}

const PUBLIC_PRODUCT_STATUSES = ["published", "verified"];
const BASE_PRODUCT_SELECT =
  "id, creator_profile_id, title, summary, description, category, tags, status, visibility, verification_status, moderation_status, is_archived, affiliate_enabled, cta_type, price_amount, price_currency, price_cents, currency_code, hero_title, hero_subtitle, hero_image_url, badge_text, product_theme, preview_gallery, included_items, feature_blocks, landing_description, is_featured, is_verified_by_ekalox";
const PRODUCT_SELECT_WITH_CUSTOMIZATION = `${BASE_PRODUCT_SELECT}, customization`;

function isMissingCustomizationColumnError(error: { code?: string; details?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  const message = `${error.code ?? ""} ${error.details ?? ""} ${error.message ?? ""}`.toLowerCase();
  return message.includes("customization") && (
    message.includes("could not find") ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    error.code === "42703" ||
    error.code === "PGRST204"
  );
}

function getProductPriceAmount(product: ProductRow) {
  const amount = Number(product.price_amount);
  return Number.isFinite(amount) ? amount : Number(product.price_cents ?? 0) / 100;
}

function getProductPriceCurrency(product: ProductRow) {
  return product.price_currency || product.currency_code || "INR";
}

async function getAppUserIdForAuthUser(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  authUserId: string,
) {
  const { data } = await supabase
    .from("users")
    .select("id")
    .or(`id.eq.${authUserId},auth_user_id.eq.${authUserId}`)
    .limit(1)
    .maybeSingle();

  return data?.id ?? authUserId;
}

function getDisplayCreatorName(profile: CreatorProfileRow | undefined, user: UserRow | undefined): string {
  return user?.display_name || profile?.handle || "Creator";
}

function normalizeStoragePath(path: string, bucket: string): string {
  const trimmed = path.trim();

  if (!trimmed) {
    return "";
  }

  let normalized = trimmed.replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/(?:public|sign)\//, "");
  normalized = normalized.replace(/^https?:\/\/[^/]+\/storage\/v1\/object\//, "");
  normalized = normalized.replace(new RegExp(`^${bucket}/`), "");
  normalized = normalized.replace(/^\/+/, "");

  return normalized;
}

async function getSignedReelUrl(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  bucket: string | undefined,
  rawPath: string,
): Promise<string | null> {
  if (!bucket) {
    return null;
  }

  const normalizedPath = normalizeStoragePath(rawPath, bucket);

  if (!normalizedPath) {
    return null;
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase
    .storage
    .from(bucket)
    .createSignedUrl(normalizedPath, 60 * 60);

  return signedUrlError ? null : signedUrlData.signedUrl;
}

async function getSignedOptionalAssetUrl(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  bucket: string | undefined,
  rawPath?: string | null,
) {
  if (!rawPath) {
    return null;
  }

  return getSignedReelUrl(supabase, bucket, rawPath);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function textOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parsePreviewGallery(value: unknown): ProductPreviewGalleryItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .flatMap((item, index): ProductPreviewGalleryItem[] => {
      const record = asRecord(item);
      const title = textOrNull(record.title);

      if (!title) {
        return [];
      }

      return [{
        description: textOrNull(record.description),
        displayOrder: Number(record.displayOrder ?? record.display_order ?? index + 1) || index + 1,
        imagePath: textOrNull(record.imageUrl ?? record.image_url),
        imageUrl: textOrNull(record.imageUrl ?? record.image_url),
        title,
      }];
    })
    .sort((first, second) => first.displayOrder - second.displayOrder);
}

function parseIncludedItems(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => textOrNull(item)).filter((item): item is string => Boolean(item)).slice(0, 12)
    : [];
}

function parseFeatureBlocks(value: unknown): ProductFeatureBlock[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .flatMap((item): ProductFeatureBlock[] => {
      const record = asRecord(item);
      const title = textOrNull(record.title);

      return title
        ? [{
            description: textOrNull(record.description),
            iconName: textOrNull(record.iconName ?? record.icon_name),
            title,
          }]
        : [];
    })
    .slice(0, 8);
}

function parseExtraSections(value: unknown): ProductExtraSection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .flatMap((item): ProductExtraSection[] => {
      const record = asRecord(item);
      const title = textOrNull(record.title);
      const body = textOrNull(record.body);

      return title || body ? [{ body, title: title || "Details" }] : [];
    })
    .slice(0, 4);
}

function parsePricingBox(value: unknown): ProductPricingBox | null {
  const record = asRecord(value);
  const heading = textOrNull(record.heading);
  const note = textOrNull(record.note);

  return heading || note ? { heading, note } : null;
}

function readCustomization(product: ProductRow) {
  const customization = asRecord(product.customization);
  const hasCustomization = Object.keys(customization).length > 0;

  return {
    badgeText: textOrNull(hasCustomization ? customization.badgeText : product.badge_text),
    featureBlocks: parseFeatureBlocks(hasCustomization ? customization.features ?? customization.featureBlocks : product.feature_blocks),
    heroImagePath: textOrNull(hasCustomization ? customization.heroImage ?? customization.heroImageUrl : product.hero_image_url),
    heroSubtitle: textOrNull(hasCustomization ? customization.heroSubtitle : product.hero_subtitle),
    heroTitle: textOrNull(hasCustomization ? customization.heroTitle : product.hero_title),
    includedItems: parseIncludedItems(hasCustomization ? customization.includes ?? customization.includedItems : product.included_items),
    extraSections: parseExtraSections(customization.extraSections),
    isFeatured: hasCustomization ? customization.isFeatured === true : Boolean(product.is_featured),
    isVerifiedByEkalox: hasCustomization ? customization.isVerifiedByEkalox === true : Boolean(product.is_verified_by_ekalox),
    landingDescription: textOrNull(hasCustomization ? customization.landingDescription : product.landing_description),
    previewGallery: parsePreviewGallery(hasCustomization ? customization.galleryImages ?? customization.previewGallery : product.preview_gallery),
    pricingBox: parsePricingBox(customization.pricingBox),
    productTheme: textOrNull(hasCustomization ? customization.productTheme : product.product_theme),
  };
}

async function buildProductLanding(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  product: ProductRow,
): Promise<ProductLandingMetadata> {
  const rawCustomization = readCustomization(product);
  const previewGallery = rawCustomization.previewGallery;
  const [heroImageUrl, signedGallery] = await Promise.all([
    getSignedOptionalAssetUrl(supabase, UPLOAD_STORAGE_BUCKET, rawCustomization.heroImagePath),
    Promise.all(
      previewGallery.map(async (item) => ({
        ...item,
        imageUrl: await getSignedOptionalAssetUrl(supabase, UPLOAD_STORAGE_BUCKET, item.imageUrl),
      })),
    ),
  ]);

  return {
    badgeText: rawCustomization.badgeText,
    featureBlocks: rawCustomization.featureBlocks,
    features: rawCustomization.featureBlocks,
    galleryImages: signedGallery,
    heroImage: heroImageUrl,
    heroImageUrl,
    heroImagePath: rawCustomization.heroImagePath,
    heroSubtitle: rawCustomization.heroSubtitle,
    heroTitle: rawCustomization.heroTitle,
    includedItems: rawCustomization.includedItems,
    includes: rawCustomization.includedItems,
    extraSections: rawCustomization.extraSections,
    isFeatured: rawCustomization.isFeatured,
    isVerifiedByEkalox: rawCustomization.isVerifiedByEkalox,
    landingDescription: rawCustomization.landingDescription,
    previewGallery: signedGallery,
    pricingBox: rawCustomization.pricingBox,
    productTheme: rawCustomization.productTheme,
  };
}

async function getExactCount(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  table: string,
  column: string,
  id: string,
) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq(column, id);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

async function getRatingSummary(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  reelId: string,
) {
  const { data, error } = await supabase
    .from("reel_reviews")
    .select("rating")
    .eq("reel_id", reelId);

  if (error || !data?.length) {
    return { averageRating: 0, ratingCount: 0, reviewsCount: 0 };
  }

  const ratings = data.map((row) => Number(row.rating)).filter((rating) => Number.isFinite(rating));
  const total = ratings.reduce((sum, rating) => sum + rating, 0);

  return {
    averageRating: ratings.length ? Number((total / ratings.length).toFixed(1)) : 0,
    ratingCount: ratings.length,
    reviewsCount: data.length,
  };
}

async function getCreatorMaps(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  products: ProductRow[],
) {
  const profileIds = Array.from(new Set(products.map((product) => product.creator_profile_id)));
  const { data: profilesData } = await supabase
    .from("creator_profiles")
    .select("id, handle, user_id")
    .in("id", profileIds);

  const profiles = (profilesData ?? []) as CreatorProfileRow[];
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  const userIds = Array.from(new Set(profiles.map((profile) => profile.user_id)));
  const { data: usersData } = await supabase
    .from("users")
    .select("id, display_name")
    .in("id", userIds);

  const users = (usersData ?? []) as UserRow[];
  const userById = new Map(users.map((item) => [item.id, item]));

  return { profileById, userById };
}

async function buildCardsFromRows(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  reels: ProductReelRow[],
  products: ProductRow[],
) {
  if (reels.length === 0 || products.length === 0) {
    return [];
  }

  const { profileById, userById } = await getCreatorMaps(supabase, products);
  const productById = new Map(products.map((product) => [product.id, product]));

  const cards = await Promise.all(
    reels.map(async (reel) => {
      const product = productById.get(reel.product_id);

      if (!product || product.is_archived || product.moderation_status === "removed") {
        return null;
      }

      const profile = profileById.get(product.creator_profile_id);
      const profileUser = profile ? userById.get(profile.user_id) : undefined;
      const [reelUrl, thumbnailUrl, landing, downloadsCount, creatorFollowingCount, ratingSummary] = await Promise.all([
        getSignedReelUrl(supabase, UPLOAD_STORAGE_BUCKET, reel.reel_video_path),
        getSignedOptionalAssetUrl(supabase, UPLOAD_STORAGE_BUCKET, reel.thumbnail_path),
        buildProductLanding(supabase, product),
        getExactCount(supabase, "reel_downloads", "reel_id", reel.product_id),
        profile ? getExactCount(supabase, "creator_follows", "follower_id", profile.user_id) : 0,
        getRatingSummary(supabase, reel.product_id),
      ]);

      return {
        aboutText: product.description,
        category: product.category || null,
        productId: reel.product_id,
        title: product.title,
        caption: reel.caption || product.summary || product.description,
        creatorProfileId: product.creator_profile_id,
        creatorFollowingCount,
        creatorName: getDisplayCreatorName(profile, profileUser),
        ctaType: product.cta_type,
        priceAmount: getProductPriceAmount(product),
        priceCurrency: getProductPriceCurrency(product),
        priceCents: product.price_cents,
        currencyCode: product.currency_code,
        createdAt: reel.created_at,
        reelUrl,
        thumbnailUrl,
        tags: product.tags ?? [],
        verificationStatus: product.verification_status || "unverified",
        moderationStatus: product.moderation_status || "clean",
        affiliateEnabled: Boolean(product.affiliate_enabled),
        customization: landing,
        landing,
        visibility: product.visibility || "public",
        downloadsCount,
        ...ratingSummary,
      } satisfies ReelProductCard;
    }),
  );

  return cards.filter((card): card is NonNullable<typeof card> => card !== null);
}

async function getProductsByIds(productIds: string[]): Promise<ReelProductCard[]> {
  const supabase = await getSupabaseServerClient();

  if (productIds.length === 0) {
    return [];
  }

  const [{ data: reelsData, error: reelsError }, productsResult] = await Promise.all([
    supabase
      .from("product_reels")
      .select("id, product_id, caption, created_at, reel_video_path, thumbnail_path")
      .in("product_id", productIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select(PRODUCT_SELECT_WITH_CUSTOMIZATION)
      .in("id", productIds),
  ]);

  const { data: productsData, error: productsError } = productsResult.error && isMissingCustomizationColumnError(productsResult.error)
    ? await supabase
        .from("products")
        .select(BASE_PRODUCT_SELECT)
        .in("id", productIds)
    : productsResult;

  const reels = (reelsData ?? []) as ProductReelRow[];
  const products = (productsData ?? []) as ProductRow[];

  if (reelsError || productsError) {
    return [];
  }

  return buildCardsFromRows(supabase, reels, products);
}

/**
 * Fetches reel-first product cards that belong to the currently authenticated creator.
 */
export async function getMyUploads(userId: string): Promise<ReelProductCard[]> {
  const supabase = await getSupabaseServerClient();
  const appUserId = await getAppUserIdForAuthUser(supabase, userId);

  const { data: reelsData, error: reelsError } = await supabase
    .from("product_reels")
    .select("id, product_id, caption, created_at, reel_video_path, thumbnail_path")
    .eq("creator_user_id", appUserId)
    .order("created_at", { ascending: false });

  const reels = (reelsData ?? []) as ProductReelRow[];

  if (reelsError || reels.length === 0) {
    return [];
  }

  const productIds = reels.map((item) => item.product_id);

  const productsResult = await supabase
    .from("products")
    .select(PRODUCT_SELECT_WITH_CUSTOMIZATION)
    .in("id", productIds);

  const { data: productsData, error: productsError } = productsResult.error && isMissingCustomizationColumnError(productsResult.error)
    ? await supabase
        .from("products")
        .select(BASE_PRODUCT_SELECT)
        .in("id", productIds)
    : productsResult;

  const products = (productsData ?? []) as ProductRow[];

  if (productsError || products.length === 0) {
    return [];
  }

  return buildCardsFromRows(supabase, reels, products);
}

export async function getPublicReelFeed(): Promise<ReelProductCard[]> {
  const supabase = await getSupabaseServerClient();

  const { data: reelsData, error: reelsError } = await supabase
    .from("product_reels")
    .select("id, product_id, caption, created_at, reel_video_path, thumbnail_path")
    .order("created_at", { ascending: false });

  const reels = (reelsData ?? []) as ProductReelRow[];

  if (reelsError || reels.length === 0) {
    return [];
  }

  const productIds = Array.from(new Set(reels.map((reel) => reel.product_id)));

  const productsResult = await supabase
    .from("products")
    .select(PRODUCT_SELECT_WITH_CUSTOMIZATION)
    .in("id", productIds)
    .in("status", PUBLIC_PRODUCT_STATUSES)
    .eq("visibility", "public")
    .eq("is_archived", false)
    .not("moderation_status", "in", "(removed,under_review)");

  const { data: productsData, error: productsError } = productsResult.error && isMissingCustomizationColumnError(productsResult.error)
    ? await supabase
        .from("products")
        .select(BASE_PRODUCT_SELECT)
        .in("id", productIds)
        .in("status", PUBLIC_PRODUCT_STATUSES)
        .eq("visibility", "public")
        .eq("is_archived", false)
        .not("moderation_status", "in", "(removed,under_review)")
    : productsResult;

  const products = (productsData ?? []) as ProductRow[];

  if (productsError || products.length === 0) {
    return [];
  }

  return buildCardsFromRows(supabase, reels, products);
}

export async function getPublicReelProductDetail(productId: string): Promise<ReelProductCard | null> {
  const feed = await getPublicReelFeed();
  return feed.find((item) => item.productId === productId) ?? null;
}

export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  const supabase = await getSupabaseServerClient();

  const { data: reviewsData, error } = await supabase
    .from("reel_reviews")
    .select("user_id, rating, text, created_at")
    .eq("reel_id", productId)
    .order("created_at", { ascending: false });

  if (error || !reviewsData?.length) {
    return [];
  }

  const userIds = Array.from(new Set(reviewsData.map((review) => String(review.user_id))));
  const { data: usersData } = await supabase
    .from("users")
    .select("id, display_name")
    .in("id", userIds);

  const users = (usersData ?? []) as UserRow[];
  const userById = new Map(users.map((user) => [user.id, user]));

  return reviewsData.map((review) => ({
    id: `${review.user_id}-${productId}`,
    rating: Number(review.rating),
    text: typeof review.text === "string" ? review.text : null,
    createdAt: String(review.created_at),
    userName: userById.get(String(review.user_id))?.display_name || "EKALOX buyer",
  }));
}

export async function getUserProductLibrary(userId: string): Promise<ReelProductCard[]> {
  const supabase = await getSupabaseServerClient();
  const [{ data: freeClaims }, { data: paidOrders }] = await Promise.all([
    supabase.from("free_claims").select("product_id").eq("user_id", userId),
    supabase
      .from("orders")
      .select("product_id")
      .eq("buyer_user_id", userId)
      .in("status", ["paid", "fulfilled"]),
  ]);

  const productIds = Array.from(
    new Set([
      ...((freeClaims ?? []).map((claim) => String(claim.product_id))),
      ...((paidOrders ?? []).map((order) => String(order.product_id))),
    ]),
  );

  if (productIds.length === 0) {
    return [];
  }

  const products = await getProductsByIds(productIds);
  return products.filter((product) => !["removed", "under_review"].includes(product.moderationStatus || "clean"));
}

export interface UserProfileOrderItem {
  creatorName: string;
  date: string;
  orderType: "free" | "paid";
  productId: string;
  review: {
    createdAt: string;
    rating: number;
    text: string | null;
  } | null;
  reelUrl: string | null;
  title: string;
  verifiedLabel: "Verified download" | "Verified purchase";
}

export async function getUserProfileOrders(userId: string): Promise<UserProfileOrderItem[]> {
  const supabase = await getSupabaseServerClient();
  const [{ data: freeClaims }, { data: paidOrders }, { data: reviews }] = await Promise.all([
    supabase.from("free_claims").select("product_id, created_at").eq("user_id", userId),
    supabase
      .from("orders")
      .select("product_id, created_at, purchased_at")
      .eq("buyer_user_id", userId)
      .in("status", ["paid", "fulfilled"]),
    supabase.from("reel_reviews").select("reel_id, rating, text, created_at").eq("user_id", userId),
  ]);

  const productIds = Array.from(
    new Set([
      ...((freeClaims ?? []).map((claim) => String(claim.product_id))),
      ...((paidOrders ?? []).map((order) => String(order.product_id))),
    ]),
  );

  if (productIds.length === 0) {
    return [];
  }

  const products = await getProductsByIds(productIds);
  const productById = new Map(products.map((product) => [product.productId, product]));
  const reviewByProductId = new Map(
    (reviews ?? []).map((review) => [
      String(review.reel_id),
      {
        createdAt: String(review.created_at),
        rating: Number(review.rating),
        text: typeof review.text === "string" ? review.text : null,
      },
    ]),
  );
  const paidProductIds = new Set((paidOrders ?? []).map((order) => String(order.product_id)));

  const paidItems = (paidOrders ?? []).flatMap((order) => {
    const productId = String(order.product_id);
    const product = productById.get(productId);

    if (!product) {
      return [];
    }

    return [{
      creatorName: product.creatorName,
      date: String(order.purchased_at || order.created_at),
      orderType: "paid" as const,
      productId,
      review: reviewByProductId.get(productId) ?? null,
      reelUrl: product.reelUrl,
      title: product.title,
      verifiedLabel: "Verified purchase" as const,
    }];
  });

  const freeItems = (freeClaims ?? []).flatMap((claim) => {
    const productId = String(claim.product_id);
    const product = productById.get(productId);

    if (!product || paidProductIds.has(productId)) {
      return [];
    }

    return [{
      creatorName: product.creatorName,
      date: String(claim.created_at),
      orderType: "free" as const,
      productId,
      review: reviewByProductId.get(productId) ?? null,
      reelUrl: product.reelUrl,
      title: product.title,
      verifiedLabel: "Verified download" as const,
    }];
  });

  return [...paidItems, ...freeItems].sort((first, second) => (
    new Date(second.date).getTime() - new Date(first.date).getTime()
  ));
}

export async function getCreatorManagedProduct(productId: string, userId: string): Promise<ReelProductCard | null> {
  const supabase = await getSupabaseServerClient();
  const [{ data: reelData, error: reelError }, productResult] = await Promise.all([
    supabase
      .from("product_reels")
      .select("id, product_id, caption, created_at, reel_video_path, thumbnail_path")
      .eq("product_id", productId)
      .eq("creator_user_id", userId)
      .maybeSingle(),
    supabase
      .from("products")
      .select(PRODUCT_SELECT_WITH_CUSTOMIZATION)
      .eq("id", productId)
      .maybeSingle(),
  ]);

  const { data: productData, error: productError } = productResult.error && isMissingCustomizationColumnError(productResult.error)
    ? await supabase
        .from("products")
        .select(BASE_PRODUCT_SELECT)
        .eq("id", productId)
        .maybeSingle()
    : productResult;

  if (reelError || productError || !reelData || !productData) {
    return null;
  }

  const cards = await buildCardsFromRows(supabase, [reelData as ProductReelRow], [productData as ProductRow]);
  return cards[0] ?? null;
}
