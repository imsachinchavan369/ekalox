"use client";

import { useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type CountMap = Record<string, number>;
type FollowMap = Record<string, boolean>;

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids.filter(Boolean)));
}

async function countCreatorFollowers(creatorId: string) {
  const supabase = getSupabaseBrowserClient();
  const { count, error } = await supabase
    .from("creator_follows")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", creatorId);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export function useCreatorFollows(creatorIds: string[] = []) {
  const normalizedCreatorIds = useMemo(() => uniqueIds(creatorIds), [creatorIds]);
  const [counts, setCounts] = useState<CountMap>({});
  const [following, setFollowing] = useState<FollowMap>({});
  const [followingCount, setFollowingCount] = useState(0);
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
      const nextCounts = await normalizedCreatorIds.reduce<Promise<CountMap>>(async (promise, creatorId) => {
        const acc = await promise;
        acc[creatorId] = await countCreatorFollowers(creatorId);
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
  }, [normalizedCreatorIds]);

  useEffect(() => {
    let isMounted = true;

    async function loadFollowingState() {
      if (!userId) {
        setFollowing({});
        setFollowingCount(0);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      const { count } = await supabase
        .from("creator_follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);

      if (isMounted) {
        setFollowingCount(count ?? 0);
      }

      if (normalizedCreatorIds.length === 0) {
        setFollowing({});
        return;
      }

      const { data, error } = await supabase
        .from("creator_follows")
        .select("creator_id")
        .eq("follower_id", userId)
        .in("creator_id", normalizedCreatorIds);

      if (!isMounted) {
        return;
      }

      if (error) {
        setFollowing({});
        return;
      }

      setFollowing(Object.fromEntries((data ?? []).map((row) => [String(row.creator_id), true])));
    }

    void loadFollowingState();

    return () => {
      isMounted = false;
    };
  }, [normalizedCreatorIds, userId]);

  const getFollowerCount = (creatorId: string) => counts[creatorId] ?? 0;
  const getFollowingCount = () => followingCount;
  const isFollowing = (creatorId: string) => Boolean(following[creatorId]);

  const toggleFollow = async (creatorId: string) => {
    if (!userId) {
      setLoginPrompt("Please log in to follow creators.");
      return;
    }

    setLoginPrompt("");
    const wasFollowing = Boolean(following[creatorId]);
    const supabase = getSupabaseBrowserClient();

    setFollowing((current) => ({ ...current, [creatorId]: !wasFollowing }));
    setCounts((current) => ({ ...current, [creatorId]: Math.max((current[creatorId] ?? 0) + (wasFollowing ? -1 : 1), 0) }));
    setFollowingCount((current) => Math.max(current + (wasFollowing ? -1 : 1), 0));

    const { error } = wasFollowing
      ? await supabase.from("creator_follows").delete().eq("follower_id", userId).eq("creator_id", creatorId)
      : await supabase.from("creator_follows").insert({ follower_id: userId, creator_id: creatorId });

    if (error) {
      setFollowing((current) => ({ ...current, [creatorId]: wasFollowing }));
      setCounts((current) => ({ ...current, [creatorId]: Math.max((current[creatorId] ?? 0) + (wasFollowing ? 1 : -1), 0) }));
      setFollowingCount((current) => Math.max(current + (wasFollowing ? 1 : -1), 0));
      setLoginPrompt("Could not update follow. Please try again.");
    }
  };

  return {
    getFollowerCount,
    getFollowingCount,
    isFollowing,
    loginPrompt,
    toggleFollow,
  };
}
