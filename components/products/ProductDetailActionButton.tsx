"use client";

import Link from "next/link";

import { ProductCheckoutModal } from "@/components/products/ProductCheckoutModal";
import { useCheckout } from "@/hooks/useCheckout";
import { useProductDownload } from "@/hooks/useProductDownload";

interface ProductDetailActionButtonProps {
  creatorName: string;
  currencyCode: string;
  hasPurchased: boolean;
  isFree: boolean;
  priceAmount: number;
  priceCents: number;
  productId: string;
  thumbnailUrl: string | null;
  title: string;
}

const buttonClass =
  "inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#23d3ee,#0b74f1)] px-5 py-2.5 text-sm font-black tracking-wide text-white shadow-[0_8px_22px_rgba(14,116,241,0.24)] transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-95 disabled:cursor-wait disabled:opacity-70";

export function ProductDetailActionButton({
  creatorName,
  currencyCode,
  hasPurchased,
  isFree,
  priceAmount,
  priceCents,
  productId,
  thumbnailUrl,
  title,
}: ProductDetailActionButtonProps) {
  const { isDownloading, message: downloadMessage, startDownload } = useProductDownload(productId);
  const {
    checkoutMessage,
    checkoutOrder,
    closeCheckout,
    isCheckoutOpen,
    isCheckoutPending,
    openCheckout,
    proceedToPayment,
  } = useCheckout(productId);
  const canDownload = isFree || hasPurchased;
  const isPending = canDownload ? isDownloading : isCheckoutPending;
  const status = downloadMessage || checkoutMessage;
  const modalOrder =
    checkoutOrder ||
    ({
      id: "pending",
      product: { creatorName, currencyCode, priceAmount, priceCents, productId, thumbnailUrl, title },
      status: "pending",
    } as const);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isPending}
        onClick={canDownload ? startDownload : openCheckout}
        className={buttonClass}
      >
        {isDownloading ? "Downloading..." : isFree ? "Download Free" : canDownload ? "Download Now" : "Buy Now"}
      </button>
      <div className="text-center text-xs leading-5 text-slate-500">
        <p>No refund after download</p>
        <Link href="/legal/refund" className="font-semibold text-cyan-300 transition hover:text-cyan-200">
          Read Refund Policy
        </Link>
      </div>
      {status ? <p className="text-xs font-semibold text-cyan-200">{status}</p> : null}
      {isCheckoutOpen ? (
        <ProductCheckoutModal
          isPending={isCheckoutPending}
          message={checkoutMessage}
          onClose={closeCheckout}
          onProceed={proceedToPayment}
          order={modalOrder}
        />
      ) : null}
    </div>
  );
}
