'use client';
import { useCallback, useRef, useState } from 'react';
import { getSection } from '@/content/schema';
import { cn } from '@/lib/utils';
import PageTitle from '@/components/dashboard/PageTitle';
import ContentEditor from './ContentEditor';
import { sectionIcon } from './sectionMeta';

// The tab to open: ?tab=rules in the address (this view only renders in the browser)
function initialTab(keys) {
  if (typeof window === 'undefined') return keys[0];
  const tab = new URLSearchParams(window.location.search).get('tab');
  return keys.includes(tab) ? tab : keys[0];
}

/**
 * A dashboard page that edits one or more Website Content sections, e.g. /dashboard/menus or
 * /dashboard/admission (several sections → tabs). See SECTION_PAGES in ./sectionMeta.js.
 */
export default function SectionsPage({ title, description, keys }) {
  const [active, setActive] = useState(() => initialTab(keys));
  const dirty = useRef(false);
  const onDirtyChange = useCallback((value) => {
    dirty.current = value;
  }, []);

  const open = (key) => {
    if (key === active) return;
    if (dirty.current && !window.confirm('You have unsaved changes in this tab. Leave without saving?')) return;
    dirty.current = false;
    setActive(key);
    window.history.replaceState(null, '', `?tab=${key}`);
  };

  // One section: the editor header is the page title
  if (keys.length === 1) return <ContentEditor sectionKey={keys[0]} icon={sectionIcon(keys[0])} onDirtyChange={onDirtyChange} />;

  return (
    <>
      <PageTitle title={title} description={description} />
      <div role="tablist" aria-label={title} className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-line/10 bg-surface p-1 shadow-sm scrollbar-none">
        {keys.map((key) => {
          const Icon = sectionIcon(key);
          const selected = key === active;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => open(key)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition',
                selected ? 'bg-primary-600 text-white shadow-sm' : 'text-muted hover:bg-line/5 hover:text-ink'
              )}
            >
              <Icon aria-hidden /> {getSection(key)?.title}
            </button>
          );
        })}
      </div>
      <ContentEditor key={active} sectionKey={active} icon={sectionIcon(active)} onDirtyChange={onDirtyChange} />
    </>
  );
}
