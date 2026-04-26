import { logoutAction } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/guard";
import { getMyUploads, getUserProfileOrders } from "@/lib/uploads/queries";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileDashboard } from "@/components/profile/ProfileDashboard";
import { getSellerEarningsWallet } from "@/services/earnings";
import { getUserNotifications } from "@/services/notifications";

function getStringMetadata(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getIdentity(user: Awaited<ReturnType<typeof requireUser>>) {
  const emailName = user.email?.split("@")[0] || "creator";
  const displayName =
    getStringMetadata(user.user_metadata?.display_name) ||
    getStringMetadata(user.user_metadata?.full_name) ||
    emailName;
  const username =
    getStringMetadata(user.user_metadata?.username) ||
    getStringMetadata(user.user_metadata?.handle) ||
    emailName.toLowerCase().replace(/[^a-z0-9_]/g, "");
  const bio =
    getStringMetadata(user.user_metadata?.bio).slice(0, 160) ||
    "Reel-first digital products, demos, and downloads built for EKALOX buyers.";

  return {
    avatarUrl: getStringMetadata(user.user_metadata?.avatar_url) || null,
    bio,
    displayName,
    email: user.email ?? null,
    username,
  };
}

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  const supabase = await getSupabaseServerClient();
  const [reels, orders, wallet, notifications] = await Promise.all([
    getMyUploads(user.id),
    getUserProfileOrders(user.id),
    getSellerEarningsWallet(supabase, user.id),
    getUserNotifications(supabase, user.id),
  ]);
  const creatorProfileId = reels[0]?.creatorProfileId;
  const totalDownloads = reels.reduce((sum, reel) => sum + reel.downloadsCount, 0);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <ProfileDashboard
        earnings={wallet.earnings}
        identity={getIdentity(user)}
        logoutAction={logoutAction}
        notifications={notifications}
        orders={orders}
        products={reels}
        stats={{
          creatorProfileId,
          productCount: reels.length,
          totalDownloads,
        }}
        walletSummary={wallet.summary}
      />
    </main>
  );
}
