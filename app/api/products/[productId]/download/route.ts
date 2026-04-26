import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { UPLOAD_STORAGE_BUCKET } from "@/lib/uploads/contracts";

interface DownloadRouteContext {
  params: Promise<{ productId: string }>;
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(_request: Request, { params }: DownloadRouteContext) {
  const { productId } = await params;
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("Please log in to download this product.", 401);
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, cta_type, status, visibility, moderation_status, is_archived")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return jsonError("Product not found.", 404);
  }

  const isFree = product.cta_type === "free";
  const isPubliclyAvailable =
    ["published", "verified"].includes(product.status) &&
    product.visibility === "public" &&
    !product.is_archived &&
    product.moderation_status === "clean";

  if (!isFree) {
    const { data: order } = await supabase
      .from("orders")
      .select("id")
      .eq("product_id", productId)
      .eq("buyer_user_id", user.id)
      .in("status", ["paid", "fulfilled"])
      .maybeSingle();

    if (!order) {
      return jsonError("Purchase required before downloading this product.", 403);
    }

    if (product.moderation_status === "removed" || product.is_archived) {
      return jsonError("This product is no longer available.", 404);
    }
  } else {
    if (!isPubliclyAvailable) {
      return jsonError("This product is not available for download.", 404);
    }

    await supabase
      .from("free_claims")
      .upsert({ user_id: user.id, product_id: productId, claim_source: "product_detail" }, { onConflict: "user_id,product_id" });
  }

  const { data: file, error: fileError } = await supabase
    .from("product_download_files")
    .select("storage_path, original_name")
    .eq("product_id", productId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fileError || !file) {
    return jsonError("No downloadable file is available for this product yet.", 404);
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase
    .storage
    .from(UPLOAD_STORAGE_BUCKET)
    .createSignedUrl(file.storage_path, 60);

  if (signedUrlError || !signedUrlData?.signedUrl) {
    return jsonError("File unavailable. Please try again.", 500);
  }

  return NextResponse.json({
    fileName: file.original_name || "ekalox-download",
    url: signedUrlData.signedUrl,
  });
}
