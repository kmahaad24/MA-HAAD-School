// Where to send someone after they sign in.
// `from` must be a path on this site (never another domain), and only admins may return to /dashboard.
import { canOpen } from '@/config/roles';

export function safeRedirect(from, role, fallback) {
  if (!from || typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//') || from.startsWith('/\\')) return fallback;
  if (from.startsWith('/dashboard') && !canOpen(role, from.split('?')[0])) return fallback;
  if (from.startsWith('/login')) return fallback;
  return from;
}
