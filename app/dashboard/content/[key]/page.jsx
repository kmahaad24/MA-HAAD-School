import { redirect } from 'next/navigation';
import { pageForSection } from '@/views/dashboard/sectionMeta';

// Old links (/dashboard/content/home) open the page that now edits that section
export default async function Page({ params }) {
  const { key } = await params;
  const page = pageForSection(key);
  if (page) redirect(page.keys.length > 1 ? `${page.href}?tab=${encodeURIComponent(key)}` : page.href);
  redirect(`/dashboard/content?section=${encodeURIComponent(key)}`);
}
