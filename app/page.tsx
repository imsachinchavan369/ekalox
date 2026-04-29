import { HomePage } from "@/components/home/HomePage";
import { getPublicReelFeed } from "@/lib/uploads/queries";

export default async function Page() {
  const products = await getPublicReelFeed();

  return <HomePage products={products} />;
}
