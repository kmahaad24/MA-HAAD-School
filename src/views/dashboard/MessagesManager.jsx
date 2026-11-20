'use client';
import { useCallback, useEffect, useState } from 'react';
import { FaEnvelope, FaPhoneAlt, FaReply, FaTrashAlt, FaArchive, FaCheck, FaRedo, FaEnvelopeOpen, FaInbox, FaFileExcel, FaFilePdf } from 'react-icons/fa';
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

const TABS = [
  { value: '', label: 'Inbox' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
  { value: 'archived', label: 'Archived' },
];
const STATUS_COLOR = { unread: 'blue', read: 'gray', replied: 'green', archived: 'amber' };
const EMAIL_LABEL = { sent: ['green', 'sent'], failed: ['red', 'failed'], pending: ['amber', 'sending'], off: ['gray', 'off'] };

function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

function EmailState({ label, state }) {
  const [color, text] = EMAIL_LABEL[state] || EMAIL_LABEL.off;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      {label}: <Badge color={color}>{text}</Badge>
    </span>
  );
}

function MessageDialog({ id, onClose, onChanged }) {
  const [message, setMessage] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  useEffect(() => {
    let active = true;
    apiSecure
      .get(`/contact/${id}`)
      .then(async (res) => {
        if (!active) return;
        let m = res.data.data;
        // Opening an unread message marks it as read
        if (m.status === 'unread') {
          m = (await apiSecure.patch(`/contact/${id}`, { status: 'read' })).data.data;
          onChanged();
        }
        if (active) {
          setMessage(m);
          setNote(m.note || '');
        }
      })
      .catch((err) => active && setStatus({ type: 'error', text: apiError(err, 'Could not open the message.') }));
    return () => {
      active = false;
    };
  }, [id, onChanged]);

  const act = async (fn, done) => {
    setBusy(true);
    setStatus({ type: '', text: '' });
    try {
      const res = await fn();
      if (res?.data?.data) setMessage(res.data.data);
      setStatus({ type: 'success', text: res?.data?.message || 'Saved.' });
      onChanged();
      done?.();
    } catch (err) {
      setStatus({ type: 'error', text: apiError(err, 'Something went wrong.') });
    } finally {
      setBusy(false);
    }
  };

  const setMessageStatus = (s) => act(() => apiSecure.patch(`/contact/${id}`, { status: s }));
  const remove = () => {
    if (!window.confirm('Delete this message permanently?')) return;
    act(() => apiSecure.delete(`/contact/${id}`), onClose);
  };

  const replyHref = message
    ? `mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject || 'Your message'}`)}&body=${encodeURIComponent(`\n\n— On ${formatDate(message.createdAt, true)}, ${message.fullName} wrote:\n${message.message}`)}`
    : '#';

  return (
    <Modal title={message ? message.subject || 'Message' : 'Message'} onClose={onClose} size="max-w-3xl">
      <Alert type={status.type || 'info'}>{status.text}</Alert>
      {!message ? (
        !status.text && <TableRowsSkeleton rows={3} cols={1} />
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-ink">{message.fullName}</p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <a href={`mailto:${message.email}`} className="inline-flex items-center gap-1.5 text-primary-600 hover:underline dark:text-primary-400">
                  <FaEnvelope className="text-xs" aria-hidden /> {message.email}
                </a>
                {message.phone && (
                  <a href={telHref(message.phone)} className="inline-flex items-center gap-1.5 text-primary-600 hover:underline dark:text-primary-400">
                    <FaPhoneAlt className="text-xs" aria-hidden /> {message.phone}
                  </a>
                )}
              </div>
            </div>
            <div className="text-right">
              <Badge color={STATUS_COLOR[message.status]}>{message.status}</Badge>
              <p className="mt-1 text-xs text-subtle">{formatDate(message.createdAt, true)}</p>
            </div>
          </div>

          <div className="whitespace-pre-wrap rounded-xl border border-line/10 bg-canvas p-4 text-sm leading-relaxed text-body">{message.message}</div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <EmailState label="Email to school" state={message.emailAdmin} />
            <EmailState label="Confirmation to sender" state={message.emailSender} />
            {(message.emailAdmin === 'failed' || message.emailSender === 'failed') && (
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => act(() => apiSecure.post(`/contact/${id}/resend`))}>
                <FaRedo aria-hidden /> Send again
              </Button>
            )}
          </div>
          {message.emailError && <p className="text-xs text-red-600">{message.emailError}</p>}

          <div>
            <label htmlFor="message-note" className="mb-1 block text-sm font-medium text-body">Office note (private)</label>
            <textarea
              id="message-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
              placeholder="e.g. Called back on Sunday, visit booked for Monday"
              className="w-full rounded-lg border border-line/20 bg-surface px-3 py-2 text-sm text-ink focus:border-primary-500 focus:outline-none"
            />
            {note !== (message.note || '') && (
              <Button size="sm" className="mt-2" disabled={busy} onClick={() => act(() => apiSecure.patch(`/contact/${id}`, { note }))}>
                Save note
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-line/10 pt-4">
            <Button href={replyHref} onClick={() => message.status !== 'replied' && setMessageStatus('replied')}>
              <FaReply aria-hidden /> Reply by email
            </Button>
            {message.status !== 'replied' && (
              <Button variant="secondary" disabled={busy} onClick={() => setMessageStatus('replied')}>
                <FaCheck aria-hidden /> Mark replied
              </Button>
            )}
            {message.status !== 'unread' && (
              <Button variant="secondary" disabled={busy} onClick={() => setMessageStatus('unread')}>
                <FaEnvelope aria-hidden /> Mark unread
              </Button>
            )}
            {message.status !== 'archived' ? (
              <Button variant="secondary" disabled={busy} onClick={() => setMessageStatus('archived')}>
                <FaArchive aria-hidden /> Archive
              </Button>
            ) : (
              <Button variant="secondary" disabled={busy} onClick={() => setMessageStatus('read')}>
                <FaInbox aria-hidden /> Move to inbox
              </Button>
            )}
            <Button variant="danger" className="sm:ml-auto" disabled={busy} onClick={remove}>
              <FaTrashAlt aria-hidden /> Delete
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}

// Excel / PDF of the requests in the current tab and search (server builds the file, the browser downloads it)
function ExportButtons({ status, search, disabled }) {
  const href = (format) => `/api/contact/export?${new URLSearchParams({ format, status, search })}`;
  const base = 'inline-flex items-center gap-2 rounded-lg border border-line/20 bg-surface px-3 py-2 text-sm font-medium text-body transition hover:bg-line/5';
  if (disabled) {
    return (
      <span className="text-xs text-subtle">Nothing to download in this view</span>
    );
  }
  return (
    <>
      <a href={href('xlsx')} download className={base} title="Download as an Excel spreadsheet">
        <FaFileExcel className="text-green-600" aria-hidden /> Excel
      </a>
      <a href={href('pdf')} download className={base} title="Download as a PDF">
        <FaFilePdf className="text-red-600" aria-hidden /> PDF
      </a>
    </>
  );
}

// Dashboard → Messages: everything sent from the Contact page
export default function MessagesManager() {
  const [tab, setTab] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Link from the notification email: /dashboard/messages?open=<id> (this view only renders in the browser)
  const [open, setOpen] = useState(() => (typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('open')));
  const query = useDebounced(search);

  const load = useCallback(() => {
    const params = new URLSearchParams({ status: tab, search: query, page: String(page) });
    return apiSecure
      .get(`/contact?${params}`)
      .then((res) => {
        setData(res.data.data);
        setError('');
      })
      .catch((err) => setError(apiError(err, 'Messages could not be loaded.')))
      .finally(() => setLoading(false));
  }, [tab, query, page]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = data?.counts || {};
  const inboxCount = (counts.unread || 0) + (counts.read || 0) + (counts.replied || 0);

  return (
    <>
      <PageTitle
        title="Contact Requests"
        description="Everything sent from the website’s Contact Us page is saved here. Reply by email, keep notes and mark requests as replied."
        actions={<ExportButtons status={tab} search={query} disabled={!data?.total} />}
      />
      {data && !data.mail && (
        <Alert type="warning" className="mb-4">
          Email is not set up yet, so no notifications or confirmations are sent. Requests are still saved here. An admin can turn email on in Settings → Email.
        </Alert>
      )}
      <Alert type="error" className="mb-4">{error}</Alert>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-line/10 bg-surface p-1 scrollbar-none">
        {TABS.map((t) => {
          const count = t.value ? counts[t.value] : inboxCount;
          return (
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
              {count > 0 && <span className={cn('rounded-full px-1.5 text-xs', t.value === 'unread' ? 'bg-primary-600 text-white' : 'bg-line/10')}>{count}</span>}
            </button>
          );
        })}
      </div>

      <Card className="p-0">
        <FilterBar
          search={search}
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search name, email, phone or message…"
        />
        {loading ? (
          <TableRowsSkeleton rows={6} cols={3} />
        ) : !data?.items.length ? (
          <EmptyState icon={FaEnvelopeOpen} title={query ? 'No messages match your search' : 'No messages here'} description="Messages sent from the Contact page appear here." />
        ) : (
          <ul className="divide-y divide-line/5">
            {data.items.map((m) => (
              <li key={m._id}>
                <button type="button" onClick={() => setOpen(m._id)} className="flex w-full gap-3 px-4 py-3.5 text-left transition hover:bg-line/5">
                  <span className={cn('mt-2 h-2 w-2 shrink-0 rounded-full', m.status === 'unread' ? 'bg-primary-600' : 'bg-transparent')} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className={cn('truncate text-sm', m.status === 'unread' ? 'font-bold text-ink' : 'font-medium text-body')}>{m.fullName}</span>
                      <span className="shrink-0 text-xs text-subtle">{formatDate(m.createdAt, true)}</span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      {m.subject && <span className="truncate text-sm text-body">{m.subject}</span>}
                      <Badge color={STATUS_COLOR[m.status]} className="shrink-0">{m.status}</Badge>
                      {(m.emailAdmin === 'failed' || m.emailSender === 'failed') && <Badge color="red" className="shrink-0">email failed</Badge>}
                    </span>
                    <span className="mt-0.5 line-clamp-1 block text-sm text-muted">{m.message}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Pagination page={data?.page || 1} pageCount={data?.pages || 1} onChange={setPage} />
      </Card>

      {open && <MessageDialog id={open} onClose={() => setOpen(null)} onChanged={load} />}
    </>
  );
}
