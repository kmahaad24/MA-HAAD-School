'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { usePathname, useRouter } from 'next/navigation';
import { HiX } from 'react-icons/hi';
import { CiLogout } from 'react-icons/ci';
import { dashboardNav } from '@/config/navigation';
import { canOpen, ROLE_INFO } from '@/config/roles';
import useAuth from '@/hooks/useAuth';
import { apiSecure } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import Logo from '@/components/layout/Logo';
import ThemeToggle from '@/components/layout/ThemeToggle';
import UserAvatar from './UserAvatar';

// Count for a menu badge (unread contact requests, new admission applications) — refreshed on every page change
function useCount(pathname, url, pick) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let active = true;
    apiSecure
      .get(url)
      .then((res) => active && setCount(pick(res.data.data) || 0))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pathname, url, pick]);
  return count;
}

const pickUnread = (d) => d?.counts?.unread;
const pickNew = (d) => d?.counts?.new;

export default function Sidebar({ onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logOut, user } = useAuth();
  const badges = {
    unreadMessages: useCount(pathname, '/contact?status=unread&limit=1', pickUnread),
    newApplications: useCount(pathname, '/admissions?status=new&limit=1', pickNew),
  };

  const handleLogout = async () => {
    await logOut().catch(() => {});
    router.push('/login');
  };

  // Editors only see the pages they can open
  const groups = dashboardNav.map((g) => ({ ...g, items: g.items.filter((i) => canOpen(user?.role, i.href)) })).filter((g) => g.items.length);

  return (
    <div className="flex h-full w-64 flex-col border-r border-line/10 bg-surface">
      <div className="flex h-16 items-center justify-between border-b border-line/10 px-5">
        <Logo />
        <button type="button" onClick={onClose} className="rounded p-1 text-subtle hover:bg-line/10 lg:hidden" aria-label="Close menu">
          <HiX size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-faint">{group.title}</p>
            <ul className="space-y-1">
              {group.items.map(({ label, href, icon: Icon, external, badge }) => {
                const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
                const count = badge ? badges[badge] : 0;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onClose}
                      {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300' : 'text-muted hover:bg-line/5 hover:text-ink'
                      )}
                    >
                      {Icon && <Icon className="text-lg" />}
                      <span className="flex-1">{label}</span>
                      {count > 0 && <span className="rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{count > 99 ? '99+' : count}</span>}
                      {external && <FaExternalLinkAlt className="text-[10px] opacity-60" aria-label="opens in a new tab" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line/10 p-4">
        {user && (
          <Link href="/dashboard/profile" onClick={onClose} className="mb-3 flex items-center gap-3 rounded-lg p-1.5 hover:bg-line/5">
            <UserAvatar user={user} size="h-9 w-9 text-xs" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink">{user.name}</span>
              <span className="block truncate text-xs text-subtle">{ROLE_INFO[user.role]?.label || user.role} · {user.email}</span>
            </span>
          </Link>
        )}
        <ThemeToggle variant="row" className="mb-2" />
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-line/10 px-3 py-2 text-sm font-medium text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
        >
          <CiLogout className="text-lg" /> Log out
        </button>
      </div>
    </div>
  );
}
