import type { ProductPreviewGalleryItem } from "@/lib/uploads/contracts";
import type { ReelProductCard } from "@/lib/uploads/queries";

import { ProductDescriptionText } from "./ProductDescriptionText";

interface ProductPreviewGalleryProps {
  items: ProductPreviewGalleryItem[];
  product: ReelProductCard;
}

export function ProductPreviewGallery({ items, product }: ProductPreviewGalleryProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-black text-white">Preview Gallery</h2>
        <p className="mt-1 text-sm text-slate-400">Explore what the seller has prepared.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item, index) => (
          <article key={`${item.title}-${index}`} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] shadow-xl shadow-black/20">
            <div className="relative aspect-[5/3] bg-slate-950">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : product.reelUrl ? (
                <video src={product.reelUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs font-black text-slate-600">EKALOX</div>
              )}
              <span className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-black/62 text-sm font-black text-white">
                {item.displayOrder || index + 1}
              </span>
            </div>
            <div className="space-y-1 p-4">
              <h3 className="text-sm font-black text-white">{item.title}</h3>
              {item.description ? <ProductDescriptionText className="leading-6" text={item.description} /> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
