// Dashboard roles. Plain data (no imports) so it works in the browser, the server and the node scripts.
//   admin  — everything, including users, settings and security logs
//   editor — website content, notices, gallery, staff, sessions and contact requests
export const ROLES = ['admin', 'editor'];

export const ROLE_INFO = {
  admin: { label: 'Admin', description: 'Full access, including users, settings and security logs.' },
  editor: { label: 'Editor', description: 'Edits the website, notices, gallery, staff and reads contact requests. No users, settings or logs.' },
};

// Roles that may use the dashboard at all
export const STAFF_ROLES = ROLES;
// Admin-only areas
export const ADMIN_ONLY = ['admin'];

// Dashboard pages only admins can open (editors don't see them in the menu either)
const ADMIN_PATHS = ['/dashboard/users', '/dashboard/settings', '/dashboard/login-history', '/dashboard/activity', '/dashboard/traffic'];

export const isStaff = (role) => STAFF_ROLES.includes(role);

export function canOpen(role, pathname) {
  if (!isStaff(role)) return false;
  if (role === 'admin') return true;
  return !ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
