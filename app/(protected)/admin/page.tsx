import { AdminOtpForm } from "@/components/admin/AdminOtpForm";
import { AdminDashboardShell } from "@/components/admin/AdminDashboardShell";
import { EkaloxLogo } from "@/components/common/EkaloxLogo";
import { requireAdminVerified } from "@/lib/permissions";
import { ensureAdminOtpChallenge } from "@/lib/security/admin-otp";

export default async function AdminPage() {
  const access = await requireAdminVerified("/admin");

  if (access.needsOtp) {
    try {
      await ensureAdminOtpChallenge(access.user.id);
    } catch {
      // Keep rendering the OTP screen with a generic prompt; sending can be retried via resend.
    }

    return (
      <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-xl space-y-5">
          <AdminOtpForm />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <header className="rounded-[1.75rem] border border-white/10 bg-slate-900/78 p-5 shadow-xl shadow-black/20">
          <div className="flex items-center gap-3">
            <EkaloxLogo />
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Admin</p>
          </div>
          <h1 className="mt-3 text-2xl font-black text-white">Admin Dashboard</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            This route is protected on the server and only available to logged-in users whose `users.role` is `admin`.
          </p>
        </header>

        <AdminDashboardShell />
      </div>
    </main>
  );
}
