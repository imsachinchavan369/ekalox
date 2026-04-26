export interface CheckoutProductSummary {
  creatorName: string;
  currencyCode: string;
  priceAmount: number;
  priceCents: number;
  productId: string;
  thumbnailUrl: string | null;
  title: string;
}

export interface RazorpayCheckoutSummary {
  amount: number;
  currency: "INR";
  keyId: string;
  orderId: string;
}

export interface CheckoutOrder {
  id: string;
  product: CheckoutProductSummary;
  razorpay?: RazorpayCheckoutSummary;
  status: "pending" | "paid" | "fulfilled";
}

interface CheckoutPayload {
  error?: string;
  order?: CheckoutOrder;
  purchased?: boolean;
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayFailedResponse {
  error?: {
    description?: string;
  };
}

interface RazorpayOptions {
  amount: number;
  currency: string;
  handler: (response: RazorpaySuccessResponse) => void;
  key: string;
  modal?: {
    ondismiss?: () => void;
  };
  name: string;
  order_id: string;
  prefill?: Record<string, string>;
  theme?: {
    color?: string;
  };
}

interface RazorpayInstance {
  on: (event: "payment.failed", handler: (response: RazorpayFailedResponse) => void) => void;
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

async function readCheckoutPayload(response: Response): Promise<CheckoutPayload> {
  try {
    return (await response.json()) as CheckoutPayload;
  } catch {
    return {};
  }
}

export async function createOrder(productId: string): Promise<CheckoutOrder> {
  const response = await fetch("/api/payments/razorpay/create-order", {
    body: JSON.stringify({ productId }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  const payload = await readCheckoutPayload(response);

  if (!response.ok || !payload.order) {
    throw new Error(payload.error || "Checkout unavailable. Please try again.");
  }

  return payload.order;
}

export async function startCheckout(order: CheckoutOrder) {
  if (!order.razorpay) {
    throw new Error("Checkout unavailable. Please try again.");
  }

  const razorpay = order.razorpay;

  await loadRazorpayScript();

  return new Promise<RazorpaySuccessResponse>((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error("Razorpay checkout failed to load."));
      return;
    }

    const checkout = new window.Razorpay({
      amount: razorpay.amount,
      currency: razorpay.currency,
      handler: resolve,
      key: razorpay.keyId,
      modal: {
        ondismiss: () => reject(new Error("Payment was cancelled.")),
      },
      name: "EKALOX",
      order_id: razorpay.orderId,
      theme: {
        color: "#0b74f1",
      },
    });

    checkout.on("payment.failed", (response) => {
      reject(new Error(response.error?.description || "Payment failed. Please try again."));
    });

    checkout.open();
  });
}

export async function verifyPayment(orderId: string, paymentResult: RazorpaySuccessResponse) {
  const response = await fetch("/api/payments/razorpay/verify", {
    body: JSON.stringify({
      orderId,
      razorpay_order_id: paymentResult.razorpay_order_id,
      razorpay_payment_id: paymentResult.razorpay_payment_id,
      razorpay_signature: paymentResult.razorpay_signature,
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  const payload = (await readCheckoutPayload(response)) as CheckoutPayload & {
    paid?: boolean;
    status?: string;
  };

  if (!response.ok || !payload.paid) {
    throw new Error(payload.error || "Payment verification failed. Please try again.");
  }

  return {
    paid: true,
  };
}

export async function reportPaymentFailure(orderId: string) {
  await fetch("/api/payments/razorpay/failure", {
    body: JSON.stringify({ orderId }),
    headers: { "content-type": "application/json" },
    method: "POST",
  }).catch(() => null);
}

export async function unlockPurchase(_orderId: string) {
  return {
    unlocked: false,
  };
}

export async function downloadPurchasedProduct(productId: string) {
  const { downloadProductFile } = await import("@/lib/services/download");
  await downloadProductFile(productId);
}

function loadRazorpayScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>("script[data-ekalox-razorpay]");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Razorpay checkout failed to load.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.dataset.ekaloxRazorpay = "true";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay checkout failed to load."));
    document.body.appendChild(script);
  });
}
