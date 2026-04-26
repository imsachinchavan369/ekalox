import { redirect } from "next/navigation";

import { isAdminRole } from "@/lib/roles";
import { isAdminVerifiedSession } from "@/lib/security/admin-session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

async function getUserRole(userId: string) {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return typeof data?.role === "string" ? data.role : null;
}

export function isAdminOtpDisabled() {
  return process.env.DISABLE_ADMIN_OTP === "true";
}

export async function isAdminUser(userId: string) {
  const role = await getUserRole(userId);
  return isAdminRole(role);
}

export async function requireAdmin(nextPath = "/admin") {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const isAdmin = await isAdminUser(user.id);

  if (!isAdmin) {
    redirect("/");
  }

  return user;
}

export async function getAdminApiUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const isAdmin = await isAdminUser(user.id);
  return isAdmin ? user : null;
}

export async function requireAdminVerified(nextPath = "/admin") {
  const user = await requireAdmin(nextPath);

  if (isAdminOtpDisabled()) {
    return { needsOtp: false as const, user };
  }

  const verified = await isAdminVerifiedSession(user.id);

  if (!verified) {
    return { needsOtp: true as const, user };
  }

  return { needsOtp: false as const, user };
}

export async function getAdminVerifiedApiUser() {
  const user = await getAdminApiUser();

  if (!user) {
    return null;
  }

  if (isAdminOtpDisabled()) {
    return user;
  }

  const verified = await isAdminVerifiedSession(user.id);
  return verified ? user : null;
}
