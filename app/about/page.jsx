import { getContent } from '@/server/services/site-content.service';
import { pageMetadata } from '@/lib/seo';
import Icon from '@/components/ui/Icon';
import SmartImage from '@/components/ui/SmartImage';
import RichText from '@/components/ui/RichText';
import PageBanner from '@/components/school/PageBanner';
import SubpageLayout from '@/components/school/SubpageLayout';
import { AdmissionCta, BodyHeading, CardGrid, IconCard, Section } from '@/components/school/Blocks';

export async function generateMetadata() {
  const { banner, welcome } = await getContent('about');
  return pageMetadata({ title: banner.title, description: welcome.paragraphs[0], path: '/about', image: welcome.image || banner.image });
}

export default async function AboutPage() {
  const about = await getContent('about');
  const { banner, welcome, highlights } = about;
  return (
    <>
      <PageBanner banner={banner} breadcrumbs={[{ label: 'About Us' }]} />

      <SubpageLayout section="/about" current="/about">
        <BodyHeading kicker={welcome.kicker} title={welcome.title} className="[&_h2]:md:text-4xl" />
        {welcome.tagline && <p className="mt-2 font-display text-lg italic text-gold-600">{welcome.tagline}</p>}

        {welcome.image && (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-3xl bg-slate-100 shadow-xl shadow-navy-900/10">
            <SmartImage src={welcome.image} alt={welcome.title} fill sizes="(min-width: 1024px) 800px, 100vw" className="object-cover" />
          </div>
        )}

        {highlights.length > 0 && (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {highlights.map(({ icon, label }) => (
              <li key={label} className="flex items-center gap-3 rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-navy-900">
                <Icon name={icon} className="text-brand-600" /> {label}
              </li>
            ))}
          </ul>
        )}

        <RichText value={welcome.paragraphs} lead className="prose-school mt-8" />
        {welcome.closing && <p className="mt-6 rounded-2xl border-l-4 border-gold-400 bg-gold-50 px-5 py-4 font-display text-xl italic text-navy-900">{welcome.closing}</p>}
      </SubpageLayout>

      {about.purpose.length > 0 && (
        <Section heading={about.purposeHeading} tone="slate">
          <CardGrid cols={3} className="md:grid-cols-3">
            {about.purpose.map((item, i) => <IconCard key={item.title} index={i} {...item} />)}
          </CardGrid>
        </Section>
      )}

      {about.approach.length > 0 && (
        <Section heading={about.approachHeading}>
          <CardGrid cols={3}>
            {about.approach.map((item, i) => <IconCard key={item.title} index={i} variant="side" {...item} />)}
          </CardGrid>
        </Section>
      )}

      <AdmissionCta />
    </>
  );
}
