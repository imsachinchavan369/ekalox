export interface ReelsFeedRankableItem {
  productId: string;
}

export interface ReelsFeedRankingState {
  lastFirstReelId: string | null;
  recentlySeenReelIds: string[];
}

function shuffle<T>(items: T[]) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function dedupeReels<T extends ReelsFeedRankableItem>(items: T[]) {
  const seenIds = new Set<string>();
  const dedupedItems: T[] = [];

  for (const item of items) {
    if (seenIds.has(item.productId)) {
      continue;
    }

    seenIds.add(item.productId);
    dedupedItems.push(item);
  }

  return dedupedItems;
}

export function rankReelsFeed<T extends ReelsFeedRankableItem>(
  items: T[],
  { lastFirstReelId, recentlySeenReelIds }: ReelsFeedRankingState,
) {
  const dedupedItems = dedupeReels(items);

  if (dedupedItems.length <= 1) {
    return dedupedItems;
  }

  const recentlySeenSet = new Set(recentlySeenReelIds);
  let firstCandidates = dedupedItems.filter((item) => (
    item.productId !== lastFirstReelId && !recentlySeenSet.has(item.productId)
  ));

  if (firstCandidates.length === 0) {
    firstCandidates = dedupedItems.filter((item) => item.productId !== lastFirstReelId);
  }

  if (firstCandidates.length === 0) {
    firstCandidates = dedupedItems;
  }

  const firstItem = randomItem(firstCandidates);
  const remainingItems = dedupedItems.filter((item) => item.productId !== firstItem.productId);
  const unseenItems = remainingItems.filter((item) => !recentlySeenSet.has(item.productId));
  const seenItems = remainingItems.filter((item) => recentlySeenSet.has(item.productId));

  if (unseenItems.length > 0) {
    return [firstItem, ...shuffle(unseenItems), ...shuffle(seenItems)];
  }

  return [firstItem, ...shuffle(remainingItems)];
}
