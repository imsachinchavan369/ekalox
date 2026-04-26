import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getAdminDashboardData } from "@/lib/moderation/queries";

export async function AdminDashboardShell() {
  const data = await getAdminDashboardData();

  return <AdminDashboard data={data} />;
}
