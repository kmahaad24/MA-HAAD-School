'use client';
import { useState } from 'react';
import { FaUserCircle, FaLock, FaPalette, FaEye, FaEyeSlash } from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import useAuth from '@/hooks/useAuth';
import { apiSecure, apiError } from '@/lib/api-client';
import { ROLE_INFO } from '@/config/roles';
import { formatDate } from '@/lib/utils';
import PageTitle from '@/components/dashboard/PageTitle';
import ImageUpload from '@/components/dashboard/ImageUpload';
import UserAvatar from '@/components/dashboard/UserAvatar';
import ThemeToggle from '@/components/layout/ThemeToggle';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { Input } from '@/components/forms/FormField';
import { FormSkeleton } from '@/components/loading/PageSkeletons';

const FIELDS = ['name', 'email', 'phone', 'designation', 'avatar'];
const pick = (u) => Object.fromEntries(FIELDS.map((k) => [k, u?.[k] || '']));

function Section({ icon: Icon, title, description, children }) {
  return (
    <Card className="p-0">
      <div className="flex items-start gap-3 border-b border-line/10 px-5 py-4">
        <span className="rounded-lg bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300"><Icon /></span>
        <div>
          <h2 className="text-base">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-subtle">{description}</p>}
        </div>
      </div>
      <div className="px-5 py-5">{children}</div>
    </Card>
  );
}

function ProfileForm({ profile, onSaved }) {
  const [form, setForm] = useState(() => pick(profile));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });
  const dirty = FIELDS.some((k) => form[k] !== (profile[k] || ''));
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', text: '' });
    try {
      const res = await apiSecure.put('/profile', form);
      onSaved(res.data.data);
      setStatus({ type: 'success', text: res.data.message || 'Saved.' });
    } catch (err) {
      setStatus({ type: 'error', text: apiError(err, 'Could not save.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section icon={FaUserCircle} title="Profile" description="Your name and photo are shown in the dashboard and in the activity log.">
      <form onSubmit={save} className="space-y-4">
        <ImageUpload label="Photo" value={form.avatar} folder="staff" aspect="aspect-square" onChange={(avatar) => setForm((f) => ({ ...f, avatar }))} hint="A square head-and-shoulders photo looks best." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" name="profile-name" value={form.name} onChange={set('name')} required maxLength={120} autoComplete="name" />
          <Input label="Email (used to sign in)" name="profile-email" type="email" value={form.email} onChange={set('email')} required maxLength={160} autoComplete="email" />
          <Input label="Phone" name="profile-phone" type="tel" value={form.phone} onChange={set('phone')} maxLength={30} autoComplete="tel" />
          <Input label="Designation" name="profile-designation" value={form.designation} onChange={set('designation')} maxLength={120} placeholder="e.g. Office Assistant" />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line/10 pt-4">
          <Alert type={status.type || 'info'} className="mr-auto py-1.5">{status.text}</Alert>
          {dirty && !status.text && <span className="mr-auto text-xs text-amber-600">Unsaved changes</span>}
          <Button type="submit" disabled={saving || !dirty}>{saving ? 'Saving…' : 'Save profile'}</Button>
        </div>
      </form>
    </Section>
  );
}

const EMPTY_PASSWORDS = { currentPassword: '', newPassword: '', confirm: '' };

function PasswordForm() {
  const [form, setForm] = useState(EMPTY_PASSWORDS);
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const strength = form.newPassword.length >= 12 && /[A-Z]/.test(form.newPassword) && /\d/.test(form.newPassword) ? 'Strong' : form.newPassword.length >= 8 ? 'OK' : form.newPassword ? 'Too short' : '';

  const save = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      setStatus({ type: 'error', text: 'The new passwords do not match.' });
      return;
    }
    setSaving(true);
    setStatus({ type: '', text: '' });
    try {
      const res = await apiSecure.put('/auth/password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm(EMPTY_PASSWORDS);
      setStatus({ type: 'success', text: res.data?.message || 'Password updated.' });
    } catch (err) {
      setStatus({ type: 'error', text: apiError(err, 'Could not change the password.') });
    } finally {
      setSaving(false);
    }
  };

  const type = show ? 'text' : 'password';
  return (
    <Section icon={FaLock} title="Password" description="Changing your password signs you out on every other device.">
      <form onSubmit={save} className="space-y-4">
        <Input label="Current password" name="currentPassword" type={type} autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Input label="New password" name="newPassword" type={type} autoComplete="new-password" minLength={8} value={form.newPassword} onChange={set('newPassword')} required />
            {strength && <p className={`mt-1 text-xs ${strength === 'Too short' ? 'text-red-600' : strength === 'OK' ? 'text-amber-600' : 'text-green-600'}`}>{strength}{strength === 'OK' && ' — 12+ characters with a capital and a number is stronger'}</p>}
          </div>
          <Input label="Repeat new password" name="confirm" type={type} autoComplete="new-password" minLength={8} value={form.confirm} onChange={set('confirm')} required />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button type="button" onClick={() => setShow((s) => !s)} className="mr-auto inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
            {show ? <FaEyeSlash aria-hidden /> : <FaEye aria-hidden />} {show ? 'Hide' : 'Show'} passwords
          </button>
          <Alert type={status.type || 'info'} className="py-1.5">{status.text}</Alert>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Update password'}</Button>
        </div>
      </form>
    </Section>
  );
}

// Dashboard → My Profile: everyone's own details, password and theme
export default function ProfileView() {
  const { setUser } = useAuth();
  const { data: profile, setData, loading, error } = useApi('/profile', { select: (res) => res.data });

  const onSaved = (next) => {
    setData(next);
    setUser((u) => ({ ...u, ...next }));
  };

  return (
    <>
      <PageTitle title="My Profile" description="Your account details, password and dashboard appearance." />
      <Alert type="error" className="mb-4">{error}</Alert>
      {loading || !profile ? (
        <FormSkeleton cards={2} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          {/* Summary card */}
          <Card className="h-fit text-center">
            <UserAvatar user={profile} size="h-24 w-24 text-3xl" className="mx-auto ring-4 ring-primary-100 dark:ring-primary-500/20" />
            <p className="mt-4 text-lg font-semibold text-ink">{profile.name}</p>
            <p className="break-all text-sm text-muted">{profile.email}</p>
            {profile.designation && <p className="mt-1 text-sm text-body">{profile.designation}</p>}
            <div className="mt-3 flex justify-center gap-2">
              <Badge color={profile.role === 'admin' ? 'red' : 'green'}>{ROLE_INFO[profile.role]?.label || profile.role}</Badge>
              <Badge color="green">{profile.status}</Badge>
            </div>
            <p className="mt-3 text-xs text-subtle">{ROLE_INFO[profile.role]?.description}</p>
            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line/10 pt-4 text-left text-xs">
              <div>
                <dt className="text-subtle">Member since</dt>
                <dd className="mt-0.5 font-medium text-body">{formatDate(profile.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-subtle">Last sign-in</dt>
                <dd className="mt-0.5 font-medium text-body">{profile.lastLoginAt ? formatDate(profile.lastLoginAt, true) : '—'}</dd>
              </div>
            </dl>
          </Card>

          <div className="space-y-6">
            <ProfileForm key={profile.updatedAt} profile={profile} onSaved={onSaved} />
            <PasswordForm />
            <Section icon={FaPalette} title="Appearance" description="Light, dark or follow the device. Saved in this browser.">
              <ThemeToggle variant="row" />
            </Section>
          </div>
        </div>
      )}
    </>
  );
}
