import { getContent } from '@/server/services/site-content.service';
import { pageMetadata } from '@/lib/seo';
import PageBanner from '@/components/school/PageBanner';
import { CardGrid, IconCard, Section } from '@/components/school/Blocks';
import { FaArrowRight } from 'react-icons/fa';

export async function generateMetadata() {
  const { banner } = await getContent('campus');
  return pageMetadata({ title: banner.title, description: banner.subtitle, path: '/campus', image: banner.image });
}

export default async function CampusPage() {
  const { banner, heading, cards } = await getContent('campus');
  return (
    <>
      <PageBanner banner={banner} breadcrumbs={[{ label: banner.title }]} />
      <Section heading={heading}>
        <CardGrid cols={3} className="md:grid-cols-3">
          {cards.map((card, i) => (
            <IconCard key={card.href} index={i} {...card}>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-700">Open <FaArrowRight aria-hidden /></span>
            </IconCard>
          ))}
        </CardGrid>
      </Section>
    </>
  );
}
