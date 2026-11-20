// Dashboard accounts: sign-in, Dashboard → Users (admins) and Dashboard → My Profile (everyone).
import mongoose from 'mongoose';
import User, { ROLES, USER_STATUSES, MIN_PASSWORD_LENGTH } from '@/models/User';
import { HttpError } from '@/server/http';
import { str, toPlain } from '@/server/validate';
import { escapeRegex } from '@/lib/utils';
import connectDB from '@/lib/db';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-\s]{6,30}$/;
const IMAGE_RE = /^(\/(?!\/)|https:\/\/)/i;

export function toPublicUser(user) {
  const { _id, name, email, role, status, lastLoginAt, createdAt, updatedAt, phone, designation, avatar } = user;
  return toPlain({ _id, name, email, role, status: status || 'active', lastLoginAt, createdAt, updatedAt, phone: phone || '', designation: designation || '', avatar: avatar || '' });
}

export async function authenticate(email, password) {
  const user = await User.findOne({ email: str(email, 160).toLowerCase() }).select('+password');
  if (!user || !(await user.checkPassword(password))) throw new HttpError(401, 'Incorrect email or password.');
  // Checked after the password, so only the account owner learns the status
  if (user.status === 'suspended') throw new HttpError(403, 'This account is suspended.');
  user.lastLoginAt = new Date();
  await user.save();
  return user;
}

const validId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new HttpError(404, 'User not found.');
  return id;
};

export async function getUserById(id) {
  const user = await User.findById(validId(id)).lean();
  if (!user) throw new HttpError(404, 'User not found.');
  return user;
}

function checkPassword(password) {
  if (String(password || '').length < MIN_PASSWORD_LENGTH) throw new HttpError(400, `The password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  if (String(password).length > 200) throw new HttpError(400, 'The password is too long.');
  return String(password);
}

// Returns the updated user (the caller issues a fresh session cookie)
export async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new HttpError(404, 'User not found.');
  if (!(await user.checkPassword(currentPassword || ''))) throw new HttpError(400, 'Current password is incorrect.');
  user.password = checkPassword(newPassword);
  user.sessionVersion = (user.sessionVersion || 0) + 1; // signs out other devices
  await user.save();
  return user;
}

export async function countUsers() {
  return User.countDocuments();
}

// ---------- Dashboard → Users (admins) ----------

function cleanEmail(value) {
  const email = str(value, 160).toLowerCase();
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Enter a valid email address.');
  return email;
}

function cleanProfile(input) {
  const out = {};
  if ('name' in input) {
    out.name = str(input.name, 120);
    if (out.name.length < 2) throw new HttpError(400, 'Write the name.');
  }
  if ('phone' in input) {
    out.phone = str(input.phone, 30);
    if (out.phone && !PHONE_RE.test(out.phone)) throw new HttpError(400, 'Enter a valid phone number.');
  }
  if ('designation' in input) out.designation = str(input.designation, 120);
  if ('avatar' in input) {
    out.avatar = str(input.avatar, 1000);
    if (out.avatar && !IMAGE_RE.test(out.avatar)) throw new HttpError(400, 'Upload a photo.');
  }
  return out;
}

async function emailFree(email, exceptId) {
  const taken = await User.exists({ email, ...(exceptId && { _id: { $ne: exceptId } }) });
  if (taken) throw new HttpError(409, 'Another account already uses this email.');
}

// At least one active admin must remain, so nobody can lock the school out of the dashboard
async function keepOneAdmin(user, next) {
  const wasActiveAdmin = user.role === 'admin' && user.status === 'active';
  const staysActiveAdmin = next.role === 'admin' && next.status === 'active';
  if (!wasActiveAdmin || staysActiveAdmin) return;
  const others = await User.countDocuments({ _id: { $ne: user._id }, role: 'admin', status: 'active' });
  if (!others) throw new HttpError(400, 'This is the only active admin. Make another person an admin first.');
}

export async function listUsers({ search = '', role = '', status = '' } = {}) {
  await connectDB();
  const filter = {};
  if (ROLES.includes(role)) filter.role = role;
  if (USER_STATUSES.includes(status)) filter.status = status;
  const q = str(search, 100);
  if (q) {
    const re = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: re }, { email: re }, { designation: re }, { phone: re }];
  }
  const [items, counts] = await Promise.all([
    User.find(filter).sort({ role: 1, name: 1 }).limit(500).lean(),
    User.aggregate([{ $group: { _id: { role: '$role', status: '$status' }, count: { $sum: 1 } } }]),
  ]);
  const sum = (match) => counts.filter((c) => match(c._id)).reduce((n, c) => n + c.count, 0);
  return {
    items: items.map(toPublicUser),
    counts: { total: sum(() => true), admin: sum((k) => k.role === 'admin'), editor: sum((k) => k.role === 'editor'), suspended: sum((k) => k.status === 'suspended') },
  };
}

export async function createUser(input = {}, { by } = {}) {
  await connectDB();
  const email = cleanEmail(input.email);
  await emailFree(email);
  const role = ROLES.includes(input.role) ? input.role : 'editor';
  const user = await User.create({
    ...cleanProfile({ name: input.name, phone: input.phone, designation: input.designation }),
    email,
    role,
    status: 'active',
    password: checkPassword(input.password),
    createdBy: by,
  });
  return { ...toPublicUser(user.toObject()), title: user.name };
}

export async function updateUser(id, input = {}, { by } = {}) {
  await connectDB();
  const user = await User.findById(validId(id));
  if (!user) throw new HttpError(404, 'User not found.');
  const self = String(user._id) === String(by);
  const next = {
    role: 'role' in input ? input.role : user.role,
    status: 'status' in input ? input.status : user.status,
  };
  if (!ROLES.includes(next.role)) throw new HttpError(400, 'Choose a role.');
  if (!USER_STATUSES.includes(next.status)) throw new HttpError(400, 'Choose a status.');
  if (self && (next.role !== user.role || next.status !== user.status)) throw new HttpError(400, 'You cannot change your own role or suspend yourself.');
  await keepOneAdmin(user, next);

  let signOut = next.role !== user.role || next.status !== user.status;
  user.set(cleanProfile(input));
  if ('email' in input) {
    const email = cleanEmail(input.email);
    if (email !== user.email) {
      await emailFree(email, user._id);
      user.email = email;
    }
  }
  user.role = next.role;
  user.status = next.status;
  if (input.password) {
    if (self) throw new HttpError(400, 'Change your own password in My Profile.');
    user.password = checkPassword(input.password);
    signOut = true;
  }
  // A new role, suspension or password reset ends the person's open sessions
  if (signOut) user.sessionVersion = (user.sessionVersion || 0) + 1;
  await user.save();
  return { ...toPublicUser(user.toObject()), title: user.name };
}

export async function removeUser(id, { by } = {}) {
  await connectDB();
  const user = await User.findById(validId(id));
  if (!user) throw new HttpError(404, 'User not found.');
  if (String(user._id) === String(by)) throw new HttpError(400, 'You cannot delete your own account.');
  await keepOneAdmin(user, { role: 'none', status: 'deleted' });
  await user.deleteOne();
  return { _id: String(user._id), title: user.name };
}

// ---------- Dashboard → My Profile ----------

export async function getProfile(id) {
  await connectDB();
  return toPublicUser(await getUserById(id));
}

export async function updateProfile(id, input = {}) {
  await connectDB();
  const user = await User.findById(validId(id));
  if (!user) throw new HttpError(404, 'User not found.');
  user.set(cleanProfile(input));
  if ('email' in input) {
    const email = cleanEmail(input.email);
    if (email !== user.email) {
      await emailFree(email, user._id);
      user.email = email;
    }
  }
  await user.save();
  return { ...toPublicUser(user.toObject()), title: user.name };
}
