import { STAFF_ROLES } from '@/config/roles';
import { route, ok, readJson } from '@/server/http';
import { readSection, updateSection, resetSection } from '@/server/services/site-content.service';

export const dynamic = 'force-dynamic';

// GET /api/content/home · PUT (save the whole section) · DELETE (back to the built-in text) — admins only
export const GET = route(async ({ params }) => ok(await readSection(params.key)), { roles: STAFF_ROLES });
export const PUT = route(async ({ req, params, session }) => ok(await updateSection(params.key, await readJson(req), { userId: session._id }), 'Saved — the website is updated.'), {
  roles: STAFF_ROLES,
});
export const DELETE = route(async ({ params }) => ok(await resetSection(params.key), 'Restored the original text.'), { roles: STAFF_ROLES });
