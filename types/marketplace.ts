export type Category =
  | "ai"
  | "prompts"
  | "music"
  | "design"
  | "graphics"
  | "templates"
  | "presets"
  | "websites"
  | "code"
  | "apps"
  | "audio"
  | "video"
  | "ebooks"
  | "courses"
  | "marketing"
  | "social_media"
  | "productivity"
  | "business"
  | "other";

export type CTAType =
  | "buy_now"
  | "add_to_cart"
  | "download_free"
  | "preorder"
  | "join_waitlist";

export type ProductStatus =
  | "draft"
  | "active"
  | "coming_soon"
  | "sold_out"
  | "archived";

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  isVerifiedSeller: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVideo {
  id: string;
  productId: string;
  url: string;
  provider: "youtube" | "vimeo" | "loom" | "other";
  thumbnailUrl?: string;
  durationSeconds?: number;
  isPrimary?: boolean;
}

export interface Product {
  id: string;
  sellerId: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: Category;
  status: ProductStatus;
  ctaType?: CTAType;
  currency: string;
  priceInCents: number;
  isFree: boolean;
  coverImageUrl?: string;
  previewVideo?: ProductVideo;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  buyerId: string;
  productId: string;
  sellerId: string;
  quantity: number;
  unitPriceInCents: number;
  totalPriceInCents: number;
  currency: string;
  status: "pending" | "paid" | "refunded" | "failed";
  createdAt: string;
  updatedAt: string;
}

export interface Download {
  id: string;
  orderId: string;
  productId: string;
  buyerId: string;
  downloadUrl: string;
  expiresAt?: string;
  downloadCount: number;
  lastDownloadedAt?: string;
  createdAt: string;
}
