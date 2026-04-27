"use client";

import { useState } from "react";

import { AffiliateSection } from "@/components/profile/AffiliateSection";
import { EarningsWalletSection } from "@/components/profile/EarningsWalletSection";
import { MyOrdersSection } from "@/components/profile/MyOrdersSection";
import { MyProductsSection } from "@/components/profile/MyProductsSection";
import { ProfileHeaderCard } from "@/components/profile/ProfileHeaderCard";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { ProfileStats } from "@/components/profile/ProfileStats";
import type { EarningsWalletSummary, SellerEarningRecord } from "@/lib/earnings/types";
import type { UserNotification } from "@/services/notifications";

import type { ProfileDashboardStats, ProfileIdentity, ProfileOrderItem, ProfileProduct } from "./types";

type ProfileTab = "products" | "orders" | "wallet" | "affiliate";

interface ProfileDashboardProps {
  earnings: SellerEarningRecord[];
  identity: ProfileIdentity;
  logoutAction: () => void;
  notifications: UserNotification[];
  orders: ProfileOrderItem[];
  products: ProfileProduct[];
  stats: ProfileDashboardStats;
  walletSummary: EarningsWalletSummary;
}

const tabs: Array<{ id: ProfileTab; label: string }> = [
  { id: "products", label: "My Products" },
  { id: "orders", label: "My Orders" },
  { id: "wallet", label: "Earnings / Wallet" },
  { id: "affiliate", label: "Affiliate" },
];

export function ProfileDashboard({
  earnings,
  identity,
  logoutAction,
  notifications,
  orders,
  products,
  stats,
  walletSummary,
}: ProfileDashboardProps) {
  const [currentIdentity, setCurrentIdentity] = useState(identity);
  const [activeTab, setActiveTab] = useState<ProfileTab>("products");
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <section className="mx-auto w-full max-w-6xl space-y-5 pb-4 sm:pb-0">
        <ProfileHeaderCard
          identity={currentIdentity}
          notifications={notifications}
          onSettingsOpen={() => setSettingsOpen(true)}
        />
        <ProfileStats {...stats} />

        <section className="rounded-[1.75rem] border border-white/10 bg-slate-900/70 p-3 shadow-xl shadow-black/18 sm:p-4">
          <div className="-mx-1 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-0 gap-2 rounded-2xl bg-black/18 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-10 shrink-0 whitespace-nowrap rounded-full px-4 text-xs font-black transition sm:text-sm ${
                  activeTab === tab.id
                    ? "bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/20"
                    : "text-slate-300 hover:bg-white/8 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
            </div>
          </div>

          <div className="mt-4">
            {activeTab === "products" ? <MyProductsSection products={products} /> : null}
            {activeTab === "orders" ? <MyOrdersSection orders={orders} /> : null}
            {activeTab === "wallet" ? <EarningsWalletSection earnings={earnings} summary={walletSummary} /> : null}
            {activeTab === "affiliate" ? <AffiliateSection /> : null}
          </div>
        </section>
      </section>

      <ProfileSettings
        identity={currentIdentity}
        isOpen={settingsOpen}
        logoutAction={logoutAction}
        onClose={() => setSettingsOpen(false)}
        onIdentityChange={setCurrentIdentity}
      />
    </>
  );
}
