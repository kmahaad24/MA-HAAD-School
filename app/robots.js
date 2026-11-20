import { siteUrl } from '@/lib/seo';

export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/dashboard', '/login', '/portal', '/requisition', '/api/'] },
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
