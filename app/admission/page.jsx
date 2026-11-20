import Link from 'next/link';
import { FaArrowRight } from 'react-icons/fa';
import { getContents } from '@/server/services/site-content.service';
import { sectionLinks } from '@/config/navigation';
import { pageMetadata } from '@/lib/seo';
import PageBanner from '@/components/school/PageBanner';
import { AdmissionCta, CardGrid, ImageLinkCard, Section, delay } from '@/components/school/Blocks';

export async function generateMetadata() {
  const { admission } = await getContents('admission');
  return pageMetadata({ title: admission.banner.title, description: admission.banner.subtitle, path: '/admission', image: admission.banner.image });
}

export default async function AdmissionPage() {
  const { admission, navigation } = await getContents('admission', 'navigation');
  // The other admission pages in the menu (information, rules, prospectus …)
  const more = sectionLinks(navigation, '/admission').filter((l) => !admission.programs.some((p) => l.href === `/admission/${p.slug}`));
  return (
    <>
      <PageBanner banner={admission.banner} breadcrumbs={[{ label: admission.banner.title }]} />

      <Section heading={admission.heading}>
        <CardGrid cols={3} className="md:grid-cols-3">
          {admission.programs.map((p, i) => (
            <ImageLinkCard key={p.slug} index={i} href={`/admission/${p.slug}`} image={p.image} badge={p.level} title={p.title} text={p.summary} cta="Details" sizes="(min-width: 768px) 33vw, 100vw" />
          ))}
        </CardGrid>

        {more.length > 0 && (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {more.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                data-reveal=""
                style={delay(i)}
                className="group flex items-center justify-between rounded-2xl bg-navy-900 px-6 py-5 font-display text-lg text-white transition hover:bg-brand-700"
              >
                {link.label}
                <FaArrowRight className="text-gold-400 transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
            ))}
          </div>
        )}
      </Section>
      <AdmissionCta />
    </>
  );
}
