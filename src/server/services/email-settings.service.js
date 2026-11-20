// Email (SMTP) settings edited in Dashboard → Settings → Email.
// Saved in the Setting collection (key 'email'); the SMTP password is encrypted (AES-256-GCM) with a key made
// from EMAIL_SECRET (or JWT_SECRET). Until something is saved, the SMTP_* values in .env are used.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import connectDB from '@/lib/db';
import Setting from '@/models/Setting';
import { HttpError } from '@/server/http';
import { str } from '@/server/validate';
import { cached, invalidate } from '@/server/cache';

const KEY = 'email';
const CACHE_KEY = 'settings:email';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HOST_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;
export const SECURITY = ['ssl', 'starttls', 'none'];

// ---------- password encryption ----------

const secretKey = () => createHash('sha256').update(`${process.env.EMAIL_SECRET || process.env.JWT_SECRET || ''}:smtp-password`).digest();

function encrypt(plain) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', secretKey(), iv);
  const data = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), data.toString('base64')].join(':');
}

function decrypt(stored) {
  if (!stored) return '';
  try {
    const [, iv, tag, data] = stored.split(':');
    const decipher = createDecipheriv('aes-256-gcm', secretKey(), Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    // JWT_SECRET / EMAIL_SECRET changed — the password has to be entered again
    return '';
  }
}

// ---------- reading ----------

const list = (value) =>
  (Array.isArray(value) ? value : String(value || '').split(/[,;\s]+/))
    .map((e) => str(e, 160).toLowerCase())
    .filter(Boolean);

function fromEnv() {
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465;
  return {
    enabled: Boolean(process.env.SMTP_HOST),
    host: process.env.SMTP_HOST || '',
    port,
    security: secure ? 'ssl' : 'starttls',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    fromEmail: process.env.MAIL_FROM || process.env.SMTP_USER || '',
    fromName: process.env.MAIL_FROM_NAME || '',
    adminEmails: list(process.env.ADMIN_EMAIL),
    notifyAdmin: true,
    sendConfirmation: true,
  };
}

async function loadSaved() {
  await connectDB();
  const doc = await Setting.findOne({ key: KEY }).lean();
  return doc ? { ...doc.value, updatedAt: doc.updatedAt } : null;
}

// Full configuration used to send email (with the password) — cached 60 s, cleared on save
export function getEmailConfig() {
  return cached(CACHE_KEY, async () => {
    const saved = await loadSaved().catch(() => null);
    if (saved) return { ...saved, pass: decrypt(saved.passEncrypted), passEncrypted: undefined, source: 'dashboard' };
    const env = fromEnv();
    return { ...env, source: env.host ? 'env' : 'none' };
  });
}

export const isReady = (c) => Boolean(c?.enabled && c.host && c.user && c.pass && (c.fromEmail || c.user));

// For the dashboard form — never returns the password
export async function getEmailSettings() {
  const c = await getEmailConfig();
  const { pass, ...rest } = c;
  return { ...rest, hasPassword: Boolean(pass), ready: isReady(c) };
}

// ---------- saving ----------

// Cleans the form. An empty password keeps the saved one.
export function cleanEmailSettings(input = {}, current = {}) {
  const host = str(input.host, 200).toLowerCase();
  const enabled = Boolean(input.enabled);
  if (enabled && !HOST_RE.test(host)) throw new HttpError(400, 'Enter the mail server address, e.g. smtp.hostinger.com');
  const port = Number(input.port);
  if (enabled && !(Number.isInteger(port) && port > 0 && port < 65536)) throw new HttpError(400, 'Enter a valid port (usually 465 or 587).');
  const security = SECURITY.includes(input.security) ? input.security : 'ssl';
  const user = str(input.user, 160);
  const fromEmail = str(input.fromEmail, 160).toLowerCase();
  if (fromEmail && !EMAIL_RE.test(fromEmail)) throw new HttpError(400, '“Send from” must be an email address.');
  const adminEmails = list(input.adminEmails).slice(0, 10);
  const bad = adminEmails.find((e) => !EMAIL_RE.test(e));
  if (bad) throw new HttpError(400, `“${bad}” is not a valid email address.`);
  const pass = typeof input.pass === 'string' && input.pass ? input.pass.slice(0, 300) : current.pass || '';
  if (enabled && (!user || !pass)) throw new HttpError(400, 'Enter the email account (username) and its password.');
  return {
    enabled,
    host,
    port: port || 465,
    security,
    user,
    pass,
    fromEmail,
    fromName: str(input.fromName, 120).replace(/[\r\n"]/g, ''),
    adminEmails,
    notifyAdmin: input.notifyAdmin !== false,
    sendConfirmation: input.sendConfirmation !== false,
  };
}

export async function updateEmailSettings(input, { userId } = {}) {
  const current = await getEmailConfig();
  const { pass, ...value } = cleanEmailSettings(input, current);
  await connectDB();
  await Setting.updateOne({ key: KEY }, { $set: { value: { ...value, passEncrypted: pass ? encrypt(pass) : '' }, updatedBy: userId } }, { upsert: true });
  invalidate(CACHE_KEY);
  return { ...(await getEmailSettings()), title: 'email settings' };
}

// Back to the .env values
export async function resetEmailSettings() {
  await connectDB();
  await Setting.deleteOne({ key: KEY });
  invalidate(CACHE_KEY);
  return { ...(await getEmailSettings()), title: 'email settings' };
}
