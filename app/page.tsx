import { HomePage } from "@/components/home/HomePage";
import { getVerifiedHomeReelFeed } from "@/lib/uploads/queries";

export default async function Page() {
  const products = await getVerifiedHomeReelFeed();

  return <HomePage products={products} />;
}
