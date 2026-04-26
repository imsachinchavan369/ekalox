import { NextRequest, NextResponse } from "next/server";

import { getAdminVerifiedApiUser } from "@/lib/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

interface AdminModerateProductRouteContext {
  params: Promise<{ productId: string }>;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: NextRequest, { params }: AdminModerateProductRouteContext) {
  const admin = await getAdminVerifiedApiUser();
  if (!admin) {
    return jsonError("Admin access required.", 403);
  }
  const { productId } = await params;
  const supabase = await getSupabaseServerClient();

  const body = (await request.json().catch(() => null)) as { action?: unknown; note?: unknown; targetUserId?: unknown } | null;
  const action = typeof body?.action === "string" ? body.action : "";
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 500) : null;
  const targetUserId = typeof body?.targetUserId === "string" ? body.targetUserId : null;

  const nowIso = new Date().toISOString();
  const moderationFields = {
    admin_note: note,
    moderated_at: nowIso,
    moderated_by: admin.id,
  };
  const updatesByAction: Record<string, Record<string, unknown>> = {
    approve_and_restore: {
      ...moderationFields,
      is_archived: false,
      moderation_status: "clean",
      status: "published",
      visibility: "public",
    },
    flag_product: { ...moderationFields, moderation_status: "flagged", visibility: "private" },
    lift_creator_restriction: {},
    mark_safe: { ...moderationFields, moderation_status: "clean", status: "published", visibility: "public" },
    mark_suspicious: { ...moderationFields, moderation_status: "flagged", visibility: "private" },
    mark_under_review: { ...moderationFields, moderation_status: "under_review", status: "under_review", visibility: "private" },
    mark_verified: { ...moderationFields, verification_status: "verified" },
    reject_verification: { ...moderationFields, verification_status: "verification_rejected" },
    remove_item: { ...moderationFields, is_archived: true, moderation_status: "removed", status: "removed", visibility: "private" },
    remove_verification: { ...moderationFields, verification_status: "unverified" },
    request_creator_clarification: { ...moderationFields, moderation_status: "under_review", status: "under_review", visibility: "private" },
    suspend_creator: {},
    unpublish_item: { ...moderationFields, moderation_status: "removed", status: "removed", visibility: "private" },
  };

  if (!(action in updatesByAction)) {
    return jsonError("Unsupported moderation action.", 400);
  }

  if (action === "suspend_creator" || action === "lift_creator_restriction") {
    if (!targetUserId) {
      return jsonError("Missing creator user.", 400);
    }

    const update = action === "suspend_creator"
      ? {
          account_safety_status: "suspended",
          is_active: false,
          restricted_at: nowIso,
          restricted_by: "admin",
          restricted_reason: "admin_suspension",
          restriction_note: note,
        }
      : {
          account_safety_status: "active",
          is_active: true,
          restricted_at: null,
          restricted_by: null,
          restricted_reason: null,
          restriction_note: note,
        };
    const { error } = await supabase.from("users").update(update).eq("id", targetUserId);
    if (error) {
      return jsonError("Could not update creator account.", 400);
    }
  } else {
    const { error } = await supabase.from("products").update(updatesByAction[action]).eq("id", productId);
    if (error) {
      return jsonError("Could not update product moderation state.", 400);
    }
  }

  await supabase.from("moderation_logs").insert({
    action,
    admin_user_id: admin.id,
    note,
    product_id: productId,
    target_user_id: targetUserId,
  });

  return NextResponse.json({ success: true });
}
