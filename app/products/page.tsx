import { ProductBrowser } from "@/components/products/ProductBrowser";
import { getPublicReelFeed } from "@/lib/uploads/queries";

export default async function ProductsPage() {
  const products = await getPublicReelFeed();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-5 text-slate-100 sm:px-6 lg:px-8">
      <ProductBrowser products={products} />
    </main>
  );
}
