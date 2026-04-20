import Link from "next/link";

import { logoutAction } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/guard";
import { getMyUploads } from "@/lib/uploads/queries";

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  const reels = await getMyUploads(user.id);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <h1 className="text-xl font-semibold">Profile (Protected)</h1>
        <p className="text-sm text-slate-300">User ID: {user.id}</p>
        <p className="text-sm text-slate-400">Email: {user.email}</p>

        <section className="space-y-2 border-t border-slate-800 pt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">My Uploads</h2>

          {reels.length === 0 ? (
            <p className="text-sm text-slate-400">No reels yet. Upload your first reel from the Upload page.</p>
          ) : (
            <ul className="space-y-3">
              {reels.map((reel) => (
                <li key={reel.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-sm font-medium text-slate-100">{reel.title}</p>
                  {reel.caption ? <p className="mt-1 text-xs text-slate-400">{reel.caption}</p> : null}
                  <p className="text-xs text-slate-500">
                    Uploaded: {new Date(reel.createdAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">CTA: {reel.ctaType === "free" ? "Free Download" : "Buy"}</p>

                  {reel.reelUrl ? (
                    <a
                      href={reel.reelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      Watch reel
                    </a>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">Reel link unavailable right now.</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

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
