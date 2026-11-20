import { route, ok, readJson, HttpError } from '@/server/http';
import { ADMIN_ONLY } from '@/config/roles';
import { isRateLimited } from '@/lib/rate-limit';
import { getContent } from '@/server/services/site-content.service';
import { getEmailConfig, cleanEmailSettings } from '@/server/services/email-settings.service';
import { sendMail, verifyMail, layout } from '@/server/mail';

export const dynamic = 'force-dynamic';

// POST { settings?, to? } (admins) — connects to the mail server and sends a test email.
// `settings` lets the form be tested before saving; an empty password uses the saved one.
export const POST = route(
  async ({ req, session }) => {
    if (isRateLimited(`test-email:${session._id}`, { limit: 6, windowMs: 10 * 60 * 1000 })) throw new HttpError(429, 'Please wait a few minutes before sending another test.');
    const body = await readJson(req).catch(() => ({}));
    const saved = await getEmailConfig();
    const config = body.settings ? cleanEmailSettings({ ...body.settings, enabled: true }, saved) : saved;
    if (!config.host || !config.user || !config.pass) throw new HttpError(400, 'Fill in the mail server, email account and password first.');
    const to = String(body.to || config.adminEmails?.[0] || session.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw new HttpError(400, 'Enter a valid email address to send the test to.');

    try {
      await verifyMail(config);
    } catch (error) {
      throw new HttpError(502, `Could not sign in to the mail server: ${error.message}`);
    }
    const school = (await getContent('general')).identity.name;
    try {
      await sendMail({
        config: { ...config, enabled: true },
        to,
        subject: `Test email — ${school}`,
        text: 'Email is working. Contact-form messages and confirmations will be delivered.',
        html: layout({ school, heading: 'Email is working', bodyHtml: '<p style="font-size:14px">This is a test from the website dashboard. Contact-form messages and confirmations will be delivered.</p>', footer: 'Sent from Dashboard → Settings → Email.' }),
      });
    } catch (error) {
      throw new HttpError(502, `The mail server refused the email: ${error.message}`);
    }
    return ok({ to, title: `test email to ${to}` }, `Test email sent to ${to}. Check the inbox (and spam folder).`);
  },
  { roles: ADMIN_ONLY }
);
