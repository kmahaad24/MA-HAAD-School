'use client';
import { useEffect, useRef, useState } from 'react';
import { FaPaperPlane, FaCheckCircle } from 'react-icons/fa';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { Input, Textarea } from './FormField';

const EMPTY = { fullName: '', email: '', phone: '', subject: '', message: '', website: '' };
const MAX_MESSAGE = 5000; // same limit as POST /api/contact
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form) {
  const errors = {};
  if (form.fullName.trim().length < 2) errors.fullName = 'Please write your name.';
  if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Please enter a valid email address.';
  if (form.phone && !/^[0-9+()\-\s]{6,30}$/.test(form.phone)) errors.phone = 'Please enter a valid phone number.';
  if (form.message.trim().length < 10) errors.message = 'Please write a little more (at least 10 characters).';
  return errors;
}

/**
 * Contact form → POST /api/contact. The message is saved (Dashboard → Messages), the school is emailed and
 * the sender gets a confirmation email. Topics and texts come from Website Content → Contact page.
 * Spam protection: a hidden "website" field and the time taken to fill the form.
 */
export default function ContactForm({ topics = [], privacyNote }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [sent, setSent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const update = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((errs) => ({ ...errs, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/contact', { ...form, startedAt: startedAt.current }, { timeout: 30000 });
      setSent({ message: res.data?.message || 'Message sent.', email: form.email });
      setForm(EMPTY);
    } catch (err) {
      setError(err?.code === 'ECONNABORTED' || !err?.response ? 'Your internet connection seems slow or offline. Please check it and try again.' : err.response.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="flex animate-fade-up flex-col items-center rounded-xl border border-green-500/30 bg-green-500/5 px-6 py-10 text-center" role="status">
        <FaCheckCircle className="text-5xl text-green-500" aria-hidden />
        <h3 className="mt-4 text-xl font-bold text-ink">Message sent</h3>
        <p className="mt-1 max-w-sm text-sm text-muted">{sent.message}</p>
        <p className="mt-1 text-xs text-subtle">We&apos;ll reply to <span className="font-medium text-body">{sent.email}</span>.</p>
        <Button
          variant="secondary"
          className="mt-6"
          onClick={() => {
            startedAt.current = Date.now();
            setSent(null);
          }}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Alert type="error">{error}</Alert>

      {topics.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-body">What is it about?</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Topic">
            {topics.map((topic) => {
              const active = form.subject === topic;
              return (
                <button
                  key={topic}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setForm((f) => ({ ...f, subject: active ? '' : topic }))}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                    active ? 'border-brand-500 bg-brand-500 text-white' : 'border-line/15 text-muted hover:border-brand-500/60 hover:text-ink'
                  )}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" name="fullName" value={form.fullName} onChange={update} placeholder="Your name" autoComplete="name" maxLength={120} required error={errors.fullName} />
        <Input label="Email" name="email" type="email" value={form.email} onChange={update} placeholder="you@example.com" autoComplete="email" inputMode="email" maxLength={160} required error={errors.email} />
        <Input label="Phone (optional)" name="phone" type="tel" value={form.phone} onChange={update} placeholder="01XXXXXXXXX" autoComplete="tel" inputMode="tel" maxLength={30} error={errors.phone} />
        <Input label="Subject" name="subject" value={form.subject} onChange={update} placeholder="Pick a topic above or type one" maxLength={200} />
      </div>

      {/* Hidden from people; bots that fill every field are ignored */}
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={update} />
      </div>

      <div>
        <Textarea label="Message" name="message" rows={6} value={form.message} onChange={update} placeholder="Tell us how we can help…" maxLength={MAX_MESSAGE} required error={errors.message} />
        <p className={cn('mt-1 text-right text-xs', form.message.length > MAX_MESSAGE * 0.9 ? 'text-amber-600' : 'text-faint')}>
          {form.message.length} / {MAX_MESSAGE}
        </p>
      </div>
      <div className="flex flex-col gap-3 border-t border-line/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        {privacyNote && <p className="text-xs text-subtle">{privacyNote}</p>}
        <Button type="submit" variant="brand" size="lg" disabled={submitting} className="w-full sm:ml-auto sm:w-auto">
          {submitting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
          ) : (
            <FaPaperPlane aria-hidden />
          )}
          {submitting ? 'Sending…' : 'Send message'}
        </Button>
      </div>
    </form>
  );
}
