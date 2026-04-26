import { NextRequest, NextResponse } from "next/server";

import { getAdminVerifiedApiUser } from "@/lib/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

interface AdminReplacementRouteContext {
  params: Promise<{ requestId: string }>;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: NextRequest, { params }: AdminReplacementRouteContext) {
  const admin = await getAdminVerifiedApiUser();
  if (!admin) {
    return jsonError("Admin access required.", 403);
  }
  const { requestId } = await params;
  const supabase = await getSupabaseServerClient();
  const body = (await request.json().catch(() => null)) as { action?: unknown; adminNote?: unknown } | null;
  const action = body?.action === "approve" ? "approved" : body?.action === "reject" ? "rejected" : "";
  const adminNote = typeof body?.adminNote === "string" ? body.adminNote.trim().slice(0, 500) : null;

  if (!action) {
    return jsonError("Unsupported replacement action.", 400);
  }

  const { data: requestRow, error: requestError } = await supabase
    .from("file_replacement_requests")
    .update({ admin_note: adminNote, status: action })
    .eq("id", requestId)
    .select("product_id")
    .single();

  if (requestError || !requestRow) {
    return jsonError("Could not update replacement request.", 400);
  }

  if (action === "approved") {
    await supabase
      .from("products")
      .update({
        admin_note: adminNote,
        moderated_at: new Date().toISOString(),
        moderated_by: admin.id,
        moderation_status: "under_review",
        status: "under_review",
        visibility: "private",
      })
      .eq("id", requestRow.product_id);
  }

  await supabase.from("moderation_logs").insert({
    action: `replacement_request_${action}`,
    admin_user_id: admin.id,
    note: adminNote,
    product_id: requestRow.product_id,
  });

  return NextResponse.json({ success: true });
}
