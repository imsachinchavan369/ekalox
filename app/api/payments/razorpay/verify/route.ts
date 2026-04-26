import { NextRequest, NextResponse } from "next/server";

import { verifyRazorpaySignature } from "@/lib/payments/razorpay";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { recordSellerEarningForPaidOrder } from "@/services/earnings";
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
    return jsonError("Please log in to complete checkout.", 401);
  }

  try {
    const body = (await request.json()) as {
      orderId?: unknown;
      razorpay_order_id?: unknown;
      razorpay_payment_id?: unknown;
      razorpay_signature?: unknown;
    };
    const orderId = typeof body.orderId === "string" ? body.orderId : "";
    const razorpayOrderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
    const razorpayPaymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
    const razorpaySignature = typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return jsonError("Payment verification failed. Please try again.", 400);
    }

    const { data: order } = await supabase
      .from("orders")
      .select("id, provider_order_id, status")
      .eq("id", orderId)
      .eq("buyer_user_id", user.id)
      .maybeSingle();

    if (!order || order.status !== "pending" || order.provider_order_id !== razorpayOrderId) {
      return jsonError("Payment verification failed. Please try again.", 404);
    }

    const isValidSignature = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValidSignature) {
      await recordPaymentFailedNotification(supabase, orderId);
      return jsonError("Payment verification failed. Please try again.", 400);
    }

    const { data: paidOrder, error: paidError } = await supabase
      .rpc("mark_order_razorpay_paid", {
        p_order_id: orderId,
        p_provider_order_id: razorpayOrderId,
        p_provider_payment_id: razorpayPaymentId,
      })
      .maybeSingle();

    const verifiedOrder = paidOrder as {
      order_id: string;
      product_id: string;
      status: string;
    } | null;

    if (paidError || !verifiedOrder) {
      return jsonError("Payment verification failed. Please try again.", 500);
    }

    const recorded = await recordSellerEarningForPaidOrder(supabase, verifiedOrder.order_id);

    if (!recorded) {
      return jsonError("Payment verified, but earnings could not be recorded. Please contact support.", 500);
    }

    return NextResponse.json({
      paid: true,
      orderId: verifiedOrder.order_id,
      productId: verifiedOrder.product_id,
      status: verifiedOrder.status,
    });
  } catch {
    return jsonError("Payment verification failed. Please try again.", 400);
  }
}
