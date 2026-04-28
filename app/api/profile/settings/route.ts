import { NextRequest, NextResponse } from "next/server";

import { getUsernameValidationError, isReservedUsername } from "@/lib/auth/is-username-allowed";
import { isAdminUser } from "@/lib/auth/require-admin";
import { sanitizeUsername } from "@/lib/auth/username";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function canChangeUsername(lastChangedAt: unknown) {
  if (typeof lastChangedAt !== "string") {
    return true;
  }

  const changedTime = new Date(lastChangedAt).getTime();
  if (!Number.isFinite(changedTime)) {
    return true;
  }

  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - changedTime >= thirtyDays;
}

export async function PATCH(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Please log in again.", 401);
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return jsonError("Settings could not be saved.", 400);
  }

  let displayName = cleanText(body.displayName, 60);
  const username = sanitizeUsername(typeof body.username === "string" ? body.username : "");
  const bio = cleanText(body.bio, 160);
  const avatarUrl = cleanText(body.avatarUrl, 500);
  const password = cleanText(body.password, 128);
  const metadata = user.user_metadata ?? {};
  const isAdmin = await isAdminUser(user.id);
  const isReserved = isReservedUsername(username);

  if (isReserved && isAdmin) {
    displayName = "EKALOX";
  }

  if (displayName.length < 2) {
    return jsonError("Display name must be at least 2 characters.", 400);
  }

  if (username.length < 3) {
    return jsonError("Username must be at least 3 characters.", 400);
  }

  const usernameValidationError = getUsernameValidationError(username, { isAdmin });
  if (usernameValidationError) {
    return jsonError(usernameValidationError, 400);
  }

  if (isReserved && isAdmin) {
    const [
      { data: existingReservedUser, error: existingReservedUserError },
      { data: existingReservedCreatorProfile, error: existingReservedCreatorProfileError },
    ] = await Promise.all([
      supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .neq("id", user.id)
        .maybeSingle(),
      supabase
        .from("creator_profiles")
        .select("id")
        .eq("handle", username)
        .neq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (existingReservedUserError || existingReservedCreatorProfileError) {
      return jsonError("Settings could not be saved.", 400);
    }

    if (existingReservedUser || existingReservedCreatorProfile) {
      return jsonError("This official username is already in use.", 409);
    }
  }

  if (username !== metadata.username && !(isReserved && isAdmin) && !canChangeUsername(metadata.username_changed_at)) {
    return jsonError("Username changes are limited. Please try again later.", 429);
  }

  if (password && password.length < 8) {
    return jsonError("Password must be at least 8 characters.", 400);
  }

  const nextMetadata = {
    ...metadata,
    avatar_url: avatarUrl || null,
    bio,
    display_name: displayName,
    username,
    username_changed_at: username !== metadata.username ? new Date().toISOString() : metadata.username_changed_at,
  };

  const { error: authError } = await supabase.auth.updateUser({
    data: nextMetadata,
    ...(password ? { password } : {}),
  });

  if (authError) {
    return jsonError("Settings could not be saved.", 400);
  }

  const creatorProfileUpdate = {
    bio,
    display_name: displayName,
    handle: username,
    username,
    ...(isReserved && isAdmin ? { is_verified: true } : {}),
  };

  await Promise.all([
    supabase
      .from("users")
      .update({ avatar_url: avatarUrl || null, display_name: displayName, username })
      .eq("id", user.id),
    supabase.from("creator_profiles").update(creatorProfileUpdate).eq("user_id", user.id),
  ]);

  return NextResponse.json({
    identity: {
      avatarUrl: avatarUrl || null,
      bio,
      displayName,
      email: user.email ?? null,
      username,
    },
    success: true,
  });
}
