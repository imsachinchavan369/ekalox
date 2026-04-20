import Link from "next/link";

import { logoutAction } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/guard";
import { uploadProductFileAction } from "@/lib/uploads/actions";

interface UploadPageProps {
  searchParams?: Promise<{
    success?: string;
    error?: string;
    file?: string;
  }>;
}

export default async function UploadPage({ searchParams }: UploadPageProps) {
  const user = await requireUser("/upload");
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const success = resolvedSearchParams?.success;
  const error = resolvedSearchParams?.error;
  const fileName = resolvedSearchParams?.file;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <h1 className="text-xl font-semibold">Upload (Protected)</h1>
        <p className="text-sm text-slate-400">Signed in as {user.email}</p>

        {success ? (
          <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            Upload complete{fileName ? `: ${fileName}` : ""}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </p>
        ) : null}

        <form action={uploadProductFileAction} className="space-y-3">
          <label className="block space-y-1 text-sm">
            <span className="text-slate-300">Title (optional)</span>
            <input
              type="text"
              name="title"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
              placeholder="My product file"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-slate-300">File</span>
            <input
              type="file"
              name="file"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-500 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-950 hover:file:bg-cyan-400"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
          >
            Upload file
          </button>
        </form>

        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-sm text-cyan-400 hover:text-cyan-300">
            Go to profile
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
