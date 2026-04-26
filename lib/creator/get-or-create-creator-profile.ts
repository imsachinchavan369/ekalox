import type { User } from "@supabase/supabase-js";

import { createSafeGeneratedUsername } from "@/lib/auth/username";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface CreatorProfileForUpload {
  accountSafetyStatus: string;
  id: string;
  userId: string;
}

interface AppUserForCreatorProfile {
  account_safety_status: string | null;
  auth_user_id?: string | null;
  email?: string | null;
  id: string;
}

function getDisplayName(user: User) {
  const metadataName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : "";

  return metadataName.trim() || user.email?.split("@")[0] || "EKALOX Creator";
}

function getCreatorUsername(user: User) {
  return createSafeGeneratedUsername(user.email?.split("@")[0] || "creator", user.id);
}

function logSupabaseError(stage: string, table: string, authUserId: string, error: unknown) {
  const supabaseError = error as {
    code?: string;
    details?: string;
    hint?: string;
    message?: string;
  } | null;

  console.error("[upload] creator account Supabase error", {
    authUserId,
    code: supabaseError?.code,
    details: supabaseError?.details,
    hint: supabaseError?.hint,
    message: supabaseError?.message,
    stage,
    table,
  });
}

export async function getOrCreateCreatorProfile(user: User): Promise<CreatorProfileForUpload> {
  const supabase = await getSupabaseServerClient();

  if (!user.email) {
    throw new Error("Your account is missing an email address.");
  }

  const displayName = getDisplayName(user);
  const username = getCreatorUsername(user);

  console.info("[upload] resolving creator account", {
    authUserEmail: user.email,
    authUserId: user.id,
  });

  const { data: existingUserByAuthId, error: existingUserByAuthIdError } = await supabase
    .from("users")
    .select("id, account_safety_status, auth_user_id, email")
    .or(`id.eq.${user.id},auth_user_id.eq.${user.id}`)
    .maybeSingle();

  console.info("[upload] creator account lookup result", {
    authUserId: user.id,
    foundUserId: existingUserByAuthId?.id ?? null,
    table: "users",
  });

  if (existingUserByAuthIdError) {
    logSupabaseError("lookup_by_auth_id", "users", user.id, existingUserByAuthIdError);
    throw new Error("Could not prepare your creator account. Please try again.");
  }

  let appUser: AppUserForCreatorProfile | null = existingUserByAuthId ?? null;

  if (!appUser) {
    const { data: existingUserByEmail, error: existingUserByEmailError } = await supabase
      .from("users")
      .select("id, account_safety_status, auth_user_id, email")
      .eq("email", user.email)
      .maybeSingle();

    console.info("[upload] creator account email lookup result", {
      authUserEmail: user.email,
      authUserId: user.id,
      foundUserId: existingUserByEmail?.id ?? null,
      table: "users",
    });

    if (existingUserByEmailError) {
      logSupabaseError("lookup_by_email", "users", user.id, existingUserByEmailError);
      throw new Error("Could not prepare your creator account. Please try again.");
    }

    appUser = existingUserByEmail ?? null;
  }

  if (!appUser) {
    const { data: createdUser, error: createUserError } = await supabase
      .from("users")
      .insert({
        auth_user_id: user.id,
        display_name: displayName,
        email: user.email,
        id: user.id,
        username,
      })
      .select("id, account_safety_status")
      .single();

    console.info("[upload] creator account insert result", {
      authUserEmail: user.email,
      authUserId: user.id,
      createdUserId: createdUser?.id ?? null,
      table: "users",
    });

    if (createUserError || !createdUser) {
      logSupabaseError("insert", "users", user.id, createUserError);
      throw new Error("Could not prepare your creator account. Please try again.");
    }

    appUser = createdUser;
  } else {
    const { error: linkUserError } = await supabase
      .from("users")
      .update({ auth_user_id: user.id })
      .eq("id", appUser.id)
      .is("auth_user_id", null);

    if (linkUserError) {
      logSupabaseError("best_effort_link_auth_user", "users", user.id, linkUserError);
    }
  }

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("creator_profiles")
    .select("id, user_id")
    .eq("user_id", appUser.id)
    .maybeSingle();

  console.info("[upload] creator profile lookup result", {
    authUserId: user.id,
    foundCreatorProfileId: existingProfile?.id ?? null,
    table: "creator_profiles",
    userId: appUser.id,
  });

  if (existingProfileError) {
    logSupabaseError("lookup", "creator_profiles", user.id, existingProfileError);
    throw new Error("Could not prepare your creator profile. Please try again.");
  }

  if (existingProfile) {
    console.info("[upload] creator profile found", { creatorProfileId: existingProfile.id, userId: appUser.id });
    return {
      accountSafetyStatus: appUser.account_safety_status || "active",
      id: existingProfile.id,
      userId: appUser.id,
    };
  }

  const { data: createdProfile, error: createProfileError } = await supabase
    .from("creator_profiles")
    .upsert({
      handle: username,
      user_id: appUser.id,
    }, { onConflict: "user_id", ignoreDuplicates: false })
    .select("id")
    .single();

  console.info("[upload] creator profile insert result", {
    authUserId: user.id,
    createdCreatorProfileId: createdProfile?.id ?? null,
    table: "creator_profiles",
    userId: appUser.id,
  });

  if (createProfileError || !createdProfile) {
    logSupabaseError("insert", "creator_profiles", user.id, createProfileError);
    throw new Error("Could not create your creator profile. Please try again.");
  }

  console.info("[upload] creator profile created", { creatorProfileId: createdProfile.id, userId: appUser.id });

  return {
    accountSafetyStatus: "active",
    id: createdProfile.id,
    userId: appUser.id,
  };
}
