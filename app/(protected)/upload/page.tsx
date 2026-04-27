import { logoutAction } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/guard";
import { UploadProductForm } from "@/components/upload-product-form";

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
    <main className="min-h-screen overflow-x-hidden bg-slate-950 px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-6 text-slate-100 sm:pb-6">
      <section className="mx-auto w-full max-w-md space-y-5 pb-4 sm:pb-0">
        <header className="space-y-2 rounded-[1.75rem] border border-white/10 bg-slate-900/78 p-5 shadow-xl shadow-black/20">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Creator Studio</p>
          <h1 className="text-2xl font-black text-white">Create reel product</h1>
          <p className="text-sm text-slate-400">Signed in as {user.email}</p>
        </header>

        <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/78 p-5 shadow-xl shadow-black/20">
          <UploadProductForm initialSuccess={success} initialError={error} initialProduct={product} />
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 text-sm">
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
