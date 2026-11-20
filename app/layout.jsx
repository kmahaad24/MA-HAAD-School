import { Playfair_Display, Poppins } from 'next/font/google';
import '@/styles/globals.css';
import AppShell from '@/components/layout/AppShell';
import JsonLd from '@/components/seo/JsonLd';
import { SiteProvider } from '@/providers/SiteProvider';
import { THEME_COLOR } from '@/config/site';
import { siteUrl, schoolJsonLd } from '@/lib/seo';
import { getCachedSetting } from '@/server/services/settings.service';
import { getContents } from '@/server/services/site-content.service';
import { tickerNotices } from '@/server/services/notice.service';
import { DEFAULT_TIME_ZONE, setTimeZone } from '@/lib/timezone';

// Fonts are self-hosted by Next.js (no request to Google), shown with a fallback font until loaded
const display = Playfair_Display({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const sans = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans', display: 'swap' });

// Title, description, link previews and search-engine settings come from Dashboard → Website Content → School information
export async function generateMetadata() {
  const { general } = await getContents('general');
  const { identity, branding, seo } = general;
  const fullTitle = `${identity.name} — ${identity.tagline}`;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: fullTitle, template: `%s | ${identity.name}` },
    description: identity.description,
    applicationName: identity.name,
    keywords: seo.keywords,
    alternates: { canonical: '/' },
    formatDetection: { telephone: true, email: true, address: true },
    openGraph: {
      title: fullTitle,
      description: identity.description,
      url: '/',
      siteName: identity.name,
      ...(branding.ogImage && { images: [{ url: branding.ogImage, alt: identity.name }] }),
      locale: 'en_US',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description: identity.description, ...(branding.ogImage && { images: [branding.ogImage] }) },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
    ...(seo.googleVerification && { verification: { google: seo.googleVerification } }),
  };
}

export const viewport = {
  themeColor: THEME_COLOR,
  width: 'device-width',
  initialScale: 1,
};

// Every page reads the site timezone and the notice bar per request (both cached in memory)
export const dynamic = 'force-dynamic';

// Dashboard and login: applies the saved theme (or the system preference) before first paint.
// The public website always stays light.
const THEME_SCRIPT = `(function(){try{var p=location.pathname;var app=p.indexOf('/dashboard')===0||p.indexOf('/login')===0;var t=localStorage.getItem('theme');var d=app&&(t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

async function readTimeZone() {
  try {
    return (await getCachedSetting('site')).timezone; // cached 60 s — keeps first paint fast
  } catch {
    return DEFAULT_TIME_ZONE; // database unreachable — pages still render
  }
}

async function readTicker() {
  try {
    return await tickerNotices(); // cached 60 s
  } catch {
    return []; // database unreachable — the bar shows the messages from Website Content
  }
}

export default async function RootLayout({ children }) {
  const [timeZone, notices, content] = await Promise.all([readTimeZone(), readTicker(), getContents('general', 'navigation', 'shared')]);
  setTimeZone(timeZone);
  // Only what the header, footer and forms need is sent to the browser
  const site = { general: content.general, navigation: content.navigation, shared: { ticker: content.shared.ticker } };

  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <JsonLd data={schoolJsonLd(content.general)} />
      </head>
      <body suppressHydrationWarning>
        <SiteProvider value={site}>
          <AppShell timeZone={timeZone} notices={notices}>{children}</AppShell>
        </SiteProvider>
      </body>
    </html>
  );
}
