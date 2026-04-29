import type { ProductLandingMetadata } from "@/lib/uploads/contracts";

interface ProductLandingEditorFieldsProps {
  initialLanding?: ProductLandingMetadata;
  includeFileInputs?: boolean;
}

function value(value: string | null | undefined) {
  return value ?? "";
}

export function ProductLandingEditorFields({
  initialLanding,
  includeFileInputs = true,
}: ProductLandingEditorFieldsProps) {
  const previews = initialLanding?.previewGallery ?? [];
  const includedItems = initialLanding?.includedItems ?? [];
  const features = initialLanding?.featureBlocks ?? [];

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div>
        <h2 className="text-sm font-black text-white">Product landing page</h2>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Optional presentation fields for a premium sales page. Empty fields are ignored.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-slate-300">Hero title</span>
          <input name="heroTitle" defaultValue={value(initialLanding?.heroTitle)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-400 transition focus:ring-2" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-slate-300">Badge text</span>
          <input name="badgeText" defaultValue={value(initialLanding?.badgeText)} placeholder="New Launch" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-400 transition focus:ring-2" />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="text-slate-300">Hero subtitle</span>
        <textarea name="heroSubtitle" rows={2} defaultValue={value(initialLanding?.heroSubtitle)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-400 transition focus:ring-2" />
      </label>

      {includeFileInputs ? (
        <label className="block space-y-1 text-sm">
          <span className="text-slate-300">Hero image</span>
          <input type="file" name="heroImage" accept="image/*" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-500 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-950 hover:file:bg-cyan-400" />
        </label>
      ) : null}

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Preview gallery</p>
        {Array.from({ length: 4 }, (_, index) => {
          const preview = previews[index];

          return (
            <div key={index} className="grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3 sm:grid-cols-2">
              {includeFileInputs ? (
                <label className="space-y-1 text-sm sm:col-span-2">
                  <span className="text-slate-300">Preview image {index + 1}</span>
                  <input type="file" name={`previewImage${index}`} accept="image/*" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-500 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-950 hover:file:bg-cyan-400" />
                </label>
              ) : null}
              <input type="hidden" name={`previewExistingImage${index}`} defaultValue={value(preview?.imagePath ?? preview?.imageUrl)} />
              <input type="hidden" name={`previewOrder${index}`} defaultValue={String(preview?.displayOrder ?? index + 1)} />
              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Preview title</span>
                <input name={`previewTitle${index}`} defaultValue={value(preview?.title)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-400 transition focus:ring-2" />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-slate-300">Preview description</span>
                <input name={`previewDescription${index}`} defaultValue={value(preview?.description)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-400 transition focus:ring-2" />
              </label>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <label key={index} className="space-y-1 text-sm">
            <span className="text-slate-300">Included item {index + 1}</span>
            <input name={`includedItem${index}`} defaultValue={value(includedItems[index])} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-400 transition focus:ring-2" />
          </label>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Feature blocks</p>
        {Array.from({ length: 4 }, (_, index) => {
          const feature = features[index];

          return (
            <div key={index} className="grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3 sm:grid-cols-[0.65fr_1fr_1fr]">
              <input name={`featureIcon${index}`} defaultValue={value(feature?.iconName)} placeholder="sparkles" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-400 transition focus:ring-2" />
              <input name={`featureTitle${index}`} defaultValue={value(feature?.title)} placeholder="Feature title" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-400 transition focus:ring-2" />
              <input name={`featureDescription${index}`} defaultValue={value(feature?.description)} placeholder="Short description" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-400 transition focus:ring-2" />
            </div>
          );
        })}
      </div>

      <label className="block space-y-1 text-sm">
        <span className="text-slate-300">Full landing description</span>
        <textarea name="landingDescription" rows={5} defaultValue={value(initialLanding?.landingDescription)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-400 transition focus:ring-2" />
      </label>
    </section>
  );
}
