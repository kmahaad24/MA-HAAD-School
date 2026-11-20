import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaEnvelope } from 'react-icons/fa';
import { getContents } from '@/server/services/site-content.service';
import { pageMetadata } from '@/lib/seo';
import { cn } from '@/lib/utils';
import PageBanner from '@/components/school/PageBanner';
import RichText from '@/components/ui/RichText';

// "Acceptable use" → "acceptable-use" (anchor links in the table of contents)
const anchor = (text, i) => `${String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section'}-${i + 1}`;

async function loadDoc(docKey) {
  const { legal, general } = await getContents('legal', 'general');
  const raw = legal.docs.find((d) => d.key === docKey);
  if (!raw) return { legal, general, doc: null };
  // {{school}} / {{email}} / {{address}} → current school details
  const fill = (text) =>
    String(text ?? '')
      .replaceAll('{{school}}', general.identity.name)
      .replaceAll('{{email}}', general.contact.email)
      .replaceAll('{{address}}', general.contact.address);
  const doc = { ...raw, title: fill(raw.title), summary: fill(raw.summary), sections: raw.sections.map((s, i) => ({ id: anchor(s.heading, i), heading: fill(s.heading), body: fill(s.body) })) };
  return { legal, general, doc };
}

export async function legalMetadata(docKey) {
  const { doc } = await loadDoc(docKey);
  return doc ? pageMetadata({ title: doc.title, description: doc.summary, path: `/legal/${docKey}` }) : {};
}

// Shared layout for every /legal page. Text is in Dashboard → Website Content → Legal pages; `docKey` is the route name.
export default async function LegalPage({ docKey }) {
  const { legal, general, doc } = await loadDoc(docKey);
  if (!doc) notFound();
  const { email } = general.contact;

  return (
    <div className="bg-white">
      <PageBanner title={doc.title} subtitle={doc.summary} breadcrumbs={[{ label: 'Legal' }, { label: doc.title }]} />
      <div className="border-b border-slate-200 bg-white">
        <nav aria-label="Legal documents" className="container flex max-w-6xl gap-2 overflow-x-auto py-4 scrollbar-none">
          {legal.docs.map((d) => (
            <Link
              key={d.key}
              href={`/legal/${d.key}`}
              aria-current={d.key === docKey ? 'page' : undefined}
              className={cn(
                'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                d.key === docKey ? 'border-transparent bg-navy-900 text-white' : 'border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700'
              )}
            >
              {d.title}
            </Link>
          ))}
        </nav>
        {doc.lastUpdated && <p className="container max-w-6xl pb-4 text-xs text-slate-500">Last updated: {doc.lastUpdated}</p>}
      </div>

      <div className="container max-w-6xl py-10 md:py-14 lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">
        <aside className="mb-8 lg:mb-0">
          <details className="rounded-xl border border-slate-200 bg-white p-4 lg:sticky lg:top-24 lg:border-0 lg:bg-transparent lg:p-0" open>
            <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-slate-500 lg:pointer-events-none lg:list-none">On this page</summary>
            <ol className="mt-3 space-y-1.5 text-sm">
              {doc.sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex gap-2 text-slate-600 transition-colors hover:text-brand-600">
                    <span className="w-5 shrink-0 text-slate-400">{i + 1}.</span> {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </details>
        </aside>

        <article className="min-w-0 max-w-3xl">
          <div className="space-y-10">
            {doc.sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="mb-3 flex items-baseline gap-3 font-display text-xl text-navy-900">
                  <span className="font-sans text-sm font-bold text-brand-600">{String(i + 1).padStart(2, '0')}</span>
                  {s.heading}
                </h2>
                <RichText value={s.body} className="prose-school" />
              </section>
            ))}
          </div>

          {email && (
            <div className="mt-12 flex flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-navy-900">Still have a question?</p>
                <p className="text-sm text-slate-500">We usually reply within a few working days.</p>
              </div>
              <a href={`mailto:${email}`} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-navy-900 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white">
                <FaEnvelope aria-hidden /> {email}
              </a>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
