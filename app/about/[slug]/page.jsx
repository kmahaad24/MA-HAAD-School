import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaArrowRight } from 'react-icons/fa';
import { messages } from '@/data/school';
import { getLeader } from '@/server/services/content.service';
import { getContents } from '@/server/services/site-content.service';
import { pageMetadata } from '@/lib/seo';
import PageBanner from '@/components/school/PageBanner';
import Container from '@/components/ui/Container';
import RichText from '@/components/ui/RichText';
import { PersonPhoto } from '@/components/school/Blocks';

// Message saved in Dashboard → CEO & Principal, or the built-in text if the database can't be reached
async function readMessage(slug) {
  if (!messages[slug]) return null;
  try {
    return await getLeader(slug);
  } catch {
    return messages[slug];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const message = await readMessage(slug);
  if (!message) return {};
  return pageMetadata({ title: message.label, description: message.excerpt, path: `/about/${slug}`, image: message.photo, type: 'article' });
}

export default async function MessagePage({ params }) {
  const { slug } = await params;
  const message = await readMessage(slug);
  if (!message) notFound();

  const { general, messages: pages } = await getContents('general', 'messages');
  const school = general.identity.name;
  const other = Object.values(messages).find((m) => m.slug !== slug);
  const displayName = message.name || message.role;
  const banner = slug === 'ceo-message' ? pages.ceoBanner : pages.principalBanner;

  return (
    <>
      <PageBanner title={message.label} subtitle={school} breadcrumbs={[{ label: 'About Us', href: '/about' }, { label: message.label }]} image={banner} />

      <section className="bg-slate-50 py-12 md:py-16">
        <Container className="max-w-5xl">
          <div className="grid gap-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 md:grid-cols-[240px_1fr] md:gap-10 md:p-10">
            {/* Photo and name */}
            <aside className="mx-auto w-full max-w-[240px] md:sticky md:top-20 md:self-start">
              <PersonPhoto photo={message.photo} name={displayName} className="aspect-[5/6] rounded-xl border border-slate-200" sizes="240px" />
              <div className="mt-4 border-t-4 border-gold-400 pt-3 text-center">
                <p className="font-display text-lg font-bold leading-snug text-navy-900">{displayName}</p>
                {message.name && <p className="text-sm font-medium text-brand-700">{message.role}</p>}
                <p className="text-xs text-slate-500">{school}</p>
              </div>
            </aside>

            {/* Message */}
            <article>
              <h2 className="font-display text-2xl text-navy-900 sm:text-3xl">{message.heading}</h2>
              <div className="mt-3 h-1 w-14 rounded-full bg-gold-400" aria-hidden />
              <RichText value={message.paragraphs} className="mt-6 space-y-4 text-[15px] leading-relaxed text-slate-600 sm:text-base" />

              <div className="mt-8 border-t border-slate-200 pt-5">
                {pages.signOff && <p className="text-sm text-slate-500">{pages.signOff}</p>}
                <p className="mt-1 font-display text-lg font-bold text-navy-900">{displayName}</p>
                <p className="text-sm text-slate-500">
                  {message.name ? `${message.role}, ` : ''}
                  {school}
                </p>
              </div>
            </article>
          </div>

          {other && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
              <p className="text-sm text-slate-600">
                Also read the <span className="font-semibold text-navy-900">{other.label}</span>
              </p>
              <Link href={`/about/${other.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-gold-600">
                Read message <FaArrowRight aria-hidden />
              </Link>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
