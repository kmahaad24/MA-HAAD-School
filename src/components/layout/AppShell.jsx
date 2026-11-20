'use client';
import { Suspense, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { appOnlyRoutes } from '@/config/navigation';
import AuthProvider from '@/providers/AuthProvider';
import { setTimeZone } from '@/lib/timezone';
import Navbar from './Navbar';
import Footer from './Footer';
import NoticeTicker from './NoticeTicker';
import NavigationProgress from './NavigationProgress';
import RevealObserver from './RevealObserver';
import GoogleTagManager from './GoogleTagManager';

// Records one visit per browser session (Dashboard → Traffic Analytics)
function useVisitorLog(enabled) {
  useEffect(() => {
    if (!enabled) return;
    try {
      if (sessionStorage.getItem('visitor_logged')) return;
    } catch {}
    fetch('/api/visitor/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referrer: document.referrer || '',
        path: window.location.pathname || '/',
        userAgent: navigator.userAgent || 'Unknown',
      }),
    })
      .then(() => {
        try {
          sessionStorage.setItem('visitor_logged', 'true');
        } catch {}
      })
      .catch(() => {});
  }, [enabled]);
}

// The public website is always light; the dashboard and login follow the saved theme
// (see THEME_SCRIPT in app/layout.jsx). Re-applied on every client-side navigation.
function useRouteTheme(isAppRoute) {
  useEffect(() => {
    let dark = false;
    if (isAppRoute) {
      try {
        const saved = localStorage.getItem('theme');
        dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
      } catch {}
    }
    document.documentElement.classList.toggle('dark', dark);
  }, [isAppRoute]);
}

// Public pages get the school header, notice bar and footer; /dashboard and /login get the auth context instead.
// timeZone comes from the site settings (app/layout.jsx) so dates match the server's rendering.
export default function AppShell({ children, timeZone, notices = [] }) {
  setTimeZone(timeZone);
  const pathname = usePathname() || '/';
  const isAppRoute = appOnlyRoutes.some((route) => pathname.startsWith(route));

  // A4 print versions (/campus/holidays/print …) are bare pages: no header, footer or notice bar
  const isPrintPage = pathname.endsWith('/print');

  useVisitorLog(!isAppRoute && !isPrintPage);
  useRouteTheme(isAppRoute);

  // useSearchParams inside the progress bar needs its own Suspense boundary
  const progress = (
    <Suspense fallback={null}>
      <NavigationProgress />
    </Suspense>
  );

  if (isPrintPage) return children;

  if (isAppRoute) {
    return (
      <AuthProvider>
        {progress}
        {children}
      </AuthProvider>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-600">
      {progress}
      <RevealObserver />
      <GoogleTagManager />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-navy-900 focus:shadow-lg"
      >
        Skip to content
      </a>
      <Navbar />
      <NoticeTicker notices={notices} />
      <main id="main" className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
