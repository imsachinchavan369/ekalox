import type { LegalDocument } from "./legalContent";

type LegalDocumentPageProps = {
  document: LegalDocument;
};

export function LegalDocumentPage({ document }: LegalDocumentPageProps) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <article className="mx-auto w-full max-w-3xl">
        <header className="border-b border-white/10 pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">EKALOX Legal</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{document.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">{document.description}</p>
          <p className="mt-5 text-sm text-slate-500">Last updated: {document.updatedAt}</p>
        </header>

        <div className="divide-y divide-white/10">
          {document.sections.map((section) => (
            <section key={section.title} className="py-8">
              <h2 className="text-xl font-semibold tracking-tight text-white">{section.title}</h2>
              {section.body ? (
                <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300 sm:text-base">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              ) : null}
              {section.bullets ? (
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-300 sm:text-base">
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
