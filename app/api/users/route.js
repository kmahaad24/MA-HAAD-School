import { route, ok, created, readJson } from '@/server/http';
import { ADMIN_ONLY } from '@/config/roles';
import { listUsers, createUser } from '@/server/services/user.service';

export const dynamic = 'force-dynamic';

// Dashboard → Users (admins): GET ?search=&role=&status= · POST { name, email, password, role, phone?, designation? }
export const GET = route(async ({ query }) => ok(await listUsers({ search: query.get('search') || '', role: query.get('role') || '', status: query.get('status') || '' })), { roles: ADMIN_ONLY });
export const POST = route(async ({ req, session }) => created(await createUser(await readJson(req), { by: session._id }), 'User added.'), { roles: ADMIN_ONLY });
