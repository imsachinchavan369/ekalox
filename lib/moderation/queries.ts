import { getSupabaseServerClient } from "@/lib/supabase/server";
import { generateFileUrl, getR2ObjectKeyFromUrl } from "@/lib/r2";
import { UPLOAD_STORAGE_BUCKET } from "@/lib/uploads/contracts";
import { getCreatorManagedProduct, type ReelProductCard } from "@/lib/uploads/queries";

interface ReplacementRequestRow {
  admin_note: string | null;
  created_at: string;
  id: string;
  note: string | null;
  reason: string;
  status: string;
}

export interface CreatorManagedProduct extends ReelProductCard {
  currentFileName: string | null;
  currentFilePath: string | null;
  currentFileType: string | null;
  reportCount: number;
  replacementRequests: Array<{
    adminNote: string | null;
    createdAt: string;
    id: string;
    note: string | null;
    reason: string;
    status: string;
  }>;
}

export interface AdminDashboardData {
  creators: Array<{ handle: string; id: string; userId: string }>;
  logs: Array<{ action: string; createdAt: string; note: string | null; productId: string | null }>;
  notifications: Array<{ id: string; isRead: boolean; label: string; type: string }>;
  products: Array<{
    adminNote: string | null;
    creatorEmail: string | null;
    creatorName: string;
    creatorUserId: string | null;
    fileName: string | null;
    fileUrl: string | null;
    id: string;
    moderationStatus: string;
    status: string;
    title: string;
    verificationStatus: string;
    visibility: string;
  }>;
  replacementRequests: Array<{
    creatorUserId: string;
    id: string;
    note: string | null;
    productId: string;
    reason: string;
    status: string;
  }>;
  reports: Array<{
    createdAt: string;
    id: string;
    note: string | null;
    productId: string;
    reason: string;
    reporterUserId: string;
    status: string;
  }>;
  stats: {
    creators: number;
    openReports: number;
    pendingReplacements: number;
    products: number;
    unreadNotifications: number;
    users: number;
  };
  users: Array<{ accountSafetyStatus: string | null; displayName: string; email: string; id: string; isActive: boolean | null }>;
}

function normalizeStoragePath(path: string, bucket: string) {
  return path.split("?")[0].replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/(?:public|sign)\//, "").replace(new RegExp(`^${bucket}/`), "").replace(/^\/+/, "");
}

async function getSignedAdminFileUrl(storagePath: string | null) {
  if (!storagePath) {
    return null;
  }

  const trimmed = storagePath.trim();
  const r2Key = getR2ObjectKeyFromUrl(trimmed);
  if (r2Key || (/^https?:\/\//i.test(trimmed) && !trimmed.includes("/storage/v1/object/"))) {
    return trimmed;
  }

  if (trimmed.startsWith("products/") || trimmed.startsWith("reels/")) {
    return generateFileUrl(trimmed);
  }

  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.storage
    .from(UPLOAD_STORAGE_BUCKET)
    .createSignedUrl(normalizeStoragePath(storagePath, UPLOAD_STORAGE_BUCKET), 60 * 30);

  return data?.signedUrl ?? null;
}

export async function getCreatorManagedProductDetail(productId: string, userId: string): Promise<CreatorManagedProduct | null> {
  const supabase = await getSupabaseServerClient();
  const baseProduct = await getCreatorManagedProduct(productId, userId);

  if (!baseProduct) {
    return null;
  }

  const [{ data: fileData }, { count: reportCount }, { data: requestData }] = await Promise.all([
    supabase
      .from("product_download_files")
      .select("storage_path, original_name, mime_type")
      .eq("product_id", productId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("product_id", productId),
    supabase
      .from("file_replacement_requests")
      .select("id, reason, note, status, admin_note, created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false }),
  ]);

  return {
    ...baseProduct,
    currentFileName: fileData?.original_name ?? null,
    currentFilePath: fileData?.storage_path ?? null,
    currentFileType: fileData?.mime_type ?? null,
    reportCount: reportCount ?? 0,
    replacementRequests: ((requestData ?? []) as ReplacementRequestRow[]).map((request) => ({
      adminNote: request.admin_note,
      createdAt: request.created_at,
      id: request.id,
      note: request.note,
      reason: request.reason,
      status: request.status,
    })),
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = await getSupabaseServerClient();
  const [
    { data: productsData, count: productsCount },
    { data: reportsData, count: reportsCount },
    { data: notificationsData, count: notificationsCount },
    { data: requestsData, count: requestsCount },
    { data: usersData, count: usersCount },
    { data: creatorsData, count: creatorsCount },
    { data: logsData },
    { data: filesData },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, title, creator_profile_id, status, visibility, verification_status, moderation_status, admin_note", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("reports")
      .select("id, reporter_user_id, product_id, reason, note, status, created_at", { count: "exact" })
      .in("status", ["open", "under_review"])
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("admin_notifications")
      .select("id, label, notification_type, is_read", { count: "exact" })
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("file_replacement_requests")
      .select("id, product_id, creator_user_id, reason, note, status", { count: "exact" })
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("users")
      .select("id, display_name, email, is_active, account_safety_status", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("creator_profiles")
      .select("id, handle, user_id", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("moderation_logs")
      .select("product_id, action, note, created_at")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("product_download_files")
      .select("product_id, original_name, storage_path")
      .limit(50),
  ]);

  const creators = (creatorsData ?? []) as Array<{ handle: string; id: string; user_id: string }>;
  const creatorById = new Map(creators.map((creator) => [creator.id, creator]));
  const userById = new Map(((usersData ?? []) as Array<{ email: string; id: string }>).map((user) => [user.id, user]));
  const fileByProductId = new Map(((filesData ?? []) as Array<{ original_name: string | null; product_id: string; storage_path: string | null }>).map((file) => [file.product_id, file]));

  const products = await Promise.all(
    ((productsData ?? []) as Array<{
      admin_note: string | null;
      creator_profile_id: string;
      id: string;
      moderation_status: string;
      status: string;
      title: string;
      verification_status: string;
      visibility: string;
    }>).map(async (product) => ({
      adminNote: product.admin_note,
      creatorEmail: userById.get(creatorById.get(product.creator_profile_id)?.user_id || "")?.email ?? null,
      creatorName: creatorById.get(product.creator_profile_id)?.handle || "Creator",
      creatorUserId: creatorById.get(product.creator_profile_id)?.user_id || null,
      fileName: fileByProductId.get(product.id)?.original_name ?? null,
      fileUrl: await getSignedAdminFileUrl(fileByProductId.get(product.id)?.storage_path ?? null),
      id: product.id,
      moderationStatus: product.moderation_status,
      status: product.status,
      title: product.title,
      verificationStatus: product.verification_status,
      visibility: product.visibility,
    })),
  );

  return {
    creators: creators.map((creator) => ({ handle: creator.handle, id: creator.id, userId: creator.user_id })),
    logs: ((logsData ?? []) as Array<{ action: string; created_at: string; note: string | null; product_id: string | null }>).map((log) => ({
      action: log.action,
      createdAt: log.created_at,
      note: log.note,
      productId: log.product_id,
    })),
    notifications: ((notificationsData ?? []) as Array<{ id: string; is_read: boolean; label: string; notification_type: string }>).map((item) => ({
      id: item.id,
      isRead: item.is_read,
      label: item.label,
      type: item.notification_type,
    })),
    products,
    replacementRequests: ((requestsData ?? []) as Array<{ creator_user_id: string; id: string; note: string | null; product_id: string; reason: string; status: string }>).map((request) => ({
      creatorUserId: request.creator_user_id,
      id: request.id,
      note: request.note,
      productId: request.product_id,
      reason: request.reason,
      status: request.status,
    })),
    reports: ((reportsData ?? []) as Array<{ created_at: string; id: string; note: string | null; product_id: string; reason: string; reporter_user_id: string; status: string }>).map((report) => ({
      createdAt: report.created_at,
      id: report.id,
      note: report.note,
      productId: report.product_id,
      reason: report.reason,
      reporterUserId: report.reporter_user_id,
      status: report.status,
    })),
    stats: {
      creators: creatorsCount ?? 0,
      openReports: reportsCount ?? 0,
      pendingReplacements: requestsCount ?? 0,
      products: productsCount ?? 0,
      unreadNotifications: notificationsCount ?? 0,
      users: usersCount ?? 0,
    },
    users: ((usersData ?? []) as Array<{ account_safety_status: string | null; display_name: string; email: string; id: string; is_active: boolean | null }>).map((user) => ({
      accountSafetyStatus: user.account_safety_status,
      displayName: user.display_name,
      email: user.email,
      id: user.id,
      isActive: user.is_active,
    })),
  };
}
