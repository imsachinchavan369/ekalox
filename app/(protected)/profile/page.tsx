import Link from "next/link";

import { logoutAction } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/guard";

export default async function ProfilePage() {
  const user = await requireUser("/profile");

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <h1 className="text-xl font-semibold">Profile (Protected)</h1>
        <p className="text-sm text-slate-300">User ID: {user.id}</p>
        <p className="text-sm text-slate-400">Email: {user.email}</p>

        <div className="flex items-center gap-3">
          <Link href="/upload" className="text-sm text-cyan-400 hover:text-cyan-300">
            Go to upload
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-rose-300 hover:text-rose-200">
              Log out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
