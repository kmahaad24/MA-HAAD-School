import { route, ok, HttpError } from '@/server/http';
import { STAFF_ROLES } from '@/config/roles';
import { isRateLimited } from '@/lib/rate-limit';
import { searchDashboard } from '@/server/services/search.service';

export const dynamic = 'force-dynamic';

// GET /api/search?q=… (admins and editors) — records for the dashboard search box. Users only for admins.
export const GET = route(
  async ({ query, session }) => {
    if (isRateLimited(`search:${session._id}`, { limit: 120, windowMs: 60 * 1000 })) throw new HttpError(429, 'Too many searches — wait a moment.');
    return ok(await searchDashboard(query.get('q') || '', { role: session.role }));
  },
  { roles: STAFF_ROLES }
);
