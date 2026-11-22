import { STAFF_ROLES } from '@/config/roles';
import { after } from 'next/server';
import { route, ok, created, readJson, HttpError } from '@/server/http';
import { getClientIp } from '@/lib/visitor';
import { isRateLimited } from '@/lib/rate-limit';
import { submitApplication, sendApplicationEmail, looksAutomated, listApplications } from '@/server/services/admission.service';

export const dynamic = 'force-dynamic';

const THANKS = 'Thank you! Your admission application has been received. The school office will call you soon.';

// POST /api/admissions (public) — the online admission form. Saved first; the admin email goes out after the reply.
export const POST = route(async ({ req }) => {
  const ip = getClientIp(req);
  if (isRateLimited(`admission:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 })) throw new HttpError(429, 'Too many applications. Please try again later.');
  const body = await readJson(req);
  if (looksAutomated(body)) return created(null, THANKS);

  const result = await submitApplication(body, { ip, userAgent: req.headers.get('user-agent') });
  if (result.duplicate) return ok(null, 'We already received this application — the school office will call you soon.');
  if (result.mail) after(() => sendApplicationEmail(result.application));
  return created(null, THANKS);
});

// GET /api/admissions?status=new&class=…&search=…&page=2 (staff) — Dashboard → Admission Applications
export const GET = route(
  async ({ query }) =>
    ok(await listApplications({ status: query.get('status') || '', className: query.get('class') || '', search: query.get('search') || '', page: query.get('page'), limit: query.get('limit') })),
  { roles: STAFF_ROLES }
);
