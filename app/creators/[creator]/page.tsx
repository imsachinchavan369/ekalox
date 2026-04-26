import { notFound } from "next/navigation";

import { getPublicReelFeed } from "@/lib/uploads/queries";
import { CreatorStorefrontHeader } from "@/components/profile/CreatorStorefrontHeader";
import { ProfileUploadCard } from "@/components/profile/ProfileUploadCard";

interface CreatorProfilePageProps {
  params: Promise<{ creator: string }>;
}

export default async function CreatorProfilePage({ params }: CreatorProfilePageProps) {
  const { creator } = await params;
  const products = await getPublicReelFeed();
  const creatorProducts = products.filter((product) => product.creatorProfileId === creator);
  const creatorName = creatorProducts[0]?.creatorName;

  if (!creatorName) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100">
      <section className="mx-auto w-full max-w-md space-y-5">
        <CreatorStorefrontHeader
          creatorId={creator}
          creatorName={creatorName}
          followingCount={creatorProducts[0]?.creatorFollowingCount ?? 0}
          productCount={creatorProducts.length}
          totalDownloads={creatorProducts.reduce((sum, product) => sum + product.downloadsCount, 0)}
        />

        <ul className="space-y-3">
          {creatorProducts.map((product) => (
            <ProfileUploadCard
              key={`${product.productId}-${product.createdAt}`}
              caption={product.caption}
              createdAt={product.createdAt}
              ctaType={product.ctaType}
              productId={product.productId}
              averageRating={product.averageRating}
              downloadsCount={product.downloadsCount}
              priceAmount={product.priceAmount}
              priceCurrency={product.priceCurrency}
              ratingCount={product.ratingCount}
              reelUrl={product.reelUrl}
              title={product.title}
            />
          ))}
        </ul>
      </section>
    </main>
  );
}
