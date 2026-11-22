import { STAFF_ROLES } from '@/config/roles';
import { route, ok } from '@/server/http';
import { resendApplicationEmail } from '@/server/services/admission.service';

export const dynamic = 'force-dynamic';

// POST (staff) — sends the admin email again for an application whose email failed
export const POST = route(async ({ params }) => ok(await resendApplicationEmail(params.id), 'Email sent again.'), { roles: STAFF_ROLES });
