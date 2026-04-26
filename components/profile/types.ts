import type { ReelProductCard } from "@/lib/uploads/queries";

export interface ProfileIdentity {
  avatarUrl: string | null;
  bio: string;
  displayName: string;
  email: string | null;
  username: string;
}

export interface ProfileDashboardStats {
  creatorProfileId?: string;
  productCount: number;
  totalDownloads: number;
}

export type ProfileProduct = ReelProductCard;

export interface ProfileOrderReview {
  createdAt: string;
  rating: number;
  text: string | null;
}

export interface ProfileOrderItem {
  creatorName: string;
  date: string;
  orderType: "free" | "paid";
  productId: string;
  review: ProfileOrderReview | null;
  reelUrl: string | null;
  title: string;
  verifiedLabel: "Verified download" | "Verified purchase";
}
