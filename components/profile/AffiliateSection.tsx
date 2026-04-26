"use client";

import Link from "next/link";
import { useState } from "react";

function AffiliateMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  );
}

export function AffiliateSection() {
  const [message, setMessage] = useState("");

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Growth</p>
        <h2 className="text-lg font-bold text-white">Affiliate</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AffiliateMetric label="Affiliate Status" value="Not configured" />
        <AffiliateMetric label="Referral Code" value="Pending" />
        <AffiliateMetric label="Total Referrals" value="0" />
        <AffiliateMetric label="Affiliate Earnings" value="$0" />
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-slate-400">Referral links will appear here once affiliate settings are enabled.</p>
            <p className="text-xs leading-5 text-slate-500">
              By enabling affiliate, you agree to{" "}
              <Link href="/legal/affiliate-terms" className="font-semibold text-cyan-300 transition hover:text-cyan-200">
                Affiliate Terms
              </Link>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMessage("Referral link not configured yet")}
            className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-white transition hover:bg-white/16"
          >
            Copy Referral Link
          </button>
        </div>
        {message ? <p className="mt-3 text-xs font-semibold text-cyan-200">{message}</p> : null}
      </div>
    </section>
  );
}
