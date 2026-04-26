import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

interface ReviewRouteContext {
  params: Promise<{ productId: string }>;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request, { params }: ReviewRouteContext) {
  const { productId } = await params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Please log in to review this product.", 401);
  }

  const body = (await request.json().catch(() => null)) as { rating?: unknown; text?: unknown } | null;
  const rating = Number(body?.rating);
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, 600) : "";

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return jsonError("Choose a rating from 1 to 5.", 400);
  }

  const [{ data: freeClaim }, { data: paidOrder }] = await Promise.all([
    supabase.from("free_claims").select("id").eq("product_id", productId).eq("user_id", user.id).maybeSingle(),
    supabase
      .from("orders")
      .select("id")
      .eq("product_id", productId)
      .eq("buyer_user_id", user.id)
      .in("status", ["paid", "fulfilled"])
      .maybeSingle(),
  ]);

  if (!freeClaim && !paidOrder) {
    return jsonError("Download or purchase this product before reviewing.", 403);
  }

  const { error } = await supabase
    .from("reel_reviews")
    .upsert(
      {
        user_id: user.id,
        reel_id: productId,
        rating,
        text,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,reel_id" },
    );

  if (error) {
    return jsonError(error.message, 400);
  }

  return NextResponse.json({ success: true });
}
