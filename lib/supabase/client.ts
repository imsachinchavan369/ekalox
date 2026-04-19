import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "./env";

let browserClient: SupabaseClient | null = null;

/**
 * Browser-safe Supabase client.
 * Reuses a singleton instance to avoid creating multiple clients in the same tab.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    const { url, anonKey } = getSupabaseEnv();
    browserClient = createBrowserClient(url, anonKey);
  }

  return browserClient;
}
