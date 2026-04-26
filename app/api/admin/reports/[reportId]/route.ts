import { NextRequest, NextResponse } from "next/server";

import { getAdminVerifiedApiUser } from "@/lib/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

interface AdminReportRouteContext {
  params: Promise<{ reportId: string }>;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: NextRequest, { params }: AdminReportRouteContext) {
  const admin = await getAdminVerifiedApiUser();
  if (!admin) {
    return jsonError("Admin access required.", 403);
  }
  const { reportId } = await params;
  const supabase = await getSupabaseServerClient();
  const body = (await request.json().catch(() => null)) as { note?: unknown; status?: unknown } | null;
  const status =
    body?.status === "under_review" || body?.status === "resolved" || body?.status === "rejected"
      ? body.status
      : "";
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 500) : null;

  if (!status) {
    return jsonError("Unsupported report action.", 400);
  }

  const { data: reportRow, error } = await supabase
    .from("reports")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", reportId)
    .select("product_id")
    .single();

  if (error || !reportRow) {
    return jsonError("Could not update report.", 400);
  }

  await supabase.from("moderation_logs").insert({
    action: `report_${status}`,
    admin_user_id: admin.id,
    note,
    product_id: reportRow.product_id,
  });

  return NextResponse.json({ success: true });
}
