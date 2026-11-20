// Page-shaped placeholders shown by app/**/loading.jsx and the dashboard while data loads.
import Skeleton, { LoadingLabel, SkeletonText } from '@/components/ui/Skeleton';

// Dark page banner skeleton
export function HeaderSkeleton({ children, withTitle = true }) {
  return (
    <header className="relative overflow-hidden border-b border-line/10 bg-canvas-2">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(220,38,38,0.12),transparent_60%)]" />
      <div className="container relative max-w-7xl py-10 md:py-14 2xl:max-w-screen-2xl">
        <Skeleton className="mb-5 h-3.5 w-40" />
        {withTitle && (
          <>
            <Skeleton className="h-9 w-72 max-w-full" />
            <span className="mt-3 block h-1 w-16 rounded-full bg-gradient-to-r from-brand-600/50 to-gold-400/50" />
            <SkeletonText lines={2} className="mt-5 max-w-2xl" />
          </>
        )}
        {children}
      </div>
    </header>
  );
}

// Dashboard page content (inside the dashboard shell)
export function DashboardSkeleton() {
  return (
    <div aria-busy="true">
      <LoadingLabel>Loading dashboard…</LoadingLabel>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-32" rounded="rounded-lg" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-xl border border-line/10 bg-surface p-4 sm:p-5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-3 h-7 w-14" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-line/10 bg-surface">
        <div className="flex gap-3 border-b border-line/10 p-4">
          <Skeleton className="h-9 flex-1" rounded="rounded-lg" />
          <Skeleton className="hidden h-9 w-36 sm:block" rounded="rounded-lg" />
        </div>
        <TableRowsSkeleton />
      </div>
    </div>
  );
}

// Rows for DataTable / lists
export function TableRowsSkeleton({ rows = 6, cols = 4 }) {
  return (
    <div aria-busy="true" className="divide-y divide-line/5">
      <LoadingLabel>Loading records…</LoadingLabel>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="h-9 w-9 shrink-0" rounded="rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          {Array.from({ length: cols - 1 }, (_, c) => <Skeleton key={c} className="hidden h-3.5 w-20 md:block" />)}
        </div>
      ))}
    </div>
  );
}

// Form-style editors (dashboard)
export function FormSkeleton({ cards = 2 }) {
  return (
    <div aria-busy="true" className="space-y-6">
      <LoadingLabel>Loading…</LoadingLabel>
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="rounded-xl border border-line/10 bg-surface p-5">
          <Skeleton className="mb-5 h-5 w-40" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, j) => (
              <div key={j} className="space-y-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-10 w-full" rounded="rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Public website: banner + content cards, shown instantly while a page loads (app/loading.jsx)
export function PublicPageSkeleton() {
  return (
    <div aria-busy="true">
      <LoadingLabel>Loading page…</LoadingLabel>
      <div className="relative overflow-hidden bg-navy-900">
        <div className="container max-w-7xl py-12 md:py-16 lg:py-20 2xl:max-w-screen-2xl">
          <span className="block h-10 w-2/3 max-w-md animate-pulse rounded-lg bg-white/10 md:h-12" />
          <span className="mt-4 block h-4 w-1/2 max-w-sm animate-pulse rounded bg-white/10" />
          <span className="mt-6 block h-3.5 w-40 animate-pulse rounded bg-white/10" />
        </div>
        <span className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-gold-400 via-gold-300 to-gold-500" />
      </div>
      <div className="container max-w-7xl py-14 2xl:max-w-screen-2xl">
        <span className="mx-auto block h-6 w-28 rounded-full skeleton-shimmer" />
        <span className="mx-auto mt-4 block h-8 w-72 max-w-full rounded-lg skeleton-shimmer" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <span className="block aspect-[16/10] skeleton-shimmer" />
              <div className="space-y-3 p-6">
                <span className="block h-5 w-2/3 rounded skeleton-shimmer" />
                <span className="block h-3.5 w-full rounded skeleton-shimmer" />
                <span className="block h-3.5 w-4/5 rounded skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
