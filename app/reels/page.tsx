import { PublicReelFeed } from "@/components/public-reel-feed";
import { getPublicReelFeed } from "@/lib/uploads/queries";

export default async function ReelsPage() {
  const feed = await getPublicReelFeed();

  return (
    <main className="h-[100dvh] overflow-hidden bg-black text-slate-100">
      <section className="h-full">
        <h1 className="sr-only">EKALOX public reel feed</h1>
        <PublicReelFeed items={feed} />
      </section>
    </main>
  );
}
