import { PublicPageSkeleton } from '@/components/loading/PageSkeletons';

// Shown instantly while a public page loads — the visitor sees the page shape instead of a blank screen
export default function Loading() {
  return <PublicPageSkeleton />;
}
