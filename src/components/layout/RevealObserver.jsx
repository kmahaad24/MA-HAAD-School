'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isSlowConnection, prefersReducedMotion } from '@/lib/network';

// Scroll animations without shipping JavaScript per section: any element with `data-reveal` fades up as it
// enters the screen (styles in globals.css). One observer for the whole page; content is only hidden after
// this script runs, so pages without JavaScript — or on slow / data-saver connections — show everything at once.
export default function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedMotion() || isSlowConnection() || !('IntersectionObserver' in window)) return;
    const root = document.documentElement;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-revealed');
          io.unobserve(e.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    const watch = () =>
      document.querySelectorAll('[data-reveal]:not(.is-revealed)').forEach((el) => {
        // Already on screen when the page opens: show without animating
        if (!root.classList.contains('reveal-on') && el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-revealed');
        else io.observe(el);
      });
    watch();
    root.classList.add('reveal-on');
    const mo = new MutationObserver(watch);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
