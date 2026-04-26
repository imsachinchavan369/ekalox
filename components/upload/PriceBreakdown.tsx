"use client";

import { calculateEarnings } from "@/lib/earnings/calculateEarnings";
import { formatCurrencyAmount, normalizeCurrency } from "@/lib/utils/currency";

interface PriceBreakdownProps {
  currency: string;
  isPaid: boolean;
  price: string;
}

function BreakdownRow({ label, value, isStrong = false }: { isStrong?: boolean; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-400">{label}</span>
      <span className={isStrong ? "font-black text-cyan-100" : "font-bold text-white"}>{value}</span>
    </div>
  );
}

export function PriceBreakdown({ currency, isPaid, price }: PriceBreakdownProps) {
  const normalizedCurrency = normalizeCurrency(currency);
  const parsedPrice = Number(price || "0");
  const breakdown = calculateEarnings(isPaid ? parsedPrice : 0);
  const format = (amount: number) => formatCurrencyAmount(amount, normalizedCurrency);

  if (!isPaid) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-xs shadow-lg shadow-black/10 sm:text-sm">
      <div className="space-y-2">
        <BreakdownRow label="Final price" value={format(breakdown.finalPrice)} />
        <BreakdownRow label="Base price" value={format(breakdown.basePrice)} />
        <BreakdownRow label="GST (18%)" value={format(breakdown.gstAmount)} />
        <BreakdownRow label="Platform fee (20% of base)" value={format(breakdown.platformFee)} />
        <div className="border-t border-white/10 pt-2">
          <BreakdownRow label="You will receive" value={format(breakdown.sellerEarning)} isStrong />
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-5 text-slate-500">
        Platform fee is calculated on base price excluding GST.
      </p>
    </section>
  );
}
