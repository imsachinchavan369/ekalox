"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { createOrder, reportPaymentFailure, startCheckout, verifyPayment, type CheckoutOrder } from "@/lib/services/checkout";

export function useCheckout(productId: string) {
  const router = useRouter();
  const [checkoutOrder, setCheckoutOrder] = useState<CheckoutOrder | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCheckoutPending, setIsCheckoutPending] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");

  const openCheckout = useCallback(async () => {
    if (isCheckoutPending) {
      return;
    }

    setIsCheckoutPending(true);
    setCheckoutMessage("");

    try {
      const order = await createOrder(productId);
      if (!order.razorpay && order.status !== "paid" && order.status !== "fulfilled") {
        throw new Error("Checkout unavailable. Please try again.");
      }

      setCheckoutOrder(order);
      setIsCheckoutOpen(true);
    } catch (error) {
      setCheckoutMessage(error instanceof Error ? error.message : "Checkout unavailable. Please try again.");
    } finally {
      setIsCheckoutPending(false);
    }
  }, [isCheckoutPending, productId]);

  const proceedToPayment = useCallback(async () => {
    const activeOrder = checkoutOrder;

    if (!activeOrder || isCheckoutPending) {
      return;
    }

    setIsCheckoutPending(true);
    setCheckoutMessage("");

    try {
      const paymentResult = await startCheckout(activeOrder);
      const verification = await verifyPayment(activeOrder.id, paymentResult);

      if (verification.paid) {
        setCheckoutMessage("Payment confirmed. Download unlocked.");
        setIsCheckoutOpen(false);
        router.refresh();
      }
    } catch (error) {
      await reportPaymentFailure(activeOrder.id);
      setCheckoutMessage(error instanceof Error ? error.message : "Checkout unavailable. Please try again.");
    } finally {
      setIsCheckoutPending(false);
    }
  }, [checkoutOrder, isCheckoutPending, router]);

  return {
    checkoutMessage,
    checkoutOrder,
    closeCheckout: () => setIsCheckoutOpen(false),
    isCheckoutOpen,
    isCheckoutPending,
    openCheckout,
    proceedToPayment,
  };
}
