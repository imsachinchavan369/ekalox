import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { getSupabaseServerClient } from "@/lib/supabase";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * Server-side auth guard for protected App Router routes.
 */
export async function requireUser(nextPath = "/profile"): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return user;
}
