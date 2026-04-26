import { NextResponse } from "next/server";

import { getAdminVerifiedApiUser } from "@/lib/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

interface AdminNotificationRouteContext {
  params: Promise<{ notificationId: string }>;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(_request: Request, { params }: AdminNotificationRouteContext) {
  const admin = await getAdminVerifiedApiUser();
  if (!admin) {
    return jsonError("Admin access required.", 403);
  }
  const { notificationId } = await params;
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("admin_notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) {
    return jsonError("Could not update notification.", 400);
  }

  return NextResponse.json({ success: true });
}
