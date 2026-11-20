import { FaImages } from 'react-icons/fa';
import { listGallery } from '@/server/services/content.service';
import { getContent } from '@/server/services/site-content.service';
import { pageMetadata } from '@/lib/seo';
import PageBanner from '@/components/school/PageBanner';
import GalleryGrid from '@/components/school/GalleryGrid';
import { Section } from '@/components/school/Blocks';

export async function generateMetadata() {
  const { banner, heading } = await getContent('gallery');
  return pageMetadata({ title: banner.title, description: heading.subtitle || banner.subtitle, path: '/gallery', image: banner.image });
}

// Photos are managed in Dashboard → Photo Gallery; the text in Website Content → Photo gallery page
export default async function GalleryPage() {
  const [photos, page] = await Promise.all([listGallery().catch(() => []), getContent('gallery')]);
  const categories = ['All', ...new Set(photos.map((p) => p.category).filter(Boolean))];

  return (
    <>
      <PageBanner banner={page.banner} breadcrumbs={[{ label: page.banner.title }]} />
      <Section heading={page.heading}>
        {photos.length ? (
          <GalleryGrid items={photos} categories={categories} />
        ) : (
          <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
            <FaImages className="text-4xl text-gold-500" aria-hidden />
            <p className="mt-4 font-display text-xl text-navy-900">{page.emptyText}</p>
          </div>
        )}
      </Section>
    </>
  );
}
