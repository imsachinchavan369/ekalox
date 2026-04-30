import Link from "next/link";

import { ProductPrice } from "@/components/common/ProductPrice";
import { VerifiedByEkaloxBadge } from "@/components/common/VerifiedByEkaloxBadge";
import { ProductMediaPreview } from "@/components/products/ProductMediaPreview";
import type { ReelProductCard } from "@/lib/uploads/queries";

interface ProductCardPremiumProps {
  product: ReelProductCard;
}

export function ProductCardPremium({ product }: ProductCardPremiumProps) {
  const badge = product.ctaType === "free" ? "Free" : "Premium";

  return (
    <Link href={`/products/${product.productId}`} className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:border-violet-300/30">
      <div className="relative bg-slate-950">
        <ProductMediaPreview media={{ reelUrl: product.reelUrl, thumbnailUrl: product.thumbnailUrl }} mediaClassName="transition duration-300 group-hover:scale-[1.025]" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/82 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full border border-white/16 bg-black/52 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-violet-100 backdrop-blur">
          {badge}
        </span>
      </div>
      <div className="space-y-3 p-4">
        <VerifiedByEkaloxBadge />
        <h3 className="line-clamp-2 min-h-[2.25rem] text-base font-black leading-tight text-white">{product.title}</h3>
        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <ProductPrice amount={product.priceAmount} className="truncate text-sm font-black text-white" ctaType={product.ctaType} currency={product.priceCurrency} />
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">View</span>
        </div>
      </div>
    </Link>
  );
}
