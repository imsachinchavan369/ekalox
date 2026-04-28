const SEEN_REELS_STORAGE_KEY = "ekalox:recently-seen-reels";
const MAX_SEEN_REELS = 24;

function readSeenReels(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const value = window.localStorage.getItem(SEEN_REELS_STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeSeenReels(ids: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SEEN_REELS_STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_SEEN_REELS)));
  } catch {
    // Ignore storage failures so reels playback keeps working.
  }
}

export function getRecentlySeenReelIds() {
  return readSeenReels();
}

export function rememberSeenReelId(reelId: string) {
  const normalizedId = reelId.trim();

  if (!normalizedId) {
    return;
  }

  const existingIds = readSeenReels().filter((id) => id !== normalizedId);
  writeSeenReels([normalizedId, ...existingIds]);
}
