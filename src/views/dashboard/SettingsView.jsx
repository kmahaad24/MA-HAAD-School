'use client';
import { useEffect, useMemo, useState } from 'react';
import { FaClock } from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import { apiSecure, apiError } from '@/lib/api-client';
import { DEFAULT_TIME_ZONE, offsetLabel, setTimeZone } from '@/lib/timezone';
import PageTitle from '@/components/dashboard/PageTitle';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { FormSkeleton } from '@/components/loading/PageSkeletons';
import EmailSettings from './EmailSettings';

const PINNED_ZONES = ['Asia/Dhaka', 'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'America/New_York', 'UTC'];

function allTimeZones() {
  try {
    const zones = Intl.supportedValuesOf('timeZone');
    return [...PINNED_ZONES, ...zones.filter((z) => !PINNED_ZONES.includes(z))];
  } catch {
    return PINNED_ZONES;
  }
}

function useClock(timeZone) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    const tick = () => setNow(new Intl.DateTimeFormat('en-GB', { timeZone, dateStyle: 'full', timeStyle: 'medium' }).format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timeZone]);
  return now;
}

function Section({ icon: Icon, title, description, children, footer }) {
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
      {footer && <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line/10 px-5 py-3">{footer}</div>}
    </Card>
  );
}

function TimezoneSettings() {
  const loaded = useApi('/settings/site', { select: (res) => res.data });
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const zones = useMemo(() => allTimeZones(), []);
  const timeZone = draft ?? loaded.data?.timezone ?? DEFAULT_TIME_ZONE;
  const clock = useClock(timeZone);

  const save = async () => {
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await apiSecure.put('/settings/site', { timezone: timeZone });
      loaded.setData(res.data.data);
      setDraft(null);
      setTimeZone(res.data.data.timezone); // dates in this tab use the new zone right away
      setStatus({ type: 'success', message: 'Saved.' });
    } catch (err) {
      setStatus({ type: 'error', message: apiError(err, 'Could not save.') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section
      icon={FaClock}
      title="Timezone"
      description="Used for every date and time on the site and dashboard."
      footer={
        <>
          <Alert type={status.type || 'info'} className="mr-auto py-1.5">{status.message}</Alert>
          <Button onClick={save} disabled={saving || draft === null}>{saving ? 'Saving…' : 'Save timezone'}</Button>
        </>
      }
    >
      {loaded.loading ? (
        <FormSkeleton cards={1} />
      ) : (
        <>
          <label htmlFor="timezone" className="mb-1 block text-sm font-medium text-body">Site timezone</label>
          <select
            id="timezone"
            value={timeZone}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-lg border border-line/20 bg-surface px-3 py-2 text-sm text-ink focus:border-primary-500 focus:outline-none"
          >
            {zones.map((z) => (
              <option key={z} value={z}>
                {z.replace(/_/g, ' ')} ({offsetLabel(z)})
              </option>
            ))}
          </select>
          <div className="mt-4 rounded-lg border border-line/10 bg-canvas px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-subtle">Current time in {timeZone.replace(/_/g, ' ')}</p>
            <p className="mt-1 font-mono text-sm text-ink">{clock || '…'}</p>
          </div>
        </>
      )}
    </Section>
  );
}

export default function SettingsView() {
  return (
    <>
      <PageTitle title="Settings" description="Site-wide options for the website and dashboard. Your password and theme are in My Profile." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <EmailSettings />
        <div className="space-y-6">
          <TimezoneSettings />
        </div>
      </div>
    </>
  );
}
