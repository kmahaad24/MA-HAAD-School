import { getContents } from '@/server/services/site-content.service';
import { latest } from '@/server/services/notice.service';
import { menuLinks } from '@/config/navigation';
import { absoluteUrl } from '@/lib/seo';

// Rebuilt at most once an hour
export const revalidate = 3600;

// Login portals are left out — they are not useful in search results
const SKIP = /^\/(portal|requisition|login|dashboard)(\/|$)/;

export default async function sitemap() {
  const { navigation, facilities, admission, administration, legal } = await getContents('navigation', 'facilities', 'admission', 'administration', 'legal');
  const notices = await latest(200).catch(() => []);
  const now = new Date();
  const seen = new Set();
  const entries = [];
  const add = (href, { priority = 0.7, changeFrequency = 'monthly', lastModified = now } = {}) => {
    if (!href?.startsWith('/') || SKIP.test(href) || seen.has(href)) return;
    seen.add(href);
    entries.push({ url: absoluteUrl(href === '/' ? '' : href), lastModified, changeFrequency, priority });
  };

  add('/', { priority: 1, changeFrequency: 'daily' });
  add('/notices', { priority: 0.9, changeFrequency: 'daily' });
  menuLinks(navigation).forEach((l) => add(l.href, l.href.startsWith('/legal') ? { priority: 0.3, changeFrequency: 'yearly' } : {}));
  facilities.items.forEach((f) => add(`/facilities/${f.slug}`));
  admission.programs.forEach((p) => add(`/admission/${p.slug}`, { priority: 0.8 }));
  ['information', 'rules-and-regulations', 'transfer-procedure', 'prospectus'].forEach((s) => add(`/admission/${s}`));
  add('/admission/apply', { priority: 0.8 });
  administration.groups.forEach((g) => add(`/administration/${g.slug}`, { priority: 0.5 }));
  legal.docs.forEach((d) => add(`/legal/${d.key}`, { priority: 0.3, changeFrequency: 'yearly' }));
  notices.forEach((n) => add(`/notices/${n._id}`, { priority: 0.6, changeFrequency: 'yearly', lastModified: new Date(n.updatedAt || n.date || now) }));
  return entries;
}
