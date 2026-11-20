'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaChevronLeft, FaChevronRight, FaArrowRight } from 'react-icons/fa';
import { cn } from '@/lib/utils';
import { SHIMMER } from '@/lib/image';
import { isSlowConnection, prefersReducedMotion } from '@/lib/network';

const INTERVAL = 6000;

// Home page slider (Dashboard → Website Content → Home page): each photo fills the whole hero area, with a
// shade on the text side so the writing stays readable. `slide.position` keeps the people in view when the
// photo is cropped on narrow screens. Auto-plays (paused on hover / focus, and off for reduced-motion users and
// slow / data-saver connections); arrows, dots, ←/→ keys and swipe change slides.
// Only the current and the next photo are downloaded, so the first screen loads fast on slow internet.
export default function HeroSlider({ slides = [], buttons = {} }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [seen, setSeen] = useState(() => new Set([0]));
  const count = slides.length;
  const touchX = useRef(null);

  const go = useCallback(
    (next) => {
      const target = (next + count) % count;
      setSeen((s) => (s.has(target) ? s : new Set(s).add(target)));
      setIndex(target);
    },
    [count]
  );

  // Fetch the next photo in the background once the page has settled
  useEffect(() => {
    if (count < 2) return;
    const id = setTimeout(() => setSeen((s) => (s.has((index + 1) % count) ? s : new Set(s).add((index + 1) % count))), 2500);
    return () => clearTimeout(id);
  }, [index, count]);

  useEffect(() => {
    if (paused || count < 2 || prefersReducedMotion() || isSlowConnection()) return;
    const id = setTimeout(() => go(index + 1), INTERVAL);
    return () => clearTimeout(id);
  }, [index, paused, count, go]);

  if (!count) return null;

  return (
    <section
      className="relative isolate h-[580px] overflow-hidden bg-navy-950 sm:h-[600px] lg:h-[660px] 2xl:h-[720px]"
      aria-roledescription="carousel"
      aria-label="Highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') go(index - 1);
        if (e.key === 'ArrowRight') go(index + 1);
      }}
    >
      {slides.map((slide, i) => {
        const active = i === index;
        return (
          <div
            key={`${i}-${slide.image}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={!active}
            className={cn('absolute inset-0 transition-opacity duration-1000', active ? 'z-10 opacity-100' : 'pointer-events-none z-0 opacity-0')}
          >
            {seen.has(i) && slide.image && (
              <Image
                src={slide.image}
                alt={slide.alt || ''}
                fill
                sizes="100vw"
                quality={i === 0 ? 75 : 60}
                preload={i === 0}
                // The first photo is the biggest thing on the screen: fetch it before anything else
                fetchPriority={i === 0 ? 'high' : 'low'}
                loading={i === 0 ? 'eager' : 'lazy'}
                placeholder={SHIMMER}
                className={cn('object-cover', slide.position || 'object-center')}
              />
            )}
            {/* Shade: darker behind the text (left on desktop, bottom on phones) */}
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/95 via-navy-950/55 to-navy-950/10 md:bg-gradient-to-r md:from-navy-950/90 md:via-navy-950/50 md:to-transparent" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-navy-950/60 to-transparent" aria-hidden />

            <div className="container relative flex h-full max-w-7xl flex-col justify-end pb-36 sm:pb-40 md:justify-center md:pb-24 lg:pb-28 2xl:max-w-screen-2xl">
              <div className={cn('max-w-2xl transition-all delay-200 duration-700', active ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0')}>
                {slide.kicker && (
                  <p className="inline-flex items-center gap-2 rounded-full bg-gold-400/95 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-navy-950">
                    {slide.kicker}
                  </p>
                )}
                {i === 0 ? (
                  <h1 className="mt-4 text-balance font-display text-3xl leading-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl">{slide.title}</h1>
                ) : (
                  <p className="mt-4 text-balance font-display text-3xl font-bold leading-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl">{slide.title}</p>
                )}
                {slide.text && <p className="mt-4 max-w-xl text-base text-white/90 drop-shadow sm:text-lg">{slide.text}</p>}
                <div className="mt-7 flex flex-wrap gap-3">
                  {buttons.primaryLabel && buttons.primaryHref && (
                    <Link
                      href={buttons.primaryHref}
                      tabIndex={active ? undefined : -1}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 px-6 py-3 text-sm font-semibold text-navy-950 shadow-lg shadow-gold-500/30 transition hover:brightness-105 active:scale-[0.98]"
                    >
                      {buttons.primaryLabel} <FaArrowRight aria-hidden />
                    </Link>
                  )}
                  {buttons.secondaryLabel && buttons.secondaryHref && (
                    <Link
                      href={buttons.secondaryHref}
                      tabIndex={active ? undefined : -1}
                      className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 active:scale-[0.98]"
                    >
                      {buttons.secondaryLabel}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="absolute left-3 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-gold-400 hover:text-navy-950 lg:flex"
            aria-label="Previous slide"
          >
            <FaChevronLeft aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="absolute right-3 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-gold-400 hover:text-navy-950 lg:flex"
            aria-label="Next slide"
          >
            <FaChevronRight aria-hidden />
          </button>
          <div className="container absolute inset-x-0 bottom-[5.5rem] z-20 flex max-w-7xl gap-0.5 sm:bottom-[6.5rem] 2xl:max-w-screen-2xl">
            {slides.map((slide, i) => (
              // 24 px tap area around each small dot (easy to tap on phones)
              <button
                key={`${i}-${slide.image}`}
                type="button"
                onClick={() => go(i)}
                className="group flex h-6 min-w-6 items-center justify-center px-1"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
              >
                <span className={cn('block h-2.5 rounded-full transition-all', i === index ? 'w-8 bg-gold-400' : 'w-2.5 bg-white/60 group-hover:bg-white')} />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
