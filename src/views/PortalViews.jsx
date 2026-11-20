import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaArrowRight, FaUserLock } from 'react-icons/fa';
import { getContents } from '@/server/services/site-content.service';
import { pageMetadata } from '@/lib/seo';
import PageBanner from '@/components/school/PageBanner';
import PortalLogin from '@/components/school/PortalLogin';
import { Section, delay } from '@/components/school/Blocks';

// Shared by /portal (School Management Login) and /requisition (Requisition Login).
// Portals are edited in Dashboard → Website Content → Login portals.

async function loadGroup(key) {
  const { portals, shared } = await getContents('portals', 'shared');
  return { group: { key, ...portals[key] }, banner: shared.cta.image };
}

export async function portalIndexMetadata(key) {
  const { group } = await loadGroup(key);
  return pageMetadata({ title: group.title, description: group.description, path: `/${key}`, noIndex: true });
}

export async function PortalIndex({ groupKey }) {
  const { group, banner } = await loadGroup(groupKey);
  return (
    <>
      <PageBanner title={group.title} subtitle={group.description} breadcrumbs={[{ label: group.title }]} image={banner} />
      <Section heading={{ kicker: 'Secure access', title: 'Choose your portal' }}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {group.items.map((p, i) => (
            <Link
              key={p.slug}
              href={`/${group.key}/${p.slug}`}
              data-reveal=""
              style={delay(i)}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy-900 to-brand-600 text-white">
                <FaUserLock aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg text-navy-900 group-hover:text-brand-700">{p.title}</span>
                <span className="block truncate text-sm text-slate-500">{p.audience}</span>
              </span>
              <FaArrowRight className="text-gold-500 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}

export async function portalMetadata(key, params) {
  const { slug } = await params;
  const { group } = await loadGroup(key);
  const portal = group.items.find((p) => p.slug === slug);
  if (!portal) return {};
  return pageMetadata({ title: `${portal.title} — ${group.title}`, path: `/${key}/${slug}`, noIndex: true });
}

export async function PortalPage({ groupKey, params }) {
  const { slug } = await params;
  const { group, banner } = await loadGroup(groupKey);
  const portal = group.items.find((p) => p.slug === slug);
  if (!portal) notFound();

  return (
    <>
      <PageBanner title={portal.title} subtitle={group.title} breadcrumbs={[{ label: group.title, href: `/${group.key}` }, { label: portal.title }]} image={banner} />
      <section className="bg-slate-50 py-12 md:py-16">
        <div className="container max-w-7xl">
          <PortalLogin
            portal={{ ...portal, idLabel: portal.idLabel || 'User ID' }}
            group={{ key: group.key, title: group.title }}
            siblings={group.items.map(({ slug: s, title }) => ({ slug: s, title }))}
            image={banner}
          />
        </div>
      </section>
    </>
  );
}
