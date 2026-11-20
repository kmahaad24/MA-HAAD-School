import { STAFF_ROLES } from '@/config/roles';
import { route, ok, readJson } from '@/server/http';
import { getMessage, updateMessage, removeMessage } from '@/server/services/contact.service';

export const dynamic = 'force-dynamic';

// One message (admins): GET · PATCH { status?, note? } · DELETE
export const GET = route(async ({ params }) => ok(await getMessage(params.id)), { roles: STAFF_ROLES });
export const PATCH = route(async ({ req, params }) => ok(await updateMessage(params.id, await readJson(req)), 'Saved.'), { roles: STAFF_ROLES });
export const DELETE = route(async ({ params }) => ok(await removeMessage(params.id), 'Message deleted.'), { roles: STAFF_ROLES });
