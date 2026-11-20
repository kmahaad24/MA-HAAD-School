import { cn } from '@/lib/utils';

const COLORS = ['bg-primary-600', 'bg-amber-600', 'bg-green-600', 'bg-rose-600', 'bg-violet-600', 'bg-cyan-600'];

// Profile photo, or the person's initials on a colour picked from their name
export default function UserAvatar({ user, size = 'h-10 w-10 text-sm', className }) {
  const name = user?.name || user?.email || '?';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  const color = COLORS[[...name].reduce((n, ch) => n + ch.charCodeAt(0), 0) % COLORS.length];
  return (
    <span className={cn('relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white', !user?.avatar && color, size, className)}>
      {user?.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element -- small uploaded avatar
        <img src={user.avatar} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        initials
      )}
    </span>
  );
}
