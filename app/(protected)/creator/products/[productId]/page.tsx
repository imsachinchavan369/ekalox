import Link from "next/link";
import { notFound } from "next/navigation";

import { FileReplacementRequestForm } from "@/components/creator/FileReplacementRequestForm";
import { ManageProductForm } from "@/components/creator/ManageProductForm";
import { ModerationStatusBadge } from "@/components/common/ModerationStatusBadge";
import { VerifiedByEkaloxBadge } from "@/components/common/VerifiedByEkaloxBadge";
import { requireUser } from "@/lib/auth/guard";
import { getCreatorManagedProductDetail } from "@/lib/moderation/queries";

interface CreatorManageProductPageProps {
  params: Promise<{ productId: string }>;
}

export default async function CreatorManageProductPage({ params }: CreatorManageProductPageProps) {
  const user = await requireUser("/creator/products");
  const { productId } = await params;
  const product = await getCreatorManagedProductDetail(productId, user.id);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/78 p-5 shadow-xl shadow-black/20">
          <Link href="/profile" className="text-sm font-semibold text-cyan-300 transition hover:text-cyan-200">
            Back to profile
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black text-white">{product.title}</h1>
            {product.verificationStatus === "verified" ? <VerifiedByEkaloxBadge /> : null}
            <ModerationStatusBadge status={product.moderationStatus} />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Reports: {product.reportCount} · Current file: {product.currentFileName || "No download file"} · Visibility: {product.visibility || "public"}
          </p>
        </div>

        <ManageProductForm
          initialProduct={product}
          userId={user.id}
        />

        <FileReplacementRequestForm productId={product.productId} />

        <section className="rounded-[1.5rem] border border-white/10 bg-slate-900/72 p-5">
          <h2 className="text-lg font-black text-white">Replacement request history</h2>
          {product.replacementRequests.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">No replacement requests yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {product.replacementRequests.map((request) => (
                <li key={request.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <ModerationStatusBadge status={request.status} />
                    <p className="text-xs text-slate-500">{new Date(request.createdAt).toLocaleDateString()}</p>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">{request.reason}</p>
                  {request.note ? <p className="mt-2 text-sm leading-6 text-slate-400">{request.note}</p> : null}
                  {request.adminNote ? <p className="mt-2 text-xs font-semibold text-cyan-200">Admin note: {request.adminNote}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
