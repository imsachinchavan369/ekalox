import crypto from "crypto";

interface CreateRazorpayOrderInput {
  amountInPaise: number;
  internalOrderId: string;
}

export interface RazorpayOrder {
  amount: number;
  currency: "INR";
  id: string;
}

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId) {
    throw new Error("Missing env var: RAZORPAY_KEY_ID");
  }

  if (!keySecret) {
    throw new Error("Missing env var: RAZORPAY_KEY_SECRET");
  }

  return { keyId, keySecret };
}

export function getPublicRazorpayKeyId() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;

  if (!keyId) {
    throw new Error("Missing env var: NEXT_PUBLIC_RAZORPAY_KEY_ID");
  }

  return keyId;
}

export async function createRazorpayOrder({
  amountInPaise,
  internalOrderId,
}: CreateRazorpayOrderInput): Promise<RazorpayOrder> {
  const { keyId, keySecret } = getRazorpayCredentials();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    body: JSON.stringify({
      amount: amountInPaise,
      currency: "INR",
      notes: {
        ekalox_order_id: internalOrderId,
        mode: "test",
      },
      receipt: internalOrderId,
    }),
    headers: {
      authorization: `Basic ${auth}`,
      "content-type": "application/json",
    },
    method: "POST",
  });

  const payload = (await response.json().catch(() => null)) as Partial<RazorpayOrder> & {
    error?: { description?: string };
  } | null;

  if (!response.ok || !payload?.id || payload.currency !== "INR" || typeof payload.amount !== "number") {
    throw new Error(payload?.error?.description || "Could not create Razorpay order.");
  }

  return {
    amount: payload.amount,
    currency: "INR",
    id: payload.id,
  };
}

export function verifyRazorpaySignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const { keySecret } = getRazorpayCredentials();
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(razorpaySignature);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
