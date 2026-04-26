import type { User as AuthUser } from "@supabase/supabase-js";

import { createSafeGeneratedUsername } from "@/lib/auth/username";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function getDisplayName(authUser: AuthUser): string {
  const fromMetadata =
    typeof authUser.user_metadata?.display_name === "string"
      ? authUser.user_metadata.display_name
      : typeof authUser.user_metadata?.full_name === "string"
        ? authUser.user_metadata.full_name
        : "";

  if (fromMetadata.trim()) {
    return fromMetadata.trim();
  }

  return authUser.email?.split("@")[0] ?? "EKALOX User";
}

function getHandle(authUser: AuthUser): string {
  const emailPrefix = authUser.email?.split("@")[0] ?? "creator";
  return createSafeGeneratedUsername(emailPrefix, authUser.id);
}

/**
 * Ensures a Supabase auth user has matching rows in:
 * - public.users
 * - public.creator_profiles
 *
 * Safe to call repeatedly (uses upsert + conflict keys).
 */
export async function syncUserFromAuth(authUser: AuthUser): Promise<boolean> {
  try {
    const supabase = await getSupabaseServerClient();

    if (!authUser.email) {
      return false;
    }

    const userPayload = {
      id: authUser.id,
      auth_user_id: authUser.id,
      email: authUser.email,
      username: getHandle(authUser),
      display_name: getDisplayName(authUser),
    };

    const { error: userError } = await supabase
      .from("users")
      .upsert(userPayload, { onConflict: "id", ignoreDuplicates: false });

    if (userError) {
      console.warn("[auth-sync] users upsert failed:", userError.message);
      return false;
    }

    const creatorProfilePayload = {
      user_id: authUser.id,
      handle: getHandle(authUser),
    };

    const { error: creatorProfileError } = await supabase
      .from("creator_profiles")
      .upsert(creatorProfilePayload, { onConflict: "user_id", ignoreDuplicates: false });

    if (creatorProfileError) {
      console.warn("[auth-sync] creator_profiles upsert failed:", creatorProfileError.message);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[auth-sync] syncUserFromAuth unexpected error:", error);
    return false;
  }
}

/**
 * Reads the authenticated Supabase user and syncs app DB rows if present.
 */
export async function syncCurrentAuthenticatedUser() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    await syncUserFromAuth(user);
    return user;
  } catch (error) {
    console.warn("[auth-sync] syncCurrentAuthenticatedUser unexpected error:", error);
    return null;
  }
}
