import { getSupabaseServerClient } from "@/lib/supabase/server";

export const DAILY_UPLOAD_LIMIT = 3;

function getStartOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function getUploadCountToday(creatorProfileId: string) {
  const supabase = await getSupabaseServerClient();
  const startOfTodayUtc = getStartOfUtcDay(new Date()).toISOString();

  const { count, error } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("creator_profile_id", creatorProfileId)
    .neq("status", "draft")
    .gte("created_at", startOfTodayUtc);

  if (error) {
    throw new Error("Could not check today's upload limit.");
  }

  return count ?? 0;
}

export async function assertDailyUploadLimit(creatorProfileId: string) {
  const publishedTodayCount = await getUploadCountToday(creatorProfileId);

  if (publishedTodayCount >= DAILY_UPLOAD_LIMIT) {
    throw new Error(`You've reached today's upload limit (${DAILY_UPLOAD_LIMIT} uploads). Try again tomorrow.`);
  }
}
