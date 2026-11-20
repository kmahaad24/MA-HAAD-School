'use client';
import Script from 'next/script';
import { useSite } from '@/providers/SiteProvider';

const GTM_ID = /^GTM-[A-Z0-9]{4,12}$/;

// Google Tag Manager on the public website (rendered by AppShell outside /dashboard and /login).
// The ID is set in Dashboard → School Information → Search engines; an empty or invalid ID turns it off.
// Loaded only after the page has fully loaded (lazyOnload), so its 180 KB never competes with the page itself.
export default function GoogleTagManager() {
  const id = useSite().general.seo?.gtmId;
  if (!id || !GTM_ID.test(id)) return null;

  return (
    <>
      <Script id="gtm-init" strategy="lazyOnload">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});`}
      </Script>
      <Script id="gtm" strategy="lazyOnload" src={`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`} />
      <noscript>
        <iframe src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(id)}`} height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} title="Google Tag Manager" />
      </noscript>
    </>
  );
}
