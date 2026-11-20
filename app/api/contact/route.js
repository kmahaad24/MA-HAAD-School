import { STAFF_ROLES } from '@/config/roles';
import { after } from 'next/server';
import { route, ok, created, readJson, HttpError } from '@/server/http';
import { getClientIp } from '@/lib/visitor';
import { isRateLimited } from '@/lib/rate-limit';
import { getContent } from '@/server/services/site-content.service';
import { submitMessage, sendMessageEmails, looksAutomated, listMessages } from '@/server/services/contact.service';

export const dynamic = 'force-dynamic';

// POST /api/contact (public) — the Contact page form. The message is saved first; the email to the school
// and the confirmation to the sender go out after the reply, so a slow mail server never delays the visitor.
export const POST = route(async ({ req }) => {
  const ip = getClientIp(req);
  if (isRateLimited(`contact:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 })) throw new HttpError(429, 'Too many messages. Please try again later.');
  const body = await readJson(req);
  const { form } = await getContent('contact');
  if (looksAutomated(body)) return created(null, form.successText);

  const result = await submitMessage(body, { ip, userAgent: req.headers.get('user-agent'), page: req.headers.get('referer') });
  if (result.duplicate) return ok(null, 'We already received your message — we will get back to you soon.');
  if (result.mail) after(() => sendMessageEmails(result.message));
  return created(null, result.confirmation ? form.successText : 'Thank you! Your message has been sent. We will get back to you soon.');
});

// GET /api/contact?status=unread&search=…&page=2 (admins) — Dashboard → Messages
export const GET = route(
  async ({ query }) => ok(await listMessages({ status: query.get('status') || '', search: query.get('search') || '', page: query.get('page'), limit: query.get('limit') })),
  { roles: STAFF_ROLES }
);
