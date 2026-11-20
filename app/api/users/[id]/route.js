import { route, ok, readJson } from '@/server/http';
import { ADMIN_ONLY } from '@/config/roles';
import { updateUser, removeUser } from '@/server/services/user.service';

export const dynamic = 'force-dynamic';

// One account (admins): PATCH { name?, email?, role?, status?, password? (reset) } · DELETE
export const PATCH = route(async ({ req, params, session }) => ok(await updateUser(params.id, await readJson(req), { by: session._id }), 'Saved.'), { roles: ADMIN_ONLY });
export const DELETE = route(async ({ params, session }) => ok(await removeUser(params.id, { by: session._id }), 'User deleted.'), { roles: ADMIN_ONLY });
