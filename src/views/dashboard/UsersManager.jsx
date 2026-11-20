'use client';
import { useCallback, useEffect, useState } from 'react';
import { FaUserPlus, FaUsers, FaUserShield, FaUserEdit, FaUserSlash, FaKey, FaTrashAlt, FaRandom, FaEye, FaEyeSlash } from 'react-icons/fa';
import useAuth from '@/hooks/useAuth';
import { apiSecure, apiError } from '@/lib/api-client';
import { ROLES, ROLE_INFO } from '@/config/roles';
import { cn, formatDate } from '@/lib/utils';
import PageTitle from '@/components/dashboard/PageTitle';
import StatCard, { StatGrid } from '@/components/dashboard/StatCard';
import FilterBar from '@/components/dashboard/FilterBar';
import Modal from '@/components/dashboard/Modal';
import UserAvatar from '@/components/dashboard/UserAvatar';
import { TableRowsSkeleton } from '@/components/loading/PageSkeletons';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import EmptyState from '@/components/ui/EmptyState';
import { Input } from '@/components/forms/FormField';

const EMPTY = { name: '', email: '', phone: '', designation: '', role: 'editor', status: 'active', password: '' };

// 14 random letters/digits (no look-alikes such as 0/O, 1/l)
function randomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const values = crypto.getRandomValues(new Uint32Array(14));
  return Array.from(values, (v) => chars[v % chars.length]).join('');
}

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

function UserDialog({ user, me, onClose, onSaved }) {
  const isNew = !user;
  const isSelf = user && user._id === me?._id;
  const [form, setForm] = useState(() => (user ? { ...EMPTY, ...user, password: '' } : EMPTY));
  const [showPassword, setShowPassword] = useState(isNew);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = { name: form.name, email: form.email, phone: form.phone, designation: form.designation };
      if (!isSelf) Object.assign(body, { role: form.role, status: form.status });
      if (form.password) body.password = form.password;
      const res = isNew ? await apiSecure.post('/users', body) : await apiSecure.patch(`/users/${user._id}`, body);
      onSaved(res.data.message);
    } catch (err) {
      setError(apiError(err, 'Could not save.'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete the account of ${user.name}? They will not be able to sign in again.`)) return;
    setBusy(true);
    try {
      const res = await apiSecure.delete(`/users/${user._id}`);
      onSaved(res.data.message);
    } catch (err) {
      setError(apiError(err, 'Could not delete.'));
      setBusy(false);
    }
  };

  return (
    <Modal
      title={isNew ? 'Add a user' : `Edit ${user.name}`}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          {!isNew && !isSelf && (
            <Button variant="danger" onClick={remove} disabled={busy} className="sm:mr-auto">
              <FaTrashAlt aria-hidden /> Delete
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : isNew ? 'Add user' : 'Save changes'}</Button>
        </>
      }
    >
      <Alert type="error">{error}</Alert>
      {isSelf && <Alert type="info">This is your account. Change your own password and photo in My Profile.</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" name="user-name" value={form.name} onChange={set('name')} required maxLength={120} autoComplete="off" />
        <Input label="Email (used to sign in)" name="user-email" type="email" value={form.email} onChange={set('email')} required maxLength={160} autoComplete="off" />
        <Input label="Phone" name="user-phone" type="tel" value={form.phone} onChange={set('phone')} maxLength={30} />
        <Input label="Designation" name="user-designation" value={form.designation} onChange={set('designation')} maxLength={120} placeholder="e.g. Office Assistant" />
      </div>

      <fieldset disabled={isSelf}>
        <legend className="mb-2 text-sm font-medium text-body">Role</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {ROLES.map((role) => (
            <label
              key={role}
              className={cn(
                'flex cursor-pointer gap-3 rounded-xl border p-3 transition',
                form.role === role ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-line/15 hover:border-line/30',
                isSelf && 'cursor-not-allowed opacity-60'
              )}
            >
              <input type="radio" name="user-role" value={role} checked={form.role === role} onChange={set('role')} className="mt-1 accent-primary-600" />
              <span>
                <span className="block text-sm font-semibold text-ink">{ROLE_INFO[role].label}</span>
                <span className="block text-xs text-muted">{ROLE_INFO[role].description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {!isNew && !isSelf && (
        <label className="flex items-center justify-between gap-4 rounded-xl border border-line/15 p-3">
          <span>
            <span className="block text-sm font-semibold text-ink">Account active</span>
            <span className="block text-xs text-muted">A suspended person is signed out at once and cannot sign in.</span>
          </span>
          <input
            type="checkbox"
            checked={form.status === 'active'}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked ? 'active' : 'suspended' }))}
            className="h-5 w-5 accent-primary-600"
          />
        </label>
      )}

      {!isSelf && (
        <div>
          <label htmlFor="user-password" className="mb-1 flex items-center gap-2 text-sm font-medium text-body">
            <FaKey className="text-xs text-faint" aria-hidden /> {isNew ? 'Password' : 'Reset password (optional)'} {isNew && <span className="text-red-500">*</span>}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="user-password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                required={isNew}
                minLength={8}
                autoComplete="new-password"
                placeholder={isNew ? 'At least 8 characters' : 'Leave empty to keep the current password'}
                className="w-full rounded-lg border border-line/20 bg-surface px-3 py-2 pr-10 font-mono text-sm text-ink focus:border-primary-500 focus:outline-none"
              />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-faint hover:text-ink" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <FaEyeSlash aria-hidden /> : <FaEye aria-hidden />}
              </button>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setForm((f) => ({ ...f, password: randomPassword() }));
                setShowPassword(true);
              }}
            >
              <FaRandom aria-hidden /> Generate
            </Button>
          </div>
          <p className="mt-1 text-xs text-subtle">Share the password with the person privately; they can change it in My Profile.{!isNew && ' Resetting it signs them out of every device.'}</p>
        </div>
      )}
    </Modal>
  );
}

// Dashboard → Users (admins): add, edit, suspend and delete dashboard accounts
export default function UsersManager() {
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, 'new' or a user
  const query = useDebounced(search);

  const load = useCallback(
    () =>
      apiSecure
        .get(`/users?${new URLSearchParams({ search: query, role, status })}`)
        .then((res) => {
          setData(res.data.data);
          setError('');
        })
        .catch((err) => setError(apiError(err, 'Users could not be loaded.')))
        .finally(() => setLoading(false)),
    [query, role, status]
  );

  useEffect(() => {
    load();
  }, [load]);

  const counts = data?.counts || {};

  return (
    <>
      <PageTitle
        title="Users"
        description="People who can sign in to this dashboard. Admins can do everything; editors manage the website content."
        actions={
          <Button onClick={() => setEditing('new')}>
            <FaUserPlus aria-hidden /> Add user
          </Button>
        }
      />

      <StatGrid>
        <StatCard label="All users" value={counts.total} icon={FaUsers} loading={loading} />
        <StatCard label="Admins" value={counts.admin} icon={FaUserShield} tone="red" loading={loading} />
        <StatCard label="Editors" value={counts.editor} icon={FaUserEdit} tone="green" loading={loading} />
        <StatCard label="Suspended" value={counts.suspended} icon={FaUserSlash} tone="amber" loading={loading} />
      </StatGrid>

      <Alert type="success" className="mb-4">{notice}</Alert>
      <Alert type="error" className="mb-4">{error}</Alert>

      <Card className="p-0">
        <FilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Search name, email, phone…"
          filters={[
            { key: 'role', value: role, onChange: setRole, options: [{ value: '', label: 'All roles' }, ...ROLES.map((r) => ({ value: r, label: ROLE_INFO[r].label }))] },
            { key: 'status', value: status, onChange: setStatus, options: [{ value: '', label: 'Any status' }, { value: 'active', label: 'Active' }, { value: 'suspended', label: 'Suspended' }] },
          ]}
        />
        {loading ? (
          <TableRowsSkeleton rows={4} cols={4} />
        ) : !data?.items.length ? (
          <EmptyState icon={FaUsers} title="No users found" description="Try another search, or add a user." />
        ) : (
          <ul className="divide-y divide-line/5">
            {data.items.map((u) => {
              const isSelf = u._id === me?._id;
              return (
                <li key={u._id}>
                  <button type="button" onClick={() => setEditing(u)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-line/5 sm:gap-4">
                    <UserAvatar user={u} />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold text-ink">{u.name}</span>
                        {isSelf && <Badge color="blue">You</Badge>}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {u.email}
                        {u.designation && ` · ${u.designation}`}
                      </span>
                    </span>
                    <span className="hidden w-40 shrink-0 text-xs text-subtle md:block">{u.lastLoginAt ? `Last sign-in ${formatDate(u.lastLoginAt, true)}` : 'Never signed in'}</span>
                    <span className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center">
                      <Badge color={u.role === 'admin' ? 'red' : 'green'}>{ROLE_INFO[u.role]?.label || u.role}</Badge>
                      {u.status !== 'active' && <Badge color="amber">Suspended</Badge>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {editing && (
        <UserDialog
          user={editing === 'new' ? null : editing}
          me={me}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setNotice(message);
            load();
          }}
        />
      )}
    </>
  );
}
