'use client';
import { useEffect, useRef, useState } from 'react';
import { FaPaperPlane, FaCheckCircle } from 'react-icons/fa';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { Input, Select } from './FormField';

const EMPTY = { studentName: '', className: '', fatherName: '', motherName: '', mobile: '', website: '' };

function validate(form) {
  const errors = {};
  if (form.studentName.trim().length < 2) errors.studentName = 'Please write the student’s full name.';
  if (!form.className) errors.className = 'Please choose a class.';
  if (form.fatherName.trim().length < 2) errors.fatherName = 'Please write the father’s name.';
  if (form.motherName.trim().length < 2) errors.motherName = 'Please write the mother’s name.';
  if (!/^[0-9+()\-\s]{10,20}$/.test(form.mobile.trim()) || form.mobile.replace(/\D/g, '').length < 10) errors.mobile = 'Please enter a valid mobile number, e.g. 01XXXXXXXXX.';
  return errors;
}

/**
 * Online admission form → POST /api/admissions. The application is saved (Dashboard → Admission Applications)
 * and emailed to the admin address(es) in Settings → Email. Classes come from Website Content → Admission.
 */
export default function AdmissionForm({ classes = [] }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');
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
      const res = await api.post('/admissions', { ...form, startedAt: startedAt.current }, { timeout: 30000 });
      setSent(res.data?.message || 'Application received.');
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
        <h3 className="mt-4 text-xl font-bold text-ink">Application submitted</h3>
        <p className="mt-1 max-w-sm text-sm text-muted">{sent}</p>
        <Button
          variant="secondary"
          className="mt-6"
          onClick={() => {
            startedAt.current = Date.now();
            setSent('');
          }}
        >
          Submit another application
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Alert type="error">{error}</Alert>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Student full name" name="studentName" value={form.studentName} onChange={update} placeholder="Student’s full name" autoComplete="off" maxLength={120} required error={errors.studentName} />
        </div>
        <Select
          label="Class"
          name="className"
          value={form.className}
          onChange={update}
          required
          error={errors.className}
          options={[{ value: '', label: 'Choose a class' }, ...classes.map((c) => ({ value: c, label: c }))]}
        />
        <Input label="Mobile number" name="mobile" type="tel" value={form.mobile} onChange={update} placeholder="01XXXXXXXXX" autoComplete="tel" inputMode="tel" maxLength={20} required error={errors.mobile} />
        <Input label="Father’s name" name="fatherName" value={form.fatherName} onChange={update} placeholder="Father’s full name" maxLength={120} required error={errors.fatherName} />
        <Input label="Mother’s name" name="motherName" value={form.motherName} onChange={update} placeholder="Mother’s full name" maxLength={120} required error={errors.motherName} />
      </div>

      {/* Hidden from people; bots that fill every field are ignored */}
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={update} />
      </div>

      <div className="flex flex-col gap-3 border-t border-line/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-subtle">The school office will call the mobile number above to complete the admission.</p>
        <Button type="submit" variant="brand" size="lg" disabled={submitting} className="w-full sm:ml-auto sm:w-auto">
          {submitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden /> : <FaPaperPlane aria-hidden />}
          {submitting ? 'Submitting…' : 'Submit application'}
        </Button>
      </div>
    </form>
  );
}
