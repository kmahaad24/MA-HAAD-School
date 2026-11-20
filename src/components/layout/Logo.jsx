'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useSite } from '@/providers/SiteProvider';
import { cn } from '@/lib/utils';

// School logo (Dashboard → Website Content → School information). `size` sets the height; the width follows
// the logo's shape. variant="card" puts it on a white rounded card for dark backgrounds (footer).
const SIZES = {
  sm: 'h-9',
  md: 'h-11',
  lg: 'h-12 sm:h-14 lg:h-16',
};

export default function Logo({ size = 'md', variant, className = '', preload = false }) {
  const { general } = useSite();
  const { name } = general.identity;
  const logo = general.branding.logo;
  return (
    <Link
      href="/"
      aria-label={`${name} — home`}
      className={cn('inline-flex shrink-0 items-center', variant === 'card' && 'rounded-xl bg-white px-3 py-2 shadow-sm', className)}
    >
      {logo ? (
        <Image src={logo} alt={name} width={1200} height={370} preload={preload} sizes="(min-width: 1024px) 220px, 180px" className={cn('w-auto', SIZES[size] || size)} />
      ) : (
        <span className="font-display text-xl font-bold text-navy-900">{name}</span>
      )}
    </Link>
  );
}
