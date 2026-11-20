import { SECTION_PAGES } from '@/views/dashboard/sectionMeta';
import SectionsPage from '@/views/dashboard/SectionsPage';

const page = SECTION_PAGES.find((p) => p.href === '/dashboard/facilities');

export const metadata = { title: page.title };

export default function Page() {
  return <SectionsPage title={page.title} description={page.description} keys={page.keys} />;
}
