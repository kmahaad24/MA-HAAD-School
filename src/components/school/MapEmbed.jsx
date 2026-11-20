'use client';
import { useEffect, useRef, useState } from 'react';
import { FaMapMarkedAlt } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import { isSlowConnection } from '@/lib/network';

// Google map that costs nothing until it is needed: the heavy map frame (~1 MB) loads when it scrolls into
// view, or — on slow / data-saver connections — only after the visitor taps "Show map".
export default function MapEmbed({ src, title, address, directionsUrl, className }) {
  const box = useRef(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    if (!src || load || isSlowConnection()) return;
    const el = box.current;
    if (!el || !('IntersectionObserver' in window)) {
      setLoad(true);
      return;
    }
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setLoad(true), { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [src, load]);

  if (!src) return null;

  return (
    <div ref={box} className={cn('relative overflow-hidden bg-slate-100', className)}>
      {load ? (
        <iframe title={title} src={src} className="absolute inset-0 h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_center,#eef6fc,#e2e8f0)] p-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl text-brand-600 shadow">
            <FaMapMarkedAlt aria-hidden />
          </span>
          {address && <p className="max-w-sm text-sm text-slate-600">{address}</p>}
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => setLoad(true)} className="rounded-full bg-navy-900 px-5 py-2 text-sm font-semibold text-white hover:bg-navy-800">
              Show map
            </button>
            {directionsUrl && (
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-brand-300 bg-white px-5 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                Directions
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
