// Outgoing email over SMTP (Hostinger email, Gmail, Zoho …). The settings are edited in
// Dashboard → Settings → Email (src/server/services/email-settings.service.js); until saved there, the
// SMTP_* values in .env are used. Without settings nothing is sent and messages are still saved.
import nodemailer from 'nodemailer';
import { getEmailConfig, isReady } from '@/server/services/email-settings.service';

export { getEmailConfig };

// One reusable connection per set of SMTP details
let transport = { key: '', transporter: null };

function transporterFor(c) {
  const key = JSON.stringify([c.host, c.port, c.security, c.user, c.pass]);
  if (transport.key === key) return transport.transporter;
  const transporter = nodemailer.createTransport({
    host: c.host,
    port: Number(c.port),
    secure: c.security === 'ssl',
    requireTLS: c.security === 'starttls',
    auth: { user: c.user, pass: c.pass },
    // Fail fast instead of keeping a request open on a slow mail server
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  transport = { key, transporter };
  return transporter;
}

export async function isMailConfigured() {
  return isReady(await getEmailConfig());
}

// Header values must stay on one line
const oneLine = (v) => String(v ?? '').replace(/[\r\n]+/g, ' ').trim();

// Checks the login with the mail server without sending anything
export async function verifyMail(config) {
  await transporterFor(config).verify();
}

/**
 * Sends one email. `config` defaults to the saved settings (pass one to test unsaved settings).
 */
export async function sendMail({ to, subject, html, text, replyTo, fromName, config }) {
  const c = config || (await getEmailConfig());
  if (!isReady(c)) throw new Error('Email is not set up (Dashboard → Settings → Email).');
  const from = c.fromEmail || c.user;
  const name = oneLine(fromName || c.fromName);
  return transporterFor(c).sendMail({
    from: name ? { name, address: from } : from,
    to,
    subject: oneLine(subject).slice(0, 200),
    text,
    html,
    ...(replyTo && { replyTo: oneLine(replyTo) }),
  });
}

// ---------- templates ----------

export const escapeHtml = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

const nl2br = (v) => escapeHtml(v).replace(/\n/g, '<br>');

// Simple, table-based layout that renders in Gmail, Outlook and phone mail apps
export function layout({ school, heading, bodyHtml, footer }) {
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#334155">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#0a1c3d;padding:20px 24px;color:#ffffff;font-size:18px;font-weight:bold">${escapeHtml(school)}</td></tr>
<tr><td style="height:4px;background:#e8ad35"></td></tr>
<tr><td style="padding:24px"><h1 style="margin:0 0 16px;font-size:20px;color:#0a1c3d">${escapeHtml(heading)}</h1>${bodyHtml}</td></tr>
<tr><td style="padding:16px 24px;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.6">${footer}</td></tr>
</table></td></tr></table></body></html>`;
}

function messageTable(m) {
  const rows = [
    ['Name', m.fullName],
    ['Email', m.email],
    ['Phone', m.phone || '—'],
    ['Subject', m.subject || '—'],
  ];
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">
${rows.map(([k, v]) => `<tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;width:90px;color:#64748b">${k}</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#0f172a">${escapeHtml(v)}</td></tr>`).join('')}
</table>
<div style="background:#f8fafc;border-left:4px solid #126cb5;padding:12px 16px;font-size:14px;line-height:1.6;white-space:normal">${nl2br(m.message)}</div>`;
}

// Notification to the school office
export function contactAdminEmail(m, { school, dashboardUrl }) {
  const subject = `New message${m.subject ? `: ${m.subject}` : ''} — ${m.fullName}`;
  const bodyHtml = `<p style="margin:0 0 16px;font-size:14px">A new message was sent from the website contact form. Reply to this email to answer ${escapeHtml(m.fullName)} directly.</p>
${messageTable(m)}
<p style="margin:20px 0 0"><a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background:#126cb5;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px">Open in dashboard</a></p>`;
  const text = `New message from the website contact form\n\nName: ${m.fullName}\nEmail: ${m.email}\nPhone: ${m.phone || '-'}\nSubject: ${m.subject || '-'}\n\n${m.message}\n\nDashboard: ${dashboardUrl}`;
  return { subject, html: layout({ school, heading: 'New contact message', bodyHtml, footer: `Sent by the ${escapeHtml(school)} website.` }), text };
}

// Confirmation to the person who sent the message
export function contactConfirmationEmail(m, { school, subject, body, contact }) {
  const greeting = String(body || '').replaceAll('{{name}}', m.fullName);
  const contactLine = [contact.phones?.join(' / '), contact.email, contact.callingTime && `Calling time: ${contact.callingTime}`].filter(Boolean).join(' · ');
  const bodyHtml = `<p style="margin:0 0 16px;font-size:14px;line-height:1.7">${nl2br(greeting)}</p>
<p style="margin:0 0 8px;font-size:13px;color:#64748b">A copy of your message:</p>
${messageTable(m)}`;
  const text = `${greeting}\n\n— Your message —\n${m.subject ? `Subject: ${m.subject}\n` : ''}${m.message}\n\n${school}\n${contactLine}`;
  return {
    subject: subject || `We received your message — ${school}`,
    html: layout({ school, heading: 'Thank you for your message', bodyHtml, footer: `${escapeHtml(school)}<br>${escapeHtml(contactLine)}<br>${escapeHtml(contact.address || '')}` }),
    text,
  };
}

// Online admission application → the admin email(s) in Settings → Email
export function admissionAdminEmail(a, { school, dashboardUrl }) {
  const rows = [
    ['Student', a.studentName],
    ['Class', a.className],
    ['Father', a.fatherName],
    ['Mother', a.motherName],
    ['Mobile', a.mobile],
  ];
  const subject = `New admission application: ${a.studentName} (${a.className})`;
  const bodyHtml = `<p style="margin:0 0 16px;font-size:14px">A new online admission application was submitted on the website.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">
${rows.map(([k, v]) => `<tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;width:90px;color:#64748b">${k}</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#0f172a">${escapeHtml(v)}</td></tr>`).join('')}
</table>
<p style="margin:20px 0 0"><a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background:#126cb5;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px">Open in dashboard</a></p>`;
  const text = `New online admission application\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nDashboard: ${dashboardUrl}`;
  return { subject, html: layout({ school, heading: 'New admission application', bodyHtml, footer: `Sent by the ${escapeHtml(school)} website.` }), text };
}
