import Link from "next/link";

import { ProfileUploadCard } from "@/components/profile/ProfileUploadCard";

import type { ProfileProduct } from "./types";

interface MyProductsSectionProps {
  products: ProfileProduct[];
}

export function MyProductsSection({ products }: MyProductsSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Creator</p>
          <h2 className="text-lg font-bold text-white">My Products</h2>
        </div>
        <Link href="/upload" className="rounded-full bg-cyan-300 px-3 py-1.5 text-xs font-black text-slate-950 hover:bg-cyan-200">
          Upload
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-400">
          No products yet. Upload your first reel product to start building your EKALOX storefront.
        </p>
      ) : (
        <ul className="grid gap-3 xl:grid-cols-2">
          {products.map((reel) => (
            <ProfileUploadCard
              key={`${reel.productId}-${reel.createdAt}`}
              category={reel.category}
              caption={reel.caption}
              createdAt={reel.createdAt}
              ctaType={reel.ctaType}
              averageRating={reel.averageRating}
              downloadsCount={reel.downloadsCount}
              priceAmount={reel.priceAmount}
              priceCurrency={reel.priceCurrency}
              productId={reel.productId}
              ratingCount={reel.ratingCount}
              reelUrl={reel.reelUrl}
              verificationStatus={reel.verificationStatus}
              visibility={reel.visibility}
              title={reel.title}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
