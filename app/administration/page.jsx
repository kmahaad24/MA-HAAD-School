import { getContent } from '@/server/services/site-content.service';
import { pageMetadata } from '@/lib/seo';
import PageBanner from '@/components/school/PageBanner';
import { CardGrid, IconCard, Section } from '@/components/school/Blocks';

export async function generateMetadata() {
  const { banner } = await getContent('administration');
  return pageMetadata({ title: banner.title, description: banner.subtitle, path: '/administration', image: banner.image });
}

export default async function AdministrationPage() {
  const { banner, heading, groups } = await getContent('administration');
  return (
    <>
      <PageBanner banner={banner} breadcrumbs={[{ label: banner.title }]} />
      <Section heading={heading}>
        <CardGrid cols={3}>
          {groups.map((group, i) => (
            <IconCard key={group.slug} index={i} variant="compact" icon="users" title={group.title} text={group.intro} href={`/administration/${group.slug}`}>
              {group.kicker && <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-brand-600">{group.kicker}</p>}
            </IconCard>
          ))}
        </CardGrid>
      </Section>
    </>
  );
}
