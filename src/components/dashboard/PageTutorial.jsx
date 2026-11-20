'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FaPlayCircle, FaYoutube } from 'react-icons/fa';
import { HiX } from 'react-icons/hi';
import { tutorialFor } from '@/config/tutorials';
import { cn } from '@/lib/utils';

/**
 * "Learn about this page" — opens the tutorial video for the current dashboard page (src/config/tutorials.js).
 * Nothing is downloaded from YouTube until the button is pressed, so dashboard pages stay fast on slow internet.
 * Uses youtube-nocookie.com (no tracking cookies until the video plays).
 */
export default function PageTutorial({ className }) {
  const pathname = usePathname();
  const video = tutorialFor(pathname);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  if (!video) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 sm:px-3',
          className
        )}
        aria-label={`Learn about this page: ${video.title} (video)`}
      >
        <FaPlayCircle aria-hidden /> <span className="hidden md:inline">Learn about this page</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={`${video.title} — tutorial video`}>
          <button type="button" className="absolute inset-0 cursor-default" onClick={() => setOpen(false)} aria-label="Close video" tabIndex={-1} />
          <div className="relative w-full max-w-4xl animate-fade-in overflow-hidden rounded-2xl bg-surface shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-line/10 px-4 py-3">
              <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink">
                <FaYoutube className="shrink-0 text-lg text-red-600" aria-hidden />
                <span className="truncate">Learn about this page — {video.title}</span>
              </p>
              <div className="flex shrink-0 items-center gap-1">
                <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-line/10 hover:text-ink">
                  Open on YouTube
                </a>
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-subtle hover:bg-line/10" aria-label="Close">
                  <HiX size={20} />
                </button>
              </div>
            </div>
            <div className="relative aspect-video bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
                title={`${video.title} — tutorial`}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
