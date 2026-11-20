import { notFound } from 'next/navigation';
import { getContent } from '@/server/services/site-content.service';
import { pageMetadata } from '@/lib/seo';
import Icon from '@/components/ui/Icon';
import SmartImage from '@/components/ui/SmartImage';
import RichText from '@/components/ui/RichText';
import PageBanner from '@/components/school/PageBanner';
import SubpageLayout from '@/components/school/SubpageLayout';
import { BodyHeading, CheckList } from '@/components/school/Blocks';

async function find(slug) {
  const facilities = await getContent('facilities');
  return { facilities, facility: facilities.items.find((f) => f.slug === slug) };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { facility } = await find(slug);
  return facility ? pageMetadata({ title: facility.title, description: facility.summary, path: `/facilities/${slug}`, image: facility.image }) : {};
}

export default async function FacilityPage({ params }) {
  const { slug } = await params;
  const { facilities, facility } = await find(slug);
  if (!facility) notFound();

  return (
    <>
      <PageBanner
        title={facility.title}
        subtitle={facility.summary}
        breadcrumbs={[{ label: facilities.banner.title, href: '/facilities' }, { label: facility.title }]}
        image={facility.image || facilities.banner.image}
      />

      <SubpageLayout section="/facilities" current={`/facilities/${slug}`}>
        {facility.image ? (
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-slate-100 shadow-xl shadow-navy-900/10">
            <SmartImage src={facility.image} alt={facility.title} fill sizes="(min-width: 1024px) 800px, 100vw" className="object-cover" />
          </div>
        ) : (
          <div className="relative flex aspect-[16/7] items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-brand-800 to-brand-600 shadow-xl">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" aria-hidden />
            <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-gold-400/10" aria-hidden />
            <span className="flex h-28 w-28 items-center justify-center rounded-3xl bg-white/10 text-5xl text-gold-300 ring-1 ring-white/20 backdrop-blur">
              <Icon name={facility.icon} />
            </span>
          </div>
        )}

        <BodyHeading kicker={facilities.banner.title} title={facility.title} className="mt-10" />
        <RichText value={facility.paragraphs} className="prose-school mt-5" />

        {facility.features.length > 0 && (
          <>
            <h3 className="mt-10 font-display text-2xl text-navy-900">Highlights</h3>
            <CheckList items={facility.features} className="mt-5" />
          </>
        )}
      </SubpageLayout>
    </>
  );
}
