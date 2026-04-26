import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Please log in to complete checkout.", 401);
  }

  try {
    const body = (await request.json()) as { orderId?: unknown; provider?: unknown };
    const orderId = typeof body.orderId === "string" ? body.orderId : "";

    if (!orderId) {
      return jsonError("Payment verification failed. Please try again.", 400);
    }

    const { data: order } = await supabase
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .eq("buyer_user_id", user.id)
      .maybeSingle();

    if (!order) {
      return jsonError("Payment verification failed. Please try again.", 404);
    }

    return NextResponse.json({ paid: false, status: "provider_pending" }, { status: 202 });
  } catch {
    return jsonError("Payment verification failed. Please try again.", 400);
  }
}
