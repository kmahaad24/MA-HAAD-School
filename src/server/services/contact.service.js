// Contact-form messages: saving a new message (public), emailing the school + the sender, and the
// Dashboard → Messages inbox (list, status, notes, delete).
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import ContactMessage, { CONTACT_STATUSES } from '@/models/ContactMessage';
import { findRecentDuplicate } from '@/lib/dedupe-guard';
import { escapeRegex } from '@/lib/utils';
import { siteUrl } from '@/lib/seo';
import { HttpError } from '@/server/http';
import { str, toPlain } from '@/server/validate';
import { getContents } from '@/server/services/site-content.service';
import { isMailConfigured, getEmailConfig, sendMail, contactAdminEmail, contactConfirmationEmail } from '@/server/mail';
import { isReady } from '@/server/services/email-settings.service';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-\s]{6,30}$/;
// Links in a message are the classic spam sign; real enquiries rarely contain more than two
const TOO_MANY_LINKS = /(https?:\/\/.*){3,}/is;
const MIN_FILL_MS = 3000;

// ---------- public ----------

function cleanSubmission(body) {
  const data = {
    fullName: str(body.fullName, 120).replace(/\s+/g, ' '),
    email: str(body.email, 160).toLowerCase(),
    phone: str(body.phone, 30),
    subject: str(body.subject, 200).replace(/\s+/g, ' '),
    message: str(body.message, 5000),
  };
  if (data.fullName.length < 2) throw new HttpError(400, 'Please write your name.');
  if (!EMAIL_RE.test(data.email)) throw new HttpError(400, 'Please enter a valid email address.');
  if (data.phone && !PHONE_RE.test(data.phone)) throw new HttpError(400, 'Please enter a valid phone number.');
  if (data.message.length < 10) throw new HttpError(400, 'Please write a little more in your message (at least 10 characters).');
  return data;
}

// Bots fill the hidden "website" field or submit within a split second; they get a normal-looking
// reply but nothing is saved or emailed.
export function looksAutomated(body) {
  if (str(body.website, 200)) return true;
  const started = Number(body.startedAt);
  if (Number.isFinite(started) && started > 0 && Date.now() - started < MIN_FILL_MS) return true;
  return TOO_MANY_LINKS.test(String(body.message || ''));
}

export async function submitMessage(body, meta = {}) {
  const data = cleanSubmission(body);
  await connectDB();
  if (await findRecentDuplicate(ContactMessage, { email: data.email, message: data.message })) return { duplicate: true };
  const config = await getEmailConfig();
  const ready = isReady(config);
  const toSchool = ready && config.notifyAdmin && config.adminEmails.length > 0;
  const toSender = ready && config.sendConfirmation;
  const doc = await ContactMessage.create({
    ...data,
    ip: str(meta.ip, 64),
    userAgent: str(meta.userAgent, 400),
    page: str(meta.page, 200),
    emailAdmin: toSchool ? 'pending' : 'off',
    emailSender: toSender ? 'pending' : 'off',
  });
  return { message: toPlain(doc), mail: toSchool || toSender, confirmation: toSender };
}

// Runs after the reply has been sent (next/server `after`), so the visitor never waits for the mail server.
// Who gets what is set in Dashboard → Settings → Email.
export async function sendMessageEmails(message) {
  const config = await getEmailConfig();
  if (!isReady(config)) return;
  const { general, contact } = await getContents('general', 'contact');
  const school = general.identity.name;
  const admins = config.notifyAdmin ? config.adminEmails : [];
  const update = {};
  const errors = [];

  if (admins.length) {
    try {
      const mail = contactAdminEmail(message, { school, dashboardUrl: `${siteUrl()}/dashboard/messages?open=${message._id}` });
      await sendMail({ to: admins, replyTo: `"${message.fullName.replace(/"/g, '')}" <${message.email}>`, ...mail });
      update.emailAdmin = 'sent';
    } catch (error) {
      update.emailAdmin = 'failed';
      errors.push(`school: ${error.message}`);
    }
  }

  if (config.sendConfirmation) {
    try {
      const mail = contactConfirmationEmail(message, { school, subject: contact.email.subject, body: contact.email.body, contact: general.contact });
      await sendMail({ to: message.email, replyTo: general.contact.email || undefined, fromName: config.fromName || school, ...mail });
      update.emailSender = 'sent';
    } catch (error) {
      update.emailSender = 'failed';
      errors.push(`sender: ${error.message}`);
    }
  }

  if (errors.length) console.error('Contact email failed:', errors.join(' | '));
  try {
    await connectDB();
    await ContactMessage.updateOne({ _id: message._id }, { $set: { ...update, emailError: errors.join(' | ').slice(0, 500) } });
  } catch {
    /* logging only */
  }
}

// ---------- dashboard ----------

const validId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, 'Message not found.');
  return id;
};

// Tab (status) + search, shared by the inbox list and the Excel / PDF export
function inboxFilter({ status = '', search = '' } = {}) {
  const filter = {};
  if (CONTACT_STATUSES.includes(status)) filter.status = status;
  else if (status !== 'all') filter.status = { $ne: 'archived' };
  const q = str(search, 100);
  if (q) {
    const re = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ fullName: re }, { email: re }, { phone: re }, { subject: re }, { message: re }];
  }
  return filter;
}

export const EXPORT_LIMIT = 5000;

// Every request matching the current tab and search (newest first) for Excel / PDF download
export async function exportMessages({ status = '', search = '' } = {}) {
  await connectDB();
  const items = await ContactMessage.find(inboxFilter({ status, search }))
    .select('fullName email phone subject message status note createdAt repliedAt')
    .sort({ createdAt: -1 })
    .limit(EXPORT_LIMIT)
    .lean();
  return toPlain(items);
}

export async function listMessages({ status = '', search = '', page = 1, limit = 20 } = {}) {
  await connectDB();
  const filter = inboxFilter({ status, search });
  const size = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const total = await ContactMessage.countDocuments(filter);
  const pages = Math.max(Math.ceil(total / size), 1);
  const current = Math.min(Math.max(Number(page) || 1, 1), pages);
  const [items, counts] = await Promise.all([
    ContactMessage.find(filter).select('-userAgent').sort({ createdAt: -1 }).skip((current - 1) * size).limit(size).lean(),
    ContactMessage.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  return toPlain({
    items,
    total,
    page: current,
    pages,
    counts: Object.fromEntries(CONTACT_STATUSES.map((s) => [s, counts.find((c) => c._id === s)?.count || 0])),
    mail: await isMailConfigured(),
  });
}

export async function getMessage(id) {
  await connectDB();
  const doc = await ContactMessage.findById(validId(id)).lean();
  if (!doc) throw new HttpError(404, 'Message not found.');
  return toPlain(doc);
}

export async function updateMessage(id, input = {}) {
  await connectDB();
  const doc = await ContactMessage.findById(validId(id));
  if (!doc) throw new HttpError(404, 'Message not found.');
  if ('status' in input) {
    if (!CONTACT_STATUSES.includes(input.status)) throw new HttpError(400, 'Unknown status.');
    doc.status = input.status;
    if (input.status === 'replied' && !doc.repliedAt) doc.repliedAt = new Date();
  }
  if ('note' in input) doc.note = str(input.note, 2000);
  await doc.save();
  return toPlain({ ...doc.toObject(), title: doc.fullName });
}

export async function removeMessage(id) {
  await connectDB();
  const doc = await ContactMessage.findByIdAndDelete(validId(id)).lean();
  if (!doc) throw new HttpError(404, 'Message not found.');
  return toPlain({ _id: doc._id, fullName: doc.fullName });
}

// Sends the emails again for a message whose email failed
export async function resendEmails(id) {
  if (!(await isMailConfigured())) throw new HttpError(400, 'Email is not set up. Turn it on in Settings → Email.');
  const message = await getMessage(id);
  await sendMessageEmails(message);
  return getMessage(id);
}
