import { STAFF_ROLES } from '@/config/roles';
import { route, ok, created, readJson } from '@/server/http';
import * as content from '@/server/services/content.service';

export const dynamic = 'force-dynamic';

// GET (admins) — list of sessions · POST (admins) — { year, copyFrom? }
export const GET = route(async () => ok(await content.listSessions()), { roles: STAFF_ROLES });
export const POST = route(async ({ req }) => created(await content.createAcademicSession(await readJson(req)), 'Session created.'), { roles: STAFF_ROLES });
