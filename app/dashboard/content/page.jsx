import { redirect } from 'next/navigation';
import { pageForSection } from '@/views/dashboard/sectionMeta';
import ContentIndex from '@/views/dashboard/ContentIndex';

export const metadata = { title: 'Page Content' };

// ?section=facilities for a section that now has its own page → open that page
export default async function Page({ searchParams }) {
  const { section } = await searchParams;
  const page = typeof section === 'string' && pageForSection(section);
  if (page) redirect(page.keys.length > 1 ? `${page.href}?tab=${encodeURIComponent(section)}` : page.href);
  return <ContentIndex />;
}
