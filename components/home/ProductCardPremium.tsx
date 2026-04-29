import Link from "next/link";

import { ProductPrice } from "@/components/common/ProductPrice";
import type { ReelProductCard } from "@/lib/uploads/queries";

interface ProductCardPremiumProps {
  product: ReelProductCard;
}

export function ProductCardPremium({ product }: ProductCardPremiumProps) {
  const image = product.landing.heroImageUrl || product.thumbnailUrl;
  const badge = product.landing.badgeText || (product.ctaType === "free" ? "Free" : "Premium");

  return (
    <Link href={`/products/${product.productId}`} className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:border-violet-300/30">
      <div className="relative aspect-[5/4] bg-slate-950">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]" />
        ) : product.reelUrl ? (
          <video src={product.reelUrl} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]" muted playsInline preload="metadata" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs font-black text-slate-600">EKALOX</div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/82 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full border border-white/16 bg-black/52 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-violet-100 backdrop-blur">
          {badge}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 min-h-[2.25rem] text-base font-black leading-tight text-white">{product.landing.heroTitle || product.title}</h3>
        <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-slate-400">
          {product.landing.heroSubtitle || product.caption || product.aboutText || "Premium creator product on EKALOX."}
        </p>
        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <ProductPrice amount={product.priceAmount} className="truncate text-sm font-black text-white" ctaType={product.ctaType} currency={product.priceCurrency} />
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">View</span>
        </div>
      </div>
    </Link>
  );
}
