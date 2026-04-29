import Link from "next/link";

import { ProductDetailActionButton } from "@/components/products/ProductDetailActionButton";
import { ProductDetailPrice } from "@/components/products/ProductDetailPrice";
import type { ReelProductCard } from "@/lib/uploads/queries";

interface ProductLandingHeroProps {
  hasPurchased: boolean;
  isFree: boolean;
  product: ReelProductCard;
}

export function ProductLandingHero({ hasPurchased, isFree, product }: ProductLandingHeroProps) {
  const heroImage = product.landing.heroImageUrl || product.thumbnailUrl;
  const badge = product.landing.badgeText || (isFree ? "Free" : "Premium");

  return (
    <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-white/10 bg-black shadow-2xl shadow-black/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(168,85,247,0.32),transparent_32%),radial-gradient(circle_at_72%_18%,rgba(59,130,246,0.28),transparent_30%),linear-gradient(90deg,#020204_0%,rgba(2,2,4,0.86)_40%,rgba(2,2,4,0.36)_100%)]" />
      {heroImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={heroImage} alt="" className="absolute inset-y-0 right-0 -z-10 h-full w-full object-cover opacity-55 lg:w-[62%]" />
      ) : product.reelUrl ? (
        <video src={product.reelUrl} className="absolute inset-y-0 right-0 -z-10 h-full w-full object-cover opacity-42 lg:w-[62%]" muted playsInline preload="metadata" />
      ) : null}

      <div className="relative grid min-h-[34rem] items-end gap-8 px-5 py-7 sm:px-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(18rem,0.55fr)] lg:items-center lg:px-10">
        <div className="max-w-3xl space-y-5">
          <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/14 bg-black/35 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white backdrop-blur">
            <span className="text-violet-300">{badge}</span>
            {product.verificationStatus === "verified" || product.landing.isVerifiedByEkalox ? (
              <span className="text-slate-300">Verified by EKALOX</span>
            ) : null}
          </div>

          <div>
            <h1 className="text-4xl font-black leading-none text-white sm:text-5xl lg:text-6xl">
              <span className="bg-[linear-gradient(135deg,#b827ff,#2f7dff)] bg-clip-text text-transparent">
                {product.landing.heroTitle || product.title}
              </span>
            </h1>
            {product.landing.heroSubtitle ? (
              <p className="mt-4 max-w-2xl whitespace-pre-wrap break-words text-base font-medium leading-7 text-slate-200 sm:text-lg">
                {product.landing.heroSubtitle}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
            <span>Instant Download</span>
            <span>Secure Payment</span>
            <span>Creator Product</span>
          </div>

          <div className="grid max-w-lg gap-3 sm:grid-cols-[1fr_0.75fr]">
            <ProductDetailActionButton
              creatorName={product.creatorName}
              currencyCode={product.priceCurrency}
              hasPurchased={hasPurchased}
              isFree={isFree}
              priceAmount={product.priceAmount}
              priceCents={product.priceCents}
              productId={product.productId}
              thumbnailUrl={heroImage || null}
              title={product.title}
            />
            <Link
              href={`/products/${product.productId}/reel`}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/14 bg-black/24 px-5 py-2.5 text-sm font-black text-white backdrop-blur transition hover:border-violet-300/45 active:scale-95"
            >
              View Preview
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/12 bg-black/34 p-5 backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-wide text-violet-300">Special price</p>
          <ProductDetailPrice amount={product.priceAmount} ctaType={product.ctaType} currency={product.priceCurrency} />
          <ul className="mt-4 space-y-2 text-sm font-medium text-slate-200">
            <li>Instant Access</li>
            <li>{isFree ? "Free download" : "Download after purchase"}</li>
            <li>Secure EKALOX checkout</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
