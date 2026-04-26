import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { markAllNotificationsRead } from "@/services/notifications";

export async function POST() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const ok = await markAllNotificationsRead(supabase, user.id);

  if (!ok) {
    return NextResponse.json({ error: "Could not update notifications." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
