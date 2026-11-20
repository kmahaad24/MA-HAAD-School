import { getContent } from '@/server/services/site-content.service';
import { pageMetadata } from '@/lib/seo';
import PageBanner from '@/components/school/PageBanner';
import { AdmissionCta, CardGrid, ImageLinkCard, Section } from '@/components/school/Blocks';

export async function generateMetadata() {
  const { banner, heading, items } = await getContent('facilities');
  return pageMetadata({ title: banner.title, description: heading.subtitle || items.map((f) => f.title).join(', '), path: '/facilities', image: banner.image });
}

export default async function FacilitiesPage() {
  const { banner, heading, items } = await getContent('facilities');
  return (
    <>
      <PageBanner banner={banner} breadcrumbs={[{ label: banner.title }]} />
      <Section heading={heading}>
        <CardGrid cols={3}>
          {items.map((f, i) => (
            <ImageLinkCard key={f.slug} index={i} href={`/facilities/${f.slug}`} image={f.image} icon={f.icon} title={f.title} text={f.summary} />
          ))}
        </CardGrid>
      </Section>
      <AdmissionCta />
    </>
  );
}
