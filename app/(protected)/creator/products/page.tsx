import Link from "next/link";

import { requireUser } from "@/lib/auth/guard";
import { getMyUploads } from "@/lib/uploads/queries";

export default async function CreatorProductsPage() {
  const user = await requireUser("/creator/products");
  const products = await getMyUploads(user.id);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <header className="rounded-[1.75rem] border border-white/10 bg-slate-900/78 p-5 shadow-xl shadow-black/20">
          <Link href="/profile" className="text-sm font-semibold text-cyan-300 transition hover:text-cyan-200">
            Back to profile
          </Link>
          <h1 className="mt-3 text-2xl font-black text-white">Manage my reels/products</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Edit metadata, switch visibility, request file replacement, or archive a listing without changing buyer-facing flows.
          </p>
        </header>

        {products.length === 0 ? (
          <p className="rounded-[1.5rem] border border-white/10 bg-slate-900/72 p-5 text-sm text-slate-400">
            No products yet. Create a reel product first.
          </p>
        ) : (
          <ul className="grid gap-3 xl:grid-cols-2">
            {products.map((product) => (
              <li key={product.productId} className="rounded-[1.5rem] border border-white/10 bg-slate-900/72 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-white">{product.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{product.caption || product.aboutText || "No description yet."}</p>
                  </div>
                  <Link
                    href={`/creator/products/${product.productId}`}
                    className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-xs font-black text-cyan-100 transition hover:border-cyan-300/45 hover:bg-cyan-300/16"
                  >
                    Manage
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
