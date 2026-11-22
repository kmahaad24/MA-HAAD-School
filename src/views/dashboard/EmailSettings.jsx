'use client';
import { useState } from 'react';
import { FaEnvelope, FaPaperPlane, FaEye, FaEyeSlash, FaUndo, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import { apiSecure, apiError } from '@/lib/api-client';
import { formatDate, cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import { Input } from '@/components/forms/FormField';
import { FormSkeleton } from '@/components/loading/PageSkeletons';

// Common providers fill the server details in one click
const PRESETS = [
  { label: 'Hostinger', host: 'smtp.hostinger.com', port: 465, security: 'ssl' },
  { label: 'Gmail', host: 'smtp.gmail.com', port: 465, security: 'ssl', note: 'Gmail needs an “App password” (Google account → Security → 2-Step Verification → App passwords).' },
  { label: 'Zoho', host: 'smtp.zoho.com', port: 465, security: 'ssl' },
  { label: 'Outlook / Office 365', host: 'smtp.office365.com', port: 587, security: 'starttls' },
];

const SECURITY_OPTIONS = [
  { value: 'ssl', label: 'SSL/TLS (port 465)' },
  { value: 'starttls', label: 'STARTTLS (port 587)' },
  { value: 'none', label: 'None (not recommended)' },
];

const toForm = (s) => ({
  enabled: Boolean(s?.enabled),
  host: s?.host || '',
  port: s?.port || 465,
  security: s?.security || 'ssl',
  user: s?.user || '',
  pass: '',
  fromEmail: s?.fromEmail || '',
  fromName: s?.fromName || '',
  adminEmails: (s?.adminEmails || []).join(', '),
  notifyAdmin: s?.notifyAdmin !== false,
  notifyAdmission: s?.notifyAdmission !== false,
  sendConfirmation: s?.sendConfirmation !== false,
});

const field = 'w-full rounded-lg border border-line/20 bg-surface px-3 py-2 text-sm text-ink focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20';

function Switch({ checked, onChange, title, description }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-line/15 p-3">
      <span>
        <span className="block text-sm font-semibold text-ink">{title}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="h-6 w-11 rounded-full bg-line/20 transition peer-checked:bg-primary-600 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-300" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function EmailForm({ settings, onSaved }) {
  const [form, setForm] = useState(() => toForm(settings));
  const [showPass, setShowPass] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [busy, setBusy] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const preset = PRESETS.find((p) => p.host === form.host);

  const run = async (kind, fn) => {
    setBusy(kind);
    setStatus({ type: '', text: '' });
    try {
      const res = await fn();
      setStatus({ type: 'success', text: res.data.message });
      return res;
    } catch (err) {
      setStatus({ type: 'error', text: apiError(err, 'Something went wrong.') });
      return null;
    } finally {
      setBusy('');
    }
  };

  const save = async (e) => {
    e.preventDefault();
    const res = await run('save', () => apiSecure.put('/settings/email', form));
    if (res) onSaved(res.data.data);
  };

  const test = () => run('test', () => apiSecure.post('/settings/email/test', { settings: form, to: testTo }));

  const reset = async () => {
    if (!window.confirm('Clear the email settings saved here? The SMTP values in the server’s .env file will be used instead (if any).')) return;
    const res = await run('reset', () => apiSecure.delete('/settings/email'));
    if (res) onSaved(res.data.data);
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <Switch
        checked={form.enabled}
        onChange={(enabled) => setForm((f) => ({ ...f, enabled }))}
        title="Send emails"
        description="When off, contact messages and admission applications are still saved in the dashboard but no email is sent."
      />

      <fieldset disabled={!form.enabled} className={cn('space-y-5 transition', !form.enabled && 'opacity-50')}>
        {/* Mail server */}
        <div className="rounded-xl border border-line/10 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">Mail server (SMTP)</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, host: p.host, port: p.port, security: p.security }))}
                  className={cn('rounded-full border px-2.5 py-1 text-xs font-medium transition', form.host === p.host ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300' : 'border-line/15 text-muted hover:text-ink')}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_110px_190px]">
            <Input label="Server" name="smtp-host" value={form.host} onChange={set('host')} placeholder="smtp.hostinger.com" autoComplete="off" />
            <Input label="Port" name="smtp-port" type="number" value={form.port} onChange={set('port')} min={1} max={65535} />
            <div>
              <label htmlFor="smtp-security" className="mb-1 block text-sm font-medium text-body">Security</label>
              <select id="smtp-security" value={form.security} onChange={set('security')} className={field}>
                {SECURITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          {preset?.note && <p className="mt-2 text-xs text-amber-600">{preset.note}</p>}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input label="Email account (username)" name="smtp-user" value={form.user} onChange={set('user')} placeholder="info@your-domain.com" autoComplete="off" />
            <div>
              <label htmlFor="smtp-pass" className="mb-1 block text-sm font-medium text-body">Password</label>
              <div className="relative">
                <input
                  id="smtp-pass"
                  type={showPass ? 'text' : 'password'}
                  value={form.pass}
                  onChange={set('pass')}
                  autoComplete="new-password"
                  placeholder={settings.hasPassword ? '•••••••• (saved — leave empty to keep)' : 'Mailbox password'}
                  className={cn(field, 'pr-10')}
                />
                <button type="button" onClick={() => setShowPass((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-faint hover:text-ink" aria-label={showPass ? 'Hide password' : 'Show password'}>
                  {showPass ? <FaEyeSlash aria-hidden /> : <FaEye aria-hidden />}
                </button>
              </div>
              <p className="mt-1 text-xs text-subtle">Stored encrypted. Never shown again after saving.</p>
            </div>
          </div>
        </div>

        {/* Sender & recipients */}
        <div className="rounded-xl border border-line/10 p-4">
          <p className="mb-3 text-sm font-semibold text-ink">Sender & recipients</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Send from (email)" name="mail-from" type="email" value={form.fromEmail} onChange={set('fromEmail')} placeholder={form.user || 'info@your-domain.com'} />
            <Input label="Sender name" name="mail-from-name" value={form.fromName} onChange={set('fromName')} placeholder="MA HAAD School & College" maxLength={120} />
          </div>
          <div className="mt-4">
            <label htmlFor="mail-admins" className="mb-1 block text-sm font-medium text-body">Admin email (alerts for contact messages and admission applications)</label>
            <input id="mail-admins" value={form.adminEmails} onChange={set('adminEmails')} placeholder="office@your-domain.com, principal@your-domain.com" className={field} />
            <p className="mt-1 text-xs text-subtle">One or more addresses, separated by commas (up to 10).</p>
          </div>
        </div>

        {/* What is sent */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Switch checked={form.notifyAdmin} onChange={(v) => setForm((f) => ({ ...f, notifyAdmin: v }))} title="Contact message alert" description="Each new contact message is emailed to the admin email." />
          <Switch checked={form.notifyAdmission} onChange={(v) => setForm((f) => ({ ...f, notifyAdmission: v }))} title="Admission alert" description="Each new online admission application is emailed to the admin email." />
          <Switch checked={form.sendConfirmation} onChange={(v) => setForm((f) => ({ ...f, sendConfirmation: v }))} title="Confirmation to the sender" description="The person gets a thank-you email (text in Page Content → Contact page)." />
        </div>
      </fieldset>

      {/* Test */}
      <div className="flex flex-col gap-3 rounded-xl bg-canvas p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input label="Send a test to" name="test-to" type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder={form.adminEmails.split(',')[0]?.trim() || 'you@example.com'} />
        </div>
        <Button variant="secondary" onClick={test} disabled={Boolean(busy) || !form.host}>
          <FaPaperPlane aria-hidden /> {busy === 'test' ? 'Testing…' : 'Test these settings'}
        </Button>
      </div>

      <div className="flex flex-col gap-3 border-t border-line/10 pt-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <Alert type={status.type || 'info'} className="py-1.5">{status.text}</Alert>
        </div>
        <div className="flex gap-2">
          {settings.source === 'dashboard' && (
            <Button variant="ghost" onClick={reset} disabled={Boolean(busy)}>
              <FaUndo aria-hidden /> Use .env
            </Button>
          )}
          <Button type="submit" disabled={Boolean(busy)}>{busy === 'save' ? 'Saving…' : 'Save email settings'}</Button>
        </div>
      </div>
    </form>
  );
}

// Dashboard → Settings → Email: SMTP server, sender, recipients and what is sent — no server access needed
export default function EmailSettings() {
  const { data, setData, loading, error } = useApi('/settings/email', { select: (res) => res.data });

  return (
    <Card className="p-0">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line/10 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300"><FaEnvelope /></span>
          <div>
            <h2 className="text-base">Email</h2>
            <p className="mt-0.5 text-sm text-subtle">Contact messages and admission applications are emailed to the admin email, and contact senders get a confirmation.</p>
          </div>
        </div>
        {data && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {data.ready ? (
              <Badge color="green"><FaCheckCircle className="mr-1 inline" aria-hidden />Working</Badge>
            ) : (
              <Badge color="amber"><FaExclamationTriangle className="mr-1 inline" aria-hidden />Not sending</Badge>
            )}
            <span className="text-subtle">
              {data.source === 'dashboard' ? `Saved here${data.updatedAt ? ` · ${formatDate(data.updatedAt, true)}` : ''}` : data.source === 'env' ? 'From the server .env file' : 'Not set up'}
            </span>
          </div>
        )}
      </div>
      <div className="px-5 py-5">
        <Alert type="error" className="mb-4">{error}</Alert>
        {loading || !data ? <FormSkeleton cards={1} /> : <EmailForm key={`${data.source}-${data.updatedAt || ''}`} settings={data} onSaved={setData} />}
      </div>
    </Card>
  );
}
