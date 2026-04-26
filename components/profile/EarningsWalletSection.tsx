import type { EarningsWalletSummary, SellerEarningRecord } from "@/lib/earnings/types";
import { formatCurrencyAmount, normalizeCurrency } from "@/lib/utils/currency";

interface EarningsWalletSectionProps {
  earnings: SellerEarningRecord[];
  summary: EarningsWalletSummary;
}

function WalletMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatAmount(amount: number, currency: string) {
  return formatCurrencyAmount(amount, normalizeCurrency(currency));
}

export function EarningsWalletSection({ earnings, summary }: EarningsWalletSectionProps) {
  const walletCurrency = earnings[0]?.currency || "INR";

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Creator</p>
        <h2 className="text-lg font-bold text-white">Earnings / Wallet</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <WalletMetric label="Total Earnings" value={formatAmount(summary.totalEarnings, walletCurrency)} />
        <WalletMetric label="Available Balance" value={formatAmount(summary.availableBalance, walletCurrency)} />
        <WalletMetric label="Pending Balance" value={formatAmount(summary.pendingBalance, walletCurrency)} />
        <WalletMetric label="Total Sales" value={String(summary.totalSales)} />
      </div>

      {earnings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/12 bg-slate-900/72 p-5 text-sm text-slate-400">
          No earnings yet. Successful paid sales will appear here.
        </div>
      ) : (
        <div className="space-y-3">
          {earnings.map((earning) => (
            <article key={earning.id} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-black text-white">{earning.productTitle}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Buyer payment: {earning.paymentStatus}
                  </p>
                </div>
                <p className="text-xs font-semibold text-slate-500">{formatDate(earning.createdAt)}</p>
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">Final price</p>
                  <p className="font-bold text-white">{formatAmount(earning.finalPrice, earning.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Platform fee</p>
                  <p className="font-bold text-white">{formatAmount(earning.platformFee, earning.currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Seller earning</p>
                  <p className="font-black text-cyan-100">{formatAmount(earning.sellerEarning, earning.currency)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
