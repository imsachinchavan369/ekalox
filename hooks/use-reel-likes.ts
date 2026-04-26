"use client";

import { useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type CountMap = Record<string, number>;
type LikedMap = Record<string, boolean>;

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids.filter(Boolean)));
}

async function countRows(table: string, column: string, id: string) {
  const supabase = getSupabaseBrowserClient();
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq(column, id);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export function useReelLikes(reelIds: string[]) {
  const normalizedReelIds = useMemo(() => uniqueIds(reelIds), [reelIds]);
  const [counts, setCounts] = useState<CountMap>({});
  const [liked, setLiked] = useState<LikedMap>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loginPrompt, setLoginPrompt] = useState("");

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseBrowserClient();

    void supabase.auth.getUser().then(({ data }) => {
      if (isMounted) {
        setUserId(data.user?.id ?? null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadCounts() {
      const nextCounts = await normalizedReelIds.reduce<Promise<CountMap>>(async (promise, reelId) => {
        const acc = await promise;
        acc[reelId] = await countRows("reel_likes", "reel_id", reelId);
        return acc;
      }, Promise.resolve({}));

      if (isMounted) {
        setCounts(nextCounts);
      }
    }

    void loadCounts();

    return () => {
      isMounted = false;
    };
  }, [normalizedReelIds]);

  useEffect(() => {
    let isMounted = true;

    async function loadLikedState() {
      if (!userId || normalizedReelIds.length === 0) {
        setLiked({});
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("reel_likes")
        .select("reel_id")
        .eq("user_id", userId)
        .in("reel_id", normalizedReelIds);

      if (!isMounted) {
        return;
      }

      if (error) {
        setLiked({});
        return;
      }

      setLiked(Object.fromEntries((data ?? []).map((row) => [String(row.reel_id), true])));
    }

    void loadLikedState();

    return () => {
      isMounted = false;
    };
  }, [normalizedReelIds, userId]);

  const getLikeCount = (reelId: string) => counts[reelId] ?? 0;
  const isLiked = (reelId: string) => Boolean(liked[reelId]);

  const toggleLike = async (reelId: string) => {
    if (!userId) {
      setLoginPrompt("Please log in to like reels.");
      return;
    }

    setLoginPrompt("");
    const wasLiked = Boolean(liked[reelId]);
    const supabase = getSupabaseBrowserClient();

    setLiked((current) => ({ ...current, [reelId]: !wasLiked }));
    setCounts((current) => ({ ...current, [reelId]: Math.max((current[reelId] ?? 0) + (wasLiked ? -1 : 1), 0) }));

    const { error } = wasLiked
      ? await supabase.from("reel_likes").delete().eq("user_id", userId).eq("reel_id", reelId)
      : await supabase.from("reel_likes").insert({ user_id: userId, reel_id: reelId });

    if (error) {
      setLiked((current) => ({ ...current, [reelId]: wasLiked }));
      setCounts((current) => ({ ...current, [reelId]: Math.max((current[reelId] ?? 0) + (wasLiked ? 1 : -1), 0) }));
      setLoginPrompt("Could not update like. Please try again.");
    }
  };

  return {
    getLikeCount,
    isLiked,
    loginPrompt,
    toggleLike,
  };
}
