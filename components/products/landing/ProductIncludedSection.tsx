interface ProductIncludedSectionProps {
  items: string[];
}

const fallbackItems = ["Instant Download", "Creator-provided files", "Works after checkout or claim", "Saved to your EKALOX library"];

export function ProductIncludedSection({ items }: ProductIncludedSectionProps) {
  const included = items.length > 0 ? items : fallbackItems;

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
      <h2 className="text-xl font-black text-white">What's Included</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {included.map((item) => (
          <li key={item} className="rounded-2xl border border-white/10 bg-black/24 p-4 text-sm font-bold text-slate-100">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
