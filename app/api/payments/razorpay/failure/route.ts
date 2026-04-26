import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { recordPaymentFailedNotification } from "@/services/notifications";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Please log in.", 401);
  }

  const body = (await request.json().catch(() => null)) as { orderId?: unknown } | null;
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";

  if (!orderId) {
    return jsonError("Missing order.", 400);
  }

  const ok = await recordPaymentFailedNotification(supabase, orderId);

  if (!ok) {
    return jsonError("Could not record payment status.", 500);
  }

  return NextResponse.json({ success: true });
}
