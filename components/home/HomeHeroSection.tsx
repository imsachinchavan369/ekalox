import Link from "next/link";

import { ProductPrice } from "@/components/common/ProductPrice";
import { VerifiedByEkaloxBadge } from "@/components/common/VerifiedByEkaloxBadge";
import type { ReelProductCard } from "@/lib/uploads/queries";

interface HomeHeroSectionProps {
  product: ReelProductCard | null;
}

export function HomeHeroSection({ product }: HomeHeroSectionProps) {
  if (!product) {
    return (
      <section className="rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.24),transparent_34%),#05050a] p-6">
        <p className="text-sm font-bold text-slate-400">Premium products coming soon</p>
        <h1 className="mt-3 text-4xl font-black text-white">EKALOX</h1>
      </section>
    );
  }

  const badge = product.ctaType === "free" ? "Free" : "Premium";

  return (
    <Link href={`/products/${product.productId}`} className="group relative isolate block overflow-hidden rounded-[1.75rem] border border-white/10 bg-black shadow-2xl shadow-black/30 transition hover:-translate-y-0.5 hover:border-violet-300/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_16%,rgba(168,85,247,0.36),transparent_34%),radial-gradient(circle_at_80%_18%,rgba(59,130,246,0.28),transparent_31%),linear-gradient(90deg,#020204_0%,rgba(2,2,4,0.9)_42%,rgba(2,2,4,0.42)_100%)]" />
      {product.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.thumbnailUrl} alt="" className="absolute inset-y-0 right-0 -z-10 h-full w-full object-cover opacity-55 transition duration-300 group-hover:scale-[1.02] lg:w-[62%]" />
      ) : product.reelUrl ? (
        <video src={product.reelUrl} className="absolute inset-y-0 right-0 -z-10 h-full w-full object-cover opacity-45 lg:w-[62%]" muted playsInline preload="metadata" />
      ) : null}

      <div className="relative flex min-h-[32rem] items-end px-5 py-8 sm:px-8 lg:px-10">
        <div className="max-w-3xl space-y-5">
          <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/14 bg-black/35 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white backdrop-blur">
            <span className="text-violet-300">{badge}</span>
            <VerifiedByEkaloxBadge className="border-0 bg-transparent p-0" />
          </div>
          <div>
            <h1 className="max-w-3xl text-4xl font-black leading-none text-white sm:text-5xl lg:text-6xl">
              <span className="bg-[linear-gradient(135deg,#b827ff,#2f7dff)] bg-clip-text text-transparent">
                {product.title}
              </span>
            </h1>
          </div>
          <ProductPrice amount={product.priceAmount} className="text-3xl font-black text-white" ctaType={product.ctaType} currency={product.priceCurrency} />
        </div>
      </div>
    </Link>
  );
}
