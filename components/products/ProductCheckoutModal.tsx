"use client";

import Link from "next/link";

import type { CheckoutOrder } from "@/lib/services/checkout";
import { ProductPrice } from "@/components/common/ProductPrice";

interface ProductCheckoutModalProps {
  isPending: boolean;
  message: string;
  onClose: () => void;
  onProceed: () => void;
  order: CheckoutOrder;
}

export function ProductCheckoutModal({ isPending, message, onClose, onProceed, order }: ProductCheckoutModalProps) {
  const { product } = order;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/72 px-4 py-5 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <p className="text-sm font-black text-white">Checkout</p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-300 transition hover:border-cyan-300/35 hover:text-white"
            aria-label="Close checkout"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex gap-3">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-900">
              {product.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-black text-slate-600">EKALOX</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="line-clamp-2 text-lg font-black leading-tight text-white">{product.title}</h2>
              <p className="mt-1 truncate text-sm font-semibold text-slate-400">@{product.creatorName}</p>
              <ProductPrice
                amount={product.priceAmount}
                className="mt-3 block text-xl font-black text-white"
                currency={product.currencyCode}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onProceed}
            disabled={isPending}
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#23d3ee,#0b74f1)] px-5 py-2.5 text-sm font-black tracking-wide text-white shadow-[0_8px_22px_rgba(14,116,241,0.24)] transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-95 disabled:cursor-wait disabled:opacity-70"
          >
            {isPending ? "Preparing..." : "Proceed to Payment"}
          </button>

          <p className="text-center text-xs leading-5 text-slate-500">
            No refund after successful download.{" "}
            <Link href="/legal/refund" className="font-semibold text-cyan-300 transition hover:text-cyan-200">
              Read Refund Policy
            </Link>
          </p>

          {message ? <p className="text-xs font-semibold text-cyan-200">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
