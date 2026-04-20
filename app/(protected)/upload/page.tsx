import { logoutAction } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/guard";
import { uploadProductFileAction } from "@/lib/uploads/actions";

interface UploadPageProps {
  searchParams?: Promise<{
    success?: string;
    error?: string;
    product?: string;
  }>;
}

export default async function UploadPage({ searchParams }: UploadPageProps) {
  const user = await requireUser("/upload");
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const success = resolvedSearchParams?.success;
  const error = resolvedSearchParams?.error;
  const product = resolvedSearchParams?.product;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <section className="mx-auto w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <h1 className="text-xl font-semibold">Create Reel Product</h1>
        <p className="text-sm text-slate-400">Signed in as {user.email}</p>

        {success ? (
          <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            Product created{product ? `: ${product}` : ""}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </p>
        ) : null}

        <form action={uploadProductFileAction} className="space-y-3">
          <label className="block space-y-1 text-sm">
            <span className="text-slate-300">Product title</span>
            <input
              type="text"
              name="title"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
              placeholder="My digital product"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-slate-300">Short caption / description</span>
            <textarea
              name="caption"
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
              placeholder="What this product is about"
            />
          </label>

          <fieldset className="space-y-2 text-sm">
            <legend className="text-slate-300">Product type</legend>
            <label className="flex items-center gap-2 text-slate-300">
              <input type="radio" name="productType" value="free" defaultChecked className="h-4 w-4" />
              Free
            </label>
            <label className="flex items-center gap-2 text-slate-300">
              <input type="radio" name="productType" value="paid" className="h-4 w-4" />
              Paid
            </label>
          </fieldset>

          <label className="block space-y-1 text-sm">
            <span className="text-slate-300">Price (USD, only for paid)</span>
            <input
              type="number"
              name="price"
              min="0"
              step="0.01"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
              placeholder="9.99"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-slate-300">Reel / demo video</span>
            <input
              type="file"
              name="reelVideo"
              accept="video/*"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-500 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-950 hover:file:bg-cyan-400"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-slate-300">Downloadable product file (optional)</span>
            <input
              type="file"
              name="downloadFile"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-500 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-950 hover:file:bg-cyan-400"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-slate-300">Thumbnail (optional)</span>
            <input
              type="file"
              name="thumbnail"
              accept="image/*"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-500 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-950 hover:file:bg-cyan-400"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
          >
            Create product reel
          </button>
        </form>

        <div className="space-y-2 text-sm">
          <a href="/profile" className="inline-block text-cyan-400 hover:text-cyan-300">
            Back to profile
          </a>

          <form action={logoutAction}>
            <button type="submit" className="text-rose-300 hover:text-rose-200">
              Log out
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
