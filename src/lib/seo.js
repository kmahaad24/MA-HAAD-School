// Search-engine helpers: absolute URLs, per-page metadata (title, description, canonical link, link
// previews) and structured data (JSON-LD) for Google.
import { getContent } from '@/server/services/site-content.service';

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
export const absoluteUrl = (path = '/') => (/^https?:\/\//i.test(path) ? path : `${siteUrl()}${path.startsWith('/') ? '' : '/'}${path}`);

const clip = (text, max = 160) => {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : s;
};

/**
 * Metadata for one page:
 *   export async function generateMetadata() { return pageMetadata({ title: 'Facilities', description, path: '/facilities', image }); }
 */
export async function pageMetadata({ title, description, path = '/', image, noIndex = false, type = 'website' } = {}) {
  const { identity, branding } = await getContent('general');
  const desc = clip(description || identity.description);
  const img = image || branding.ogImage;
  return {
    ...(title && { title }),
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      type,
      url: path,
      siteName: identity.name,
      title: title ? `${title} | ${identity.name}` : `${identity.name} — ${identity.tagline}`,
      description: desc,
      ...(img && { images: [{ url: img, alt: title || identity.name }] }),
    },
    twitter: { card: 'summary_large_image', title: title || identity.name, description: desc, ...(img && { images: [img] }) },
    ...(noIndex && { robots: { index: false, follow: true } }),
  };
}

// School details for Google (shown in search results / the knowledge panel)
export function schoolJsonLd(general) {
  const { identity, branding, contact, social } = general;
  return {
    '@context': 'https://schema.org',
    '@type': ['School', 'EducationalOrganization'],
    name: identity.name,
    alternateName: identity.shortName || undefined,
    description: identity.description,
    url: siteUrl(),
    logo: branding.logo ? absoluteUrl(branding.logo) : undefined,
    image: branding.ogImage ? absoluteUrl(branding.ogImage) : undefined,
    email: contact.email || undefined,
    telephone: contact.phones?.[0] || undefined,
    address: contact.address ? { '@type': 'PostalAddress', streetAddress: contact.address, addressCountry: 'BD' } : undefined,
    hasMap: contact.mapUrl || undefined,
    sameAs: Object.values(social || {}).filter(Boolean),
  };
}

// Breadcrumb trail for Google: [{ label, href? }] — "Home" first
export function breadcrumbJsonLd(crumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, ...(c.href && { item: absoluteUrl(c.href) }) })),
  };
}
