'use client';
import { useCallback, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { FaSearch, FaCheckCircle, FaChevronRight } from 'react-icons/fa';
import useApi from '@/hooks/useApi';
import { CONTENT_SECTIONS } from '@/content/schema';
import { cn, formatDate } from '@/lib/utils';
import PageTitle from '@/components/dashboard/PageTitle';
import Alert from '@/components/ui/Alert';
import ContentEditor from './ContentEditor';
import { SECTION_PAGES, pageForSection, sectionIcon } from './sectionMeta';

// Sections with their own dashboard page (School Information, Menus, Home Page, Admission) are not listed here
const SECTIONS = CONTENT_SECTIONS.filter((s) => !pageForSection(s.key));
const GROUPS = [...new Set(SECTIONS.map((s) => s.group))];

// The section to open: ?section=home in the address (this view only renders in the browser)
function initialSection() {
  if (typeof window === 'undefined') return SECTIONS[0].key;
  const key = new URLSearchParams(window.location.search).get('section');
  return SECTIONS.some((s) => s.key === key) ? key : SECTIONS[0].key;
}

// Dashboard → Website Content: every editable part of the public website on one page —
// sections on the left, the editor of the chosen section on the right.
export default function ContentIndex() {
  const { data: saved, setData: setSaved, error } = useApi('/content', { initialData: [], select: (res) => res.data });
  const [active, setActive] = useState(initialSection);
  const [search, setSearch] = useState('');
  const dirty = useRef(false);

  const savedAt = useMemo(() => Object.fromEntries(saved.map((s) => [s.key, s.updatedAt])), [saved]);
  const q = search.trim().toLowerCase();
  const visible = SECTIONS.filter((s) => !q || `${s.title} ${s.description} ${s.group}`.toLowerCase().includes(q));

  const open = (key) => {
    if (key === active) return;
    if (dirty.current && !window.confirm('You have unsaved changes in this section. Leave without saving?')) return;
    dirty.current = false;
    setActive(key);
    window.history.replaceState(null, '', `?section=${key}`);
    // Bring the editor into view on phones
    if (window.innerWidth < 1024) document.getElementById('content-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const onDirtyChange = useCallback((value) => {
    dirty.current = value;
  }, []);
  const onSaved = useCallback((updatedAt) => setSaved((list) => list.map((s) => (s.key === active ? { ...s, updatedAt } : s))), [active, setSaved]);

  const customised = saved.filter((s) => s.updatedAt && !pageForSection(s.key)).length;

  return (
    <>
      <PageTitle
        title="Page Content"
        description="Text and photos of the website pages. Changes appear on the site as soon as you save."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-line/10 bg-surface px-3 py-1.5 text-xs text-muted">
            <FaCheckCircle className="text-green-600" aria-hidden /> {customised} of {SECTIONS.length} sections customised
          </span>
        }
      />
      <Alert type="error" className="mb-4">{error}</Alert>

      {/* Shortcuts to the sections that moved to their own pages */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {SECTION_PAGES.map((p) => {
          const Icon = sectionIcon(p.keys[0]);
          return (
            <Link key={p.href} href={p.href} className="group flex items-center gap-3 rounded-xl border border-line/10 bg-surface p-3 shadow-sm transition hover:border-primary-300 hover:shadow-md">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
                <Icon aria-hidden />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{p.title}</span>
              <FaChevronRight className="shrink-0 text-[10px] text-faint transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          );
        })}
      </div>

      {/* Phones / tablets: pick a section from a list */}
      <div className="mb-4 lg:hidden">
        <label htmlFor="section-picker" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-faint">Section</label>
        <select
          id="section-picker"
          value={active}
          onChange={(e) => open(e.target.value)}
          className="w-full rounded-xl border border-line/20 bg-surface px-3 py-3 text-sm font-medium text-ink focus:border-primary-500 focus:outline-none"
        >
          {GROUPS.map((group) => (
            <optgroup key={group} label={group}>
              {SECTIONS.filter((s) => s.group === group).map((s) => (
                <option key={s.key} value={s.key}>{s.title}{savedAt[s.key] ? ' ✓' : ''}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        {/* Desktop: section list */}
        <aside className="hidden lg:block">
          <nav aria-label="Content sections" className="sticky top-20 flex max-h-[calc(100vh-6rem)] flex-col overflow-hidden rounded-2xl border border-line/10 bg-surface shadow-sm">
            <div className="border-b border-line/10 p-3">
              <label className="relative block">
                <span className="sr-only">Find a section</span>
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-faint" aria-hidden />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find a section…"
                  className="w-full rounded-lg border border-line/15 bg-canvas py-2 pl-8 pr-3 text-sm text-ink focus:border-primary-500 focus:outline-none"
                />
              </label>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-3">
              {GROUPS.map((group) => {
                const items = visible.filter((s) => s.group === group);
                if (!items.length) return null;
                return (
                  <div key={group}>
                    <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-faint">{group}</p>
                    <ul className="space-y-0.5">
                      {items.map((s) => {
                        const Icon = sectionIcon(s.key);
                        const isActive = s.key === active;
                        return (
                          <li key={s.key}>
                            <button
                              type="button"
                              onClick={() => open(s.key)}
                              aria-current={isActive ? 'page' : undefined}
                              title={savedAt[s.key] ? `Saved ${formatDate(savedAt[s.key], true)}` : 'Original text'}
                              className={cn(
                                'group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition',
                                isActive ? 'bg-primary-50 font-semibold text-primary-700 dark:bg-primary-500/15 dark:text-primary-300' : 'text-body hover:bg-line/5 hover:text-ink'
                              )}
                            >
                              <span
                                className={cn(
                                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm transition',
                                  isActive ? 'bg-primary-600 text-white' : 'bg-line/5 text-muted group-hover:text-primary-600'
                                )}
                              >
                                <Icon aria-hidden />
                              </span>
                              <span className="min-w-0 flex-1 truncate">{s.title}</span>
                              {savedAt[s.key] && <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" aria-label="customised" />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
              {!visible.length && <p className="px-2 py-6 text-center text-sm text-subtle">No section matches “{search}”.</p>}
            </div>
            <p className="flex items-center gap-2 border-t border-line/10 px-4 py-2.5 text-xs text-subtle">
              <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden /> Customised · others show the original text
            </p>
          </nav>
        </aside>

        {/* Editor of the chosen section */}
        <section id="content-editor" className="min-w-0 scroll-mt-4">
          <ContentEditor key={active} sectionKey={active} icon={sectionIcon(active)} onDirtyChange={onDirtyChange} onSaved={onSaved} />
        </section>
      </div>
    </>
  );
}
