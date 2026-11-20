import { STAFF_ROLES } from '@/config/roles';
import { route, ok } from '@/server/http';
import { listSections } from '@/server/services/site-content.service';

export const dynamic = 'force-dynamic';

// GET /api/content (admins) — the editable sections and when each was last saved
export const GET = route(async () => ok(await listSections()), { roles: STAFF_ROLES });
