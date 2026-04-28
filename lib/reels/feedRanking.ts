export interface ReelsFeedRankableItem {
  productId: string;
  createdAt?: string;
  downloadsCount?: number;
  likesCount?: number;
  viewsCount?: number;
  ratingCount?: number;
  reviewsCount?: number;
  verificationStatus?: string;
  verified?: boolean;
  verifiedByEkalox?: boolean;
  verified_by_ekalox?: boolean;
  adminVerified?: boolean;
  admin_verified?: boolean;
}

type BucketName = "new" | "popular" | "verified";

const MIX_SEQUENCE: BucketName[] = ["new", "popular", "new", "popular", "verified"];

function shuffle<T>(items: T[]) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function getCreatedTime(item: ReelsFeedRankableItem) {
  const time = item.createdAt ? new Date(item.createdAt).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function getPopularityScore(item: ReelsFeedRankableItem) {
  return (
    Number(item.viewsCount ?? 0) * 3 +
    Number(item.downloadsCount ?? 0) * 2 +
    Number(item.likesCount ?? 0) * 2 +
    Number(item.reviewsCount ?? item.ratingCount ?? 0)
  );
}

function isVerifiedItem(item: ReelsFeedRankableItem) {
  const status = item.verificationStatus?.toLowerCase();

  return Boolean(
    item.verified ||
      item.verifiedByEkalox ||
      item.verified_by_ekalox ||
      item.adminVerified ||
      item.admin_verified ||
      status === "verified" ||
      status === "trusted" ||
      status === "admin_verified",
  );
}

function takeNext<T extends ReelsFeedRankableItem>(
  bucket: T[],
  usedIds: Set<string>,
) {
  while (bucket.length > 0) {
    const next = bucket.shift();

    if (next && !usedIds.has(next.productId)) {
      usedIds.add(next.productId);
      return next;
    }
  }

  return null;
}

function buildMixedOrder<T extends ReelsFeedRankableItem>(items: T[]) {
  const usedIds = new Set<string>();
  const newestCount = Math.max(1, Math.ceil(items.length * 0.4));
  const popularCount = Math.max(1, Math.ceil(items.length * 0.4));
  const newest = shuffle(
    [...items]
      .sort((first, second) => getCreatedTime(second) - getCreatedTime(first))
      .slice(0, newestCount),
  );
  const popular = shuffle(
    [...items]
      .sort((first, second) => getPopularityScore(second) - getPopularityScore(first))
      .slice(0, popularCount),
  );
  const verified = shuffle(items.filter(isVerifiedItem));
  const fallback = shuffle(items);
  const buckets: Record<BucketName, T[]> = { new: newest, popular, verified };
  const ordered: T[] = [];

  while (ordered.length < items.length) {
    let addedInCycle = false;

    for (const bucketName of MIX_SEQUENCE) {
      const next = takeNext(buckets[bucketName], usedIds);

      if (next) {
        ordered.push(next);
        addedInCycle = true;
      }

      if (ordered.length >= items.length) {
        break;
      }
    }

    if (!addedInCycle) {
      const next = takeNext(fallback, usedIds);

      if (!next) {
        break;
      }

      ordered.push(next);
    }
  }

  return ordered;
}

export function rankReelsFeed<T extends ReelsFeedRankableItem>(items: T[], recentlySeenIds: string[]) {
  if (items.length <= 1) {
    return [...items];
  }

  const recentlySeenSet = new Set(recentlySeenIds);
  const unseenItems = items.filter((item) => !recentlySeenSet.has(item.productId));
  const seenItems = items.filter((item) => recentlySeenSet.has(item.productId));
  const ordered = [...buildMixedOrder(unseenItems), ...buildMixedOrder(seenItems)];
  const lastFirstId = recentlySeenIds[0];

  if (lastFirstId && ordered[0]?.productId === lastFirstId) {
    const replacementIndex = ordered.findIndex((item) => item.productId !== lastFirstId);

    if (replacementIndex > 0) {
      [ordered[0], ordered[replacementIndex]] = [ordered[replacementIndex], ordered[0]];
    }
  }

  return ordered;
}
