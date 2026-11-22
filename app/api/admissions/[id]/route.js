import { STAFF_ROLES } from '@/config/roles';
import { route, ok, readJson } from '@/server/http';
import { getApplication, updateApplication, removeApplication } from '@/server/services/admission.service';

export const dynamic = 'force-dynamic';

// One application (staff): GET · PATCH { status?, note? } · DELETE
export const GET = route(async ({ params }) => ok(await getApplication(params.id)), { roles: STAFF_ROLES });
export const PATCH = route(async ({ req, params }) => ok(await updateApplication(params.id, await readJson(req)), 'Saved.'), { roles: STAFF_ROLES });
export const DELETE = route(async ({ params }) => ok(await removeApplication(params.id), 'Application deleted.'), { roles: STAFF_ROLES });
