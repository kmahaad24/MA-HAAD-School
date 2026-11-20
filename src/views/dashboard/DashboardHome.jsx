'use client';
import Link from 'next/link';
import { FaUsers, FaCalendarDay, FaEnvelope, FaEnvelopeOpen, FaUserShield, FaGlobe, FaSignInAlt, FaEdit, FaBullhorn, FaCog } from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import useAuth from '@/hooks/useAuth';
import { canOpen } from '@/config/roles';
import { formatDate } from '@/lib/utils';
import PageTitle from '@/components/dashboard/PageTitle';
import StatCard, { StatGrid } from '@/components/dashboard/StatCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';

const QUICK_LINKS = [
  { href: '/dashboard/content', label: 'Edit website text, photos and menus', icon: FaEdit },
  { href: '/dashboard/notices', label: 'Publish a notice', icon: FaBullhorn },
  { href: '/dashboard/messages', label: 'Read contact requests', icon: FaEnvelope },
  { href: '/dashboard/traffic', label: 'See who is visiting the site', icon: FaGlobe },
  { href: '/dashboard/login-history', label: 'Check recent sign-ins', icon: FaSignInAlt },
  { href: '/dashboard/settings', label: 'Email, timezone and password', icon: FaCog },
];

export default function DashboardHome() {
  const { user } = useAuth();
  const stats = useApi('/stats', { select: (res) => res.data });
  const visitors = useApi('/visitor/stats', { select: (res) => res.stats });
  const s = stats.data;

  return (
    <>
      <PageTitle title={`Welcome, ${user?.name?.split(' ')[0] || 'admin'}`} description="Overview of your website." />

      <StatGrid>
        <StatCard label="Total visitors" value={visitors.data?.total} icon={FaUsers} loading={visitors.loading} />
        <StatCard label="Visitors today" value={visitors.data?.today} icon={FaCalendarDay} tone="green" loading={visitors.loading} />
        <StatCard label="Contact requests" value={s?.messages} hint={s ? `${s.unreadMessages} unread` : undefined} icon={FaEnvelope} tone="amber" loading={stats.loading} />
        <StatCard label="Dashboard users" value={s?.users} icon={FaUserShield} tone="red" loading={stats.loading} />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Quick actions">
          <ul className="divide-y divide-line/5">
            {QUICK_LINKS.filter((l) => canOpen(user?.role, l.href)).map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href} className="flex items-center gap-3 py-3 text-sm font-medium text-body hover:text-primary-600 dark:hover:text-primary-400">
                  <Icon className="text-faint" /> {label}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Latest contact requests" action={<Button href="/dashboard/messages" variant="ghost" size="sm">All requests</Button>}>
          {s?.recentMessages?.length ? (
            <ul className="divide-y divide-line/5">
              {s.recentMessages.map((m) => (
                <li key={m._id} className="py-3">
                  <Link href={`/dashboard/messages?open=${m._id}`} className="block rounded-lg hover:bg-line/5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-ink">{m.fullName}</p>
                    <span className="shrink-0 text-xs text-subtle">{formatDate(m.createdAt, true)}</span>
                  </div>
                  <span className="text-xs text-primary-600 dark:text-primary-400">{m.email}</span>
                  {m.subject && <p className="mt-1 text-sm text-body">{m.subject}</p>}
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted">{m.message}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={FaEnvelopeOpen} title={stats.loading ? 'Loading…' : 'No messages yet'} description="Messages sent from the Contact page appear here." />
          )}
        </Card>
      </div>
    </>
  );
}
