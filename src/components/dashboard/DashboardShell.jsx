'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HiMenuAlt2 } from 'react-icons/hi';
import { FaExternalLinkAlt } from 'react-icons/fa';
import useAuth from '@/hooks/useAuth';
import Skeleton from '@/components/ui/Skeleton';
import { DashboardSkeleton } from '@/components/loading/PageSkeletons';
import Logo from '@/components/layout/Logo';
import ThemeToggle from '@/components/layout/ThemeToggle';
import Sidebar from './Sidebar';
import DashboardSearch from './DashboardSearch';
import PageTutorial from './PageTutorial';
import { isStaff } from '@/config/roles';

export default function DashboardShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  // The proxy already blocks visitors; this covers a session that expired while the page was open.
  useEffect(() => {
    if (!loading && (!user || !isStaff(user.role))) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user || !isStaff(user.role)) {
    return (
      <div className="min-h-screen bg-canvas">
        <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line/10 bg-surface p-5 lg:block" aria-hidden>
          <Skeleton className="h-8 w-28" />
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="mt-5 h-5 w-40" />)}
        </aside>
        <div className="lg:pl-64">
          <div className="mx-auto max-w-[1600px] p-4 md:p-8">
            <DashboardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      <div className="lg:pl-64">
        {/* Top bar: search on every screen size; logo and menu button on phones */}
        <header className="sticky top-0 z-30 border-b border-line/10 bg-surface/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 md:px-8">
            <div className="lg:hidden">
              <Logo />
            </div>
            <DashboardSearch className="ml-auto lg:ml-0 lg:max-w-xl lg:flex-1" />
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <PageTutorial />
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-line/5 hover:text-ink sm:inline-flex"
              >
                <FaExternalLinkAlt className="text-xs" aria-hidden /> View website
              </a>
              <div className="lg:hidden">
                <ThemeToggle />
              </div>
              <button type="button" onClick={() => setSidebarOpen(true)} className="rounded p-2 text-body hover:bg-line/10 lg:hidden" aria-label="Open menu">
                <HiMenuAlt2 size={22} />
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
