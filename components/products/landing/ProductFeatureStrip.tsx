interface ProductFeatureStripProps {
  description: string;
}

const defaultFeatures = ["Creator Files", "Premium Quality", "Easy to Use", "Instant Download"];

function extractFeatures(description: string) {
  const bulletMatches = description
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((line) => line.length >= 3 && line.length <= 42)
    .slice(0, 4);

  return bulletMatches.length >= 2 ? bulletMatches : defaultFeatures;
}

export function ProductFeatureStrip({ description }: ProductFeatureStripProps) {
  const features = extractFeatures(description);

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {features.map((feature, index) => (
        <div key={`${feature}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-xs font-black text-violet-200">
            {index + 1}
          </div>
          <p className="text-sm font-black text-white">{feature}</p>
        </div>
      ))}
    </section>
  );
}
