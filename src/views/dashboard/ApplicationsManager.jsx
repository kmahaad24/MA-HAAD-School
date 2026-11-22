'use client';
import { useCallback, useEffect, useState } from 'react';
import { FaPhoneAlt, FaTrashAlt, FaRedo, FaUserGraduate, FaExternalLinkAlt } from 'react-icons/fa';
import { apiSecure, apiError } from '@/lib/api-client';
import { cn, formatDate, telHref } from '@/lib/utils';
import PageTitle from '@/components/dashboard/PageTitle';
import FilterBar from '@/components/dashboard/FilterBar';
import Pagination from '@/components/dashboard/Pagination';
import Modal from '@/components/dashboard/Modal';
import { TableRowsSkeleton } from '@/components/loading/PageSkeletons';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import EmptyState from '@/components/ui/EmptyState';

const STATUSES = [
  { value: 'new', label: 'New', color: 'blue' },
  { value: 'contacted', label: 'Contacted', color: 'amber' },
  { value: 'admitted', label: 'Admitted', color: 'green' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
];
const STATUS = Object.fromEntries(STATUSES.map((s) => [s.value, s]));
const EMAIL_LABEL = { sent: ['green', 'sent'], failed: ['red', 'failed'], pending: ['amber', 'sending'], off: ['gray', 'off'] };

function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 border-b border-line/10 py-2.5 text-sm last:border-0">
      <span className="text-subtle">{label}</span>
      <span className="font-medium text-ink">{children}</span>
    </div>
  );
}

function ApplicationDialog({ id, onClose, onChanged }) {
  const [app, setApp] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  useEffect(() => {
    let active = true;
    apiSecure
      .get(`/admissions/${id}`)
      .then((res) => {
        if (!active) return;
        setApp(res.data.data);
        setNote(res.data.data.note || '');
      })
      .catch((err) => active && setStatus({ type: 'error', text: apiError(err, 'Could not open the application.') }));
    return () => {
      active = false;
    };
  }, [id]);

  const act = async (fn, done) => {
    setBusy(true);
    setStatus({ type: '', text: '' });
    try {
      const res = await fn();
      if (res?.data?.data?.studentName) setApp(res.data.data);
      setStatus({ type: 'success', text: res?.data?.message || 'Saved.' });
      onChanged();
      done?.();
    } catch (err) {
      setStatus({ type: 'error', text: apiError(err, 'Something went wrong.') });
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    if (!window.confirm('Delete this application permanently?')) return;
    act(() => apiSecure.delete(`/admissions/${id}`), onClose);
  };

  const [emailColor, emailText] = EMAIL_LABEL[app?.emailAdmin] || EMAIL_LABEL.off;

  return (
    <Modal title="Admission application" onClose={onClose} size="max-w-2xl">
      <Alert type={status.type || 'info'}>{status.text}</Alert>
      {!app ? (
        !status.text && <TableRowsSkeleton rows={3} cols={1} />
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-ink">{app.studentName}</p>
              <p className="text-sm text-muted">{app.className}</p>
            </div>
            <div className="text-right">
              <Badge color={STATUS[app.status]?.color}>{STATUS[app.status]?.label || app.status}</Badge>
              <p className="mt-1 text-xs text-subtle">{formatDate(app.createdAt, true)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-line/10 bg-canvas px-4 py-1">
            <Row label="Student name">{app.studentName}</Row>
            <Row label="Class">{app.className}</Row>
            <Row label="Father’s name">{app.fatherName}</Row>
            <Row label="Mother’s name">{app.motherName}</Row>
            <Row label="Mobile">
              <a href={telHref(app.mobile)} className="inline-flex items-center gap-1.5 text-primary-600 hover:underline dark:text-primary-400">
                <FaPhoneAlt className="text-xs" aria-hidden /> {app.mobile}
              </a>
            </Row>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">Email to admin: <Badge color={emailColor}>{emailText}</Badge></span>
            {app.emailAdmin === 'failed' && (
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => act(() => apiSecure.post(`/admissions/${id}/resend`))}>
                <FaRedo aria-hidden /> Send again
              </Button>
            )}
          </div>
          {app.emailError && <p className="text-xs text-red-600">{app.emailError}</p>}

          <div>
            <p className="mb-2 text-sm font-medium text-body">Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  disabled={busy || app.status === s.value}
                  onClick={() => act(() => apiSecure.patch(`/admissions/${id}`, { status: s.value }))}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                    app.status === s.value ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300' : 'border-line/15 text-muted hover:text-ink'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="application-note" className="mb-1 block text-sm font-medium text-body">Office note (private)</label>
            <textarea
              id="application-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
              placeholder="e.g. Called the father, visit booked for Sunday"
              className="w-full rounded-lg border border-line/20 bg-surface px-3 py-2 text-sm text-ink focus:border-primary-500 focus:outline-none"
            />
            {note !== (app.note || '') && (
              <Button size="sm" className="mt-2" disabled={busy} onClick={() => act(() => apiSecure.patch(`/admissions/${id}`, { note }))}>
                Save note
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-line/10 pt-4">
            <Button href={telHref(app.mobile)}>
              <FaPhoneAlt aria-hidden /> Call
            </Button>
            <Button variant="danger" className="sm:ml-auto" disabled={busy} onClick={remove}>
              <FaTrashAlt aria-hidden /> Delete
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}

// Dashboard → Admission Applications: everything sent from the online admission form (/admission/apply)
export default function ApplicationsManager() {
  const [tab, setTab] = useState('');
  const [className, setClassName] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Link from the notification email: /dashboard/applications?open=<id>
  const [open, setOpen] = useState(() => (typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('open')));
  const query = useDebounced(search);

  const load = useCallback(() => {
    const params = new URLSearchParams({ status: tab, class: className, search: query, page: String(page) });
    return apiSecure
      .get(`/admissions?${params}`)
      .then((res) => {
        setData(res.data.data);
        setError('');
      })
      .catch((err) => setError(apiError(err, 'Applications could not be loaded.')))
      .finally(() => setLoading(false));
  }, [tab, className, query, page]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = data?.counts || {};
  const all = Object.values(counts).reduce((a, b) => a + b, 0);
  const tabs = [{ value: '', label: 'All', count: all }, ...STATUSES.map((s) => ({ ...s, count: counts[s.value] }))];

  return (
    <>
      <PageTitle
        title="Admission Applications"
        description="Applications sent from the website’s online admission form. Call the parents, keep notes and update the status."
        actions={
          <Button href="/admission/apply" variant="secondary" target="_blank" rel="noopener noreferrer">
            <FaExternalLinkAlt aria-hidden /> Open the form
          </Button>
        }
      />
      {data && !data.mail && (
        <Alert type="warning" className="mb-4">
          Email is not set up yet, so no alerts are sent. Applications are still saved here. An admin can set the admin email in Settings → Email.
        </Alert>
      )}
      <Alert type="error" className="mb-4">{error}</Alert>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-line/10 bg-surface p-1 scrollbar-none">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => {
              setTab(t.value);
              setPage(1);
            }}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
              tab === t.value ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300' : 'text-muted hover:bg-line/5 hover:text-ink'
            )}
          >
            {t.label}
            {t.count > 0 && <span className={cn('rounded-full px-1.5 text-xs', t.value === 'new' ? 'bg-primary-600 text-white' : 'bg-line/10')}>{t.count}</span>}
          </button>
        ))}
      </div>

      <Card className="p-0">
        <FilterBar
          search={search}
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search student, parent or mobile…"
          filters={
            data?.classes?.length
              ? [
                  {
                    key: 'Class',
                    value: className,
                    onChange: (v) => {
                      setClassName(v);
                      setPage(1);
                    },
                    options: [{ value: '', label: 'All classes' }, ...data.classes.map((c) => ({ value: c, label: c }))],
                  },
                ]
              : []
          }
        />
        {loading ? (
          <TableRowsSkeleton rows={6} cols={4} />
        ) : !data?.items.length ? (
          <EmptyState icon={FaUserGraduate} title={query || className ? 'No applications match' : 'No applications yet'} description="Applications sent from the online admission form appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-line/10 bg-canvas text-xs uppercase tracking-wide text-subtle">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Student</th>
                  <th className="px-4 py-2.5 font-semibold">Class</th>
                  <th className="hidden px-4 py-2.5 font-semibold md:table-cell">Father / Mother</th>
                  <th className="px-4 py-2.5 font-semibold">Mobile</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/5">
                {data.items.map((a) => (
                  <tr key={a._id} onClick={() => setOpen(a._id)} className="cursor-pointer transition hover:bg-line/5">
                    <td className="px-4 py-3">
                      <button type="button" className={cn('text-left', a.status === 'new' ? 'font-bold text-ink' : 'font-medium text-body')}>{a.studentName}</button>
                      {a.emailAdmin === 'failed' && <Badge color="red" className="ml-2">email failed</Badge>}
                    </td>
                    <td className="px-4 py-3 text-body">{a.className}</td>
                    <td className="hidden px-4 py-3 text-muted md:table-cell">{a.fatherName}<br />{a.motherName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-body">{a.mobile}</td>
                    <td className="px-4 py-3"><Badge color={STATUS[a.status]?.color}>{STATUS[a.status]?.label || a.status}</Badge></td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-subtle sm:table-cell">{formatDate(a.createdAt, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={data?.page || 1} pageCount={data?.pages || 1} onChange={setPage} />
      </Card>

      {open && <ApplicationDialog id={open} onClose={() => setOpen(null)} onChanged={load} />}
    </>
  );
}
