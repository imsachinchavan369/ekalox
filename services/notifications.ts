import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationType =
  | "payment_success"
  | "payment_failed"
  | "new_sale"
  | "download_ready"
  | "system_alert";

export interface UserNotification {
  createdAt: string;
  id: string;
  isRead: boolean;
  message: string;
  relatedOrderId: string | null;
  relatedProductId: string | null;
  title: string;
  type: NotificationType;
  userId: string;
}

interface NotificationRow {
  created_at: string;
  id: string;
  is_read: boolean;
  message: string;
  related_order_id: string | null;
  related_product_id: string | null;
  title: string;
  type: NotificationType;
  user_id: string;
}

function mapNotification(row: NotificationRow): UserNotification {
  return {
    createdAt: row.created_at,
    id: row.id,
    isRead: row.is_read,
    message: row.message,
    relatedOrderId: row.related_order_id,
    relatedProductId: row.related_product_id,
    title: row.title,
    type: row.type,
    userId: row.user_id,
  };
}

export async function getUserNotifications(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, user_id, type, title, message, is_read, related_product_id, related_order_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return [];
  }

  return ((data ?? []) as NotificationRow[]).map(mapNotification);
}

export async function markAllNotificationsRead(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  return !error;
}

export async function recordPaymentFailedNotification(supabase: SupabaseClient, orderId: string) {
  const { error } = await supabase.rpc("record_failed_payment_notification", {
    p_order_id: orderId,
  });

  return !error;
}
