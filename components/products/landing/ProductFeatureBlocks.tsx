import type { ProductFeatureBlock } from "@/lib/uploads/contracts";

interface ProductFeatureBlocksProps {
  items: ProductFeatureBlock[];
}

const iconLabels: Record<string, string> = {
  download: "DL",
  image: "IMG",
  sparkles: "AI",
  video: "VID",
};

export function ProductFeatureBlocks({ items }: ProductFeatureBlocksProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <article key={item.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="flex gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-violet-300/25 bg-violet-400/10 text-xs font-black text-violet-200">
              {iconLabels[item.iconName || ""] || "EK"}
            </span>
            <div>
              <h3 className="text-base font-black text-white">{item.title}</h3>
              {item.description ? <p className="mt-1 text-sm leading-6 text-slate-300">{item.description}</p> : null}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
