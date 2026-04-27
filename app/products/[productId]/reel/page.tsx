import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCTAButton } from "@/components/common/ProductCTAButton";
import { getPublicReelProductDetail } from "@/lib/uploads/queries";

interface ProductReelPreviewPageProps {
  params: Promise<{ productId: string }>;
}

export default async function ProductReelPreviewPage({ params }: ProductReelPreviewPageProps) {
  const { productId } = await params;
  const product = await getPublicReelProductDetail(productId);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-black px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-5 text-white sm:pb-5">
      <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-5xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-center">
        <div className="mx-auto w-full max-w-[26rem] overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950 shadow-2xl shadow-black/50">
          <div className="aspect-[9/16] bg-black">
            {product.reelUrl ? (
              <video src={product.reelUrl} className="h-full w-full object-contain" controls autoPlay playsInline />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-slate-500">
                Reel unavailable right now.
              </div>
            )}
          </div>
        </div>

        <div className="mx-auto w-full max-w-md space-y-4 lg:mx-0">
          <Link href="/products" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">
            Back to products
          </Link>
          <div>
            <p className="truncate text-sm font-semibold text-slate-400">@{product.creatorName}</p>
            <h1 className="mt-2 text-3xl font-black leading-tight text-white">{product.title}</h1>
            {product.caption ? <p className="mt-3 text-sm leading-6 text-slate-300">{product.caption}</p> : null}
          </div>
          <ProductCTAButton ctaType={product.ctaType} href={`/products/${product.productId}`} />
        </div>
      </section>
    </main>
  );
}
