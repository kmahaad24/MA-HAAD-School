'use client';
import { useEffect, useMemo, useState } from 'react';
import { FaExternalLinkAlt, FaUndo, FaSave } from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import { apiSecure, apiError } from '@/lib/api-client';
import { getSection } from '@/content/schema';
import { formatDate } from '@/lib/utils';
import SchemaForm from '@/components/dashboard/SchemaForm';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { FormSkeleton } from '@/components/loading/PageSkeletons';

/**
 * Editor for one Website Content section (form drawn from src/content/schema.js). Used inside the
 * Website Content page; remount it with `key={sectionKey}` to switch sections.
 *   onDirtyChange(bool) — unsaved changes (the page asks before switching away)
 *   onSaved(updatedAt | null) — after a save or a reset, so the section list can update
 */
export default function ContentEditor({ sectionKey, icon: SectionIcon, onDirtyChange, onSaved }) {
  const section = useMemo(() => getSection(sectionKey), [sectionKey]);
  const loaded = useApi(`/content/${sectionKey}`, { select: (res) => res.data });
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  const saved = loaded.data?.value;
  const value = draft ?? saved;
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(saved);

  // Tell the page, and warn before closing the tab with unsaved changes
  useEffect(() => {
    onDirtyChange?.(dirty);
    if (!dirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, onDirtyChange]);

  const save = async () => {
    setSaving(true);
    setStatus({ type: '', text: '' });
    try {
      const res = await apiSecure.put(`/content/${sectionKey}`, draft ?? saved);
      loaded.setData(res.data.data);
      setDraft(null);
      setStatus({ type: 'success', text: res.data.message || 'Saved.' });
      onSaved?.(res.data.data.updatedAt);
    } catch (err) {
      setStatus({ type: 'error', text: apiError(err, 'Could not save. Please check the fields and try again.') });
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!window.confirm(`Put back the original text for “${section.title}”? Everything saved in this section will be replaced.`)) return;
    setSaving(true);
    try {
      const res = await apiSecure.delete(`/content/${sectionKey}`);
      loaded.setData(res.data.data);
      setDraft(null);
      setStatus({ type: 'success', text: res.data.message || 'Restored.' });
      onSaved?.(null);
    } catch (err) {
      setStatus({ type: 'error', text: apiError(err, 'Could not restore.') });
    } finally {
      setSaving(false);
    }
  };

  if (!section) return <Alert type="error">This content section does not exist.</Alert>;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="animate-fade-in rounded-2xl border border-line/10 bg-surface shadow-sm"
    >
      {/* Section header */}
      <div className="flex flex-col gap-4 border-b border-line/10 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex min-w-0 gap-4">
          {SectionIcon && (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 text-xl text-white shadow-sm">
              <SectionIcon aria-hidden />
            </span>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-faint">{section.group}</p>
            <h2 className="mt-0.5 text-xl text-ink">{section.title}</h2>
            <p className="mt-1 text-sm text-muted">{section.description}</p>
          </div>
        </div>
        {section.view && (
          <Button variant="secondary" size="sm" href={section.view} target="_blank" className="shrink-0">
            <FaExternalLinkAlt aria-hidden /> View page
          </Button>
        )}
      </div>

      <div className="p-5 sm:p-6">
        <Alert type="error" className="mb-4">{loaded.error}</Alert>
        {loaded.loading || !value ? <FormSkeleton cards={2} /> : <SchemaForm fields={section.fields} value={value} onChange={setDraft} />}
      </div>

      {/* Save bar stays in view while scrolling long forms */}
      <div className="sticky bottom-0 z-10 flex flex-col gap-3 rounded-b-2xl border-t border-line/10 bg-surface/95 px-5 py-3 backdrop-blur sm:flex-row sm:items-center sm:px-6">
        <div className="min-w-0 flex-1 text-sm">
          {status.text ? (
            <Alert type={status.type || 'info'} className="py-1.5">{status.text}</Alert>
          ) : dirty ? (
            <span className="inline-flex items-center gap-2 font-medium text-amber-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" aria-hidden /> Unsaved changes
            </span>
          ) : (
            <span className="text-subtle">{loaded.data?.updatedAt ? `Last saved ${formatDate(loaded.data.updatedAt, true)}` : 'Showing the original text'}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {loaded.data?.customised && (
            <Button variant="ghost" onClick={reset} disabled={saving}>
              <FaUndo aria-hidden /> Original
            </Button>
          )}
          {dirty && (
            <Button variant="secondary" onClick={() => setDraft(null)} disabled={saving}>
              Discard
            </Button>
          )}
          <Button type="submit" disabled={saving || !dirty}>
            <FaSave aria-hidden /> {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}
