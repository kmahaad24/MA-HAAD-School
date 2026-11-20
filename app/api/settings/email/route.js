import { route, ok, readJson } from '@/server/http';
import { ADMIN_ONLY } from '@/config/roles';
import { getEmailSettings, updateEmailSettings, resetEmailSettings } from '@/server/services/email-settings.service';

export const dynamic = 'force-dynamic';

// Dashboard → Settings → Email (admins). The SMTP password is never sent back.
export const GET = route(async () => ok(await getEmailSettings()), { roles: ADMIN_ONLY });
export const PUT = route(async ({ req, session }) => ok(await updateEmailSettings(await readJson(req), { userId: session._id }), 'Email settings saved.'), { roles: ADMIN_ONLY });
export const DELETE = route(async () => ok(await resetEmailSettings(), 'Email settings cleared — the .env values are used again.'), { roles: ADMIN_ONLY });
