import { STAFF_ROLES } from '@/config/roles';
import { route, ok } from '@/server/http';
import { resendEmails } from '@/server/services/contact.service';

export const dynamic = 'force-dynamic';

// POST /api/contact/:id/resend (admins) — try the notification and confirmation emails again
export const POST = route(async ({ params }) => ok(await resendEmails(params.id), 'Emails sent again.'), { roles: STAFF_ROLES });
