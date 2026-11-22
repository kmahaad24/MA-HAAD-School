// Online admission: saving a new application (public), emailing the admin address(es), and the
// Dashboard → Admission Applications list (status, notes, delete).
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import AdmissionApplication, { ADMISSION_STATUSES } from '@/models/AdmissionApplication';
import { findRecentDuplicate } from '@/lib/dedupe-guard';
import { escapeRegex } from '@/lib/utils';
import { siteUrl } from '@/lib/seo';
import { HttpError } from '@/server/http';
import { str, toPlain } from '@/server/validate';
import { getContents } from '@/server/services/site-content.service';
import { isMailConfigured, getEmailConfig, sendMail, admissionAdminEmail } from '@/server/mail';
import { isReady } from '@/server/services/email-settings.service';
import { programs } from '@/data/school';

// Bangladeshi mobile (01XXXXXXXXX, optional +88 / 88) or any reasonable phone number
const MOBILE_RE = /^[0-9+()\-\s]{10,20}$/;
const MIN_FILL_MS = 3000;
const name = (v) => str(v, 120).replace(/\s+/g, ' ');

// Classes offered = the classes of every programme in Website Content → Admission
export async function admissionClasses() {
  const { admission } = await getContents('admission');
  const classes = [...new Set((admission.programs || []).flatMap((p) => p.classes || []).filter(Boolean))];
  return classes.length ? classes : programs.flatMap((p) => p.classes);
}

// ---------- public ----------

function cleanApplication(body) {
  const data = {
    studentName: name(body.studentName),
    className: str(body.className, 60),
    fatherName: name(body.fatherName),
    motherName: name(body.motherName),
    mobile: str(body.mobile, 20),
  };
  if (data.studentName.length < 2) throw new HttpError(400, 'Please write the student’s full name.');
  if (!data.className) throw new HttpError(400, 'Please choose a class.');
  if (data.fatherName.length < 2) throw new HttpError(400, 'Please write the father’s name.');
  if (data.motherName.length < 2) throw new HttpError(400, 'Please write the mother’s name.');
  if (!MOBILE_RE.test(data.mobile) || data.mobile.replace(/\D/g, '').length < 10) throw new HttpError(400, 'Please enter a valid mobile number.');
  return data;
}

// Bots fill the hidden "website" field or submit within a split second
export function looksAutomated(body) {
  if (str(body.website, 200)) return true;
  const started = Number(body.startedAt);
  return Number.isFinite(started) && started > 0 && Date.now() - started < MIN_FILL_MS;
}

export async function submitApplication(body, meta = {}) {
  const data = cleanApplication(body);
  await connectDB();
  if (await findRecentDuplicate(AdmissionApplication, { studentName: data.studentName, mobile: data.mobile })) return { duplicate: true };
  const config = await getEmailConfig();
  const toAdmin = isReady(config) && config.notifyAdmission !== false && config.adminEmails.length > 0;
  const doc = await AdmissionApplication.create({
    ...data,
    ip: str(meta.ip, 64),
    userAgent: str(meta.userAgent, 400),
    emailAdmin: toAdmin ? 'pending' : 'off',
  });
  return { application: toPlain(doc), mail: toAdmin };
}

// Runs after the reply has been sent (next/server `after`). Recipients: Settings → Email → Admin email.
export async function sendApplicationEmail(application) {
  const config = await getEmailConfig();
  if (!isReady(config) || config.notifyAdmission === false || !config.adminEmails.length) return;
  const { general } = await getContents('general');
  const update = {};
  try {
    const mail = admissionAdminEmail(application, { school: general.identity.name, dashboardUrl: `${siteUrl()}/dashboard/applications?open=${application._id}` });
    await sendMail({ to: config.adminEmails, ...mail });
    update.emailAdmin = 'sent';
    update.emailError = '';
  } catch (error) {
    update.emailAdmin = 'failed';
    update.emailError = String(error.message).slice(0, 500);
    console.error('Admission email failed:', error.message);
  }
  try {
    await connectDB();
    await AdmissionApplication.updateOne({ _id: application._id }, { $set: update });
  } catch {
    /* logging only */
  }
}

// ---------- dashboard ----------

const validId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, 'Application not found.');
  return id;
};

export async function listApplications({ status = '', search = '', className = '', page = 1, limit = 20 } = {}) {
  await connectDB();
  const filter = {};
  if (ADMISSION_STATUSES.includes(status)) filter.status = status;
  const cls = str(className, 60);
  if (cls) filter.className = cls;
  const q = str(search, 100);
  if (q) {
    const re = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ studentName: re }, { fatherName: re }, { motherName: re }, { mobile: re }, { className: re }];
  }
  const size = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const total = await AdmissionApplication.countDocuments(filter);
  const pages = Math.max(Math.ceil(total / size), 1);
  const current = Math.min(Math.max(Number(page) || 1, 1), pages);
  const [items, counts, classes] = await Promise.all([
    AdmissionApplication.find(filter).select('-userAgent').sort({ createdAt: -1 }).skip((current - 1) * size).limit(size).lean(),
    AdmissionApplication.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    AdmissionApplication.distinct('className'),
  ]);
  return toPlain({
    items,
    total,
    page: current,
    pages,
    counts: Object.fromEntries(ADMISSION_STATUSES.map((s) => [s, counts.find((c) => c._id === s)?.count || 0])),
    classes: classes.sort(),
    mail: await isMailConfigured(),
  });
}

export async function getApplication(id) {
  await connectDB();
  const doc = await AdmissionApplication.findById(validId(id)).lean();
  if (!doc) throw new HttpError(404, 'Application not found.');
  return toPlain(doc);
}

export async function updateApplication(id, input = {}) {
  await connectDB();
  const doc = await AdmissionApplication.findById(validId(id));
  if (!doc) throw new HttpError(404, 'Application not found.');
  if ('status' in input) {
    if (!ADMISSION_STATUSES.includes(input.status)) throw new HttpError(400, 'Unknown status.');
    doc.status = input.status;
  }
  if ('note' in input) doc.note = str(input.note, 2000);
  await doc.save();
  return toPlain({ ...doc.toObject(), title: doc.studentName });
}

export async function removeApplication(id) {
  await connectDB();
  const doc = await AdmissionApplication.findByIdAndDelete(validId(id)).lean();
  if (!doc) throw new HttpError(404, 'Application not found.');
  return toPlain({ _id: doc._id, title: doc.studentName });
}

// Sends the admin email again for an application whose email failed
export async function resendApplicationEmail(id) {
  if (!(await isMailConfigured())) throw new HttpError(400, 'Email is not set up. Turn it on in Settings → Email.');
  await sendApplicationEmail(await getApplication(id));
  return getApplication(id);
}
