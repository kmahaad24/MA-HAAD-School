'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaPrint, FaFilePdf } from 'react-icons/fa';

// Bar above the A4 sheet (hidden when printing): back, print and PDF download.
// Opening the page with ?print=1 starts printing once the fonts have loaded.
export default function PrintToolbar({ backHref, backLabel, pdfHref, title }) {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('print') !== '1') return;
    let cancelled = false;
    (document.fonts?.ready || Promise.resolve()).then(() => {
      if (!cancelled) setTimeout(() => window.print(), 300);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="sticky top-0 z-10 mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center gap-2 rounded-xl bg-navy-900 px-4 py-3 text-white shadow-lg print:hidden">
      <Link href={backHref} className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white">
        <FaArrowLeft className="text-xs" aria-hidden /> {backLabel}
      </Link>
      <p className="mr-auto hidden text-sm font-semibold sm:block">{title} · A4</p>
      <a href={pdfHref} download className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-3 py-2 text-sm font-semibold hover:bg-white/10">
        <FaFilePdf aria-hidden /> Download PDF
      </a>
      <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-gold-400 px-3 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-300">
        <FaPrint aria-hidden /> Print
      </button>
    </div>
  );
}
