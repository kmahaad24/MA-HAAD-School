'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FaSearch, FaEnvelope, FaBullhorn, FaUsers, FaImages, FaCalendarAlt, FaUserCircle, FaArrowRight, FaFileAlt, FaSlidersH } from 'react-icons/fa';
import { dashboardNav } from '@/config/navigation';
import { canOpen } from '@/config/roles';
import { CONTENT_SECTIONS } from '@/content/schema';
import { pageForSection, sectionIcon } from '@/views/dashboard/sectionMeta';
import useAuth from '@/hooks/useAuth';
import { apiSecure } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const DATA_ICONS = { envelope: FaEnvelope, bullhorn: FaBullhorn, users: FaUsers, images: FaImages, calendar: FaCalendarAlt, user: FaUserCircle };

// Where a Website Content section is edited
function sectionHref(key) {
  const page = pageForSection(key);
  if (!page) return `/dashboard/content?section=${key}`;
  return page.keys.length > 1 ? `${page.href}?tab=${key}` : page.href;
}

// Everything that can be found without asking the server: dashboard pages, content sections and every field in them
function buildIndex(role) {
  const items = [];
  dashboardNav.forEach((g) =>
    g.items.filter((i) => canOpen(role, i.href)).forEach((i) => items.push({ group: 'Dashboard pages', title: i.label, subtitle: g.title, href: i.href, Icon: i.icon, keywords: '' }))
  );
  [
    { title: 'Email settings (SMTP)', subtitle: 'Settings', href: '/dashboard/settings', keywords: 'smtp mail server password sender', admin: true },
    { title: 'Timezone', subtitle: 'Settings', href: '/dashboard/settings', keywords: 'time zone clock date', admin: true },
    { title: 'Change my password', subtitle: 'My Profile', href: '/dashboard/profile', keywords: 'password security' },
    { title: 'Dark mode / theme', subtitle: 'My Profile', href: '/dashboard/profile', keywords: 'appearance light dark theme' },
    { title: 'Download contact requests (Excel / PDF)', subtitle: 'Contact Requests', href: '/dashboard/messages', keywords: 'export xlsx pdf download' },
  ]
    .filter((s) => !s.admin || role === 'admin')
    .forEach((s) => items.push({ group: 'Settings & actions', Icon: FaSlidersH, ...s }));

  CONTENT_SECTIONS.forEach((section) => {
    const href = sectionHref(section.key);
    const Icon = sectionIcon(section.key);
    items.push({ group: 'Website content', title: section.title, subtitle: section.description, href, Icon, keywords: section.group });
    const walk = (fields, trail) =>
      fields.forEach((f) => {
        const path = [...trail, f.label];
        items.push({ group: 'Content fields', title: f.label, subtitle: path.slice(0, -1).join(' › '), href, Icon: FaFileAlt, keywords: f.help || '' });
        if (f.fields) walk(f.fields, path);
      });
    walk(section.fields, [section.title]);
  });
  return items;
}

// Every word must appear; titles that start with the words come first
function matchStatic(index, query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const words = q.split(/\s+/);
  const seen = new Set();
  return index
    .map((item) => {
      const title = item.title.toLowerCase();
      const hay = `${title} ${item.subtitle || ''} ${item.keywords || ''}`.toLowerCase();
      if (!words.every((w) => hay.includes(w))) return null;
      return { ...item, score: title.startsWith(q) ? 3 : title.includes(q) ? 2 : 1 };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .filter((i) => {
      const key = `${i.group}|${i.title}|${i.href}|${i.subtitle}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

const GROUP_LIMIT = { 'Dashboard pages': 6, 'Settings & actions': 4, 'Website content': 5, 'Content fields': 6 };

/**
 * Search box at the top of the dashboard (also Ctrl+K / ⌘K or "/"). Finds dashboard pages, settings,
 * Website Content sections and fields, and records: contact requests, notices, staff, photos, sessions and users.
 */
export default function DashboardSearch({ className }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [remote, setRemote] = useState({ q: '', groups: [] });
  const input = useRef(null);
  const list = useRef(null);
  const debounced = useDebounced(query.trim(), 250);

  const index = useMemo(() => buildIndex(user?.role), [user?.role]);

  const openSearch = () => {
    setQuery('');
    setActive(0);
    setOpen(true);
  };

  // Ctrl+K / ⌘K anywhere, or "/" when not typing in a field
  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        setQuery('');
        setActive(0);
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Records from the database
  useEffect(() => {
    if (!open || debounced.length < 2) return;
    const controller = new AbortController();
    apiSecure
      .get('/search', { params: { q: debounced }, signal: controller.signal })
      .then((res) => setRemote({ q: debounced, groups: res.data.data || [] }))
      .catch(() => {});
    return () => controller.abort();
  }, [debounced, open]);

  useEffect(() => {
    if (!open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const trimmed = query.trim();
  const searching = trimmed.length >= 2 && remote.q !== trimmed;

  // Results: data first (most specific), then pages, settings, content sections and fields
  const groups = useMemo(() => {
    if (!trimmed) {
      return [{ group: 'Jump to', items: index.filter((i) => i.group === 'Dashboard pages').slice(0, 8) }];
    }
    const local = matchStatic(index, trimmed);
    const byGroup = (name) => ({ group: name, items: local.filter((i) => i.group === name).slice(0, GROUP_LIMIT[name]) });
    const data = remote.q === trimmed ? remote.groups.map((g) => ({ ...g, items: g.items.map((i) => ({ ...i, Icon: DATA_ICONS[i.icon] || FaFileAlt })) })) : [];
    return [byGroup('Dashboard pages'), ...data, byGroup('Settings & actions'), byGroup('Website content'), byGroup('Content fields')].filter((g) => g.items.length);
  }, [trimmed, index, remote]);

  const flat = groups.flatMap((g) => g.items);
  const current = Math.min(active, Math.max(flat.length - 1, 0));

  useEffect(() => {
    list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [current]);

  const go = (item) => {
    if (!item) return;
    setOpen(false);
    // Same page with a different ?tab / ?section: reload so the page opens on that item
    if (item.href.split('?')[0] === pathname && item.href.includes('?')) window.location.assign(item.href);
    else router.push(item.href);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((current + 1) % Math.max(flat.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((current - 1 + flat.length) % Math.max(flat.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(flat[current]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  let position = -1;

  return (
    <>
      {/* Trigger: full box on larger screens, icon on phones */}
      <button
        type="button"
        onClick={openSearch}
        className={cn(
          'group flex items-center gap-3 rounded-xl border border-line/15 bg-canvas text-sm text-subtle transition hover:border-primary-300 hover:text-body sm:w-72 sm:px-3 sm:py-2',
          'h-10 w-10 justify-center sm:h-auto sm:justify-start',
          className
        )}
        aria-label="Search the dashboard"
      >
        <FaSearch className="shrink-0" aria-hidden />
        <span className="hidden flex-1 truncate text-left sm:block">Search pages, requests, notices…</span>
        <kbd className="hidden shrink-0 rounded-md border border-line/20 bg-surface px-1.5 py-0.5 font-sans text-[11px] text-faint md:block">Ctrl K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 p-3 pt-[8vh] backdrop-blur-sm sm:p-6 sm:pt-[10vh]" role="dialog" aria-modal="true" aria-label="Search">
          <button type="button" className="absolute inset-0 cursor-default" onClick={() => setOpen(false)} aria-label="Close search" tabIndex={-1} />
          <div className="relative flex max-h-[80vh] w-full max-w-2xl animate-fade-in flex-col overflow-hidden rounded-2xl border border-line/10 bg-surface shadow-2xl">
            <div className="flex items-center gap-3 border-b border-line/10 px-4">
              <FaSearch className="shrink-0 text-faint" aria-hidden />
              <input
                ref={input}
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Search pages, settings, content, requests, notices, staff…"
                className="h-14 flex-1 bg-transparent text-base text-ink placeholder-faint outline-none"
                role="combobox"
                aria-expanded="true"
                aria-controls="dashboard-search-results"
                aria-activedescendant={flat.length ? `search-item-${current}` : undefined}
              />
              {searching && <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-line/20 border-t-primary-600" aria-label="Searching" />}
              <button type="button" onClick={() => setOpen(false)} className="shrink-0 rounded-md border border-line/20 px-1.5 py-0.5 text-[11px] text-faint hover:text-ink">
                Esc
              </button>
            </div>

            <div ref={list} id="dashboard-search-results" role="listbox" className="flex-1 overflow-y-auto p-2">
              {groups.map((g) => (
                <div key={g.group} className="mb-2">
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-faint">{g.group}</p>
                  <ul>
                    {g.items.map((item) => {
                      position += 1;
                      const i = position;
                      const selected = i === current;
                      const Icon = item.Icon || FaFileAlt;
                      return (
                        <li key={`${g.group}-${i}`} id={`search-item-${i}`} role="option" aria-selected={selected}>
                          <button
                            type="button"
                            data-active={selected}
                            onMouseMove={() => active !== i && setActive(i)}
                            onClick={() => go(item)}
                            className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition', selected ? 'bg-primary-50 dark:bg-primary-500/15' : 'hover:bg-line/5')}
                          >
                            {item.image ? (
                              // eslint-disable-next-line @next/next/no-img-element -- small thumbnail
                              <img src={item.image} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" loading="lazy" />
                            ) : (
                              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm', selected ? 'bg-primary-600 text-white' : 'bg-line/5 text-muted')}>
                                <Icon aria-hidden />
                              </span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className={cn('block truncate text-sm font-medium', selected ? 'text-primary-700 dark:text-primary-300' : 'text-ink')}>{item.title}</span>
                              {item.subtitle && <span className="block truncate text-xs text-subtle">{item.subtitle}</span>}
                            </span>
                            {item.badge && <span className="shrink-0 rounded-full bg-line/10 px-2 py-0.5 text-[10px] font-medium capitalize text-muted">{item.badge}</span>}
                            {selected && <FaArrowRight className="shrink-0 text-xs text-primary-600" aria-hidden />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              {trimmed && !flat.length && !searching && (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-medium text-body">Nothing found for “{trimmed}”</p>
                  <p className="mt-1 text-xs text-subtle">Try another word — a name, email, notice title or setting.</p>
                </div>
              )}
              {trimmed.length === 1 && <p className="px-4 pb-3 text-xs text-subtle">Type one more letter to search records too.</p>}
            </div>

            <div className="hidden items-center gap-4 border-t border-line/10 px-4 py-2 text-[11px] text-faint sm:flex">
              <span><kbd className="font-sans">↑ ↓</kbd> move</span>
              <span><kbd className="font-sans">Enter</kbd> open</span>
              <span><kbd className="font-sans">Esc</kbd> close</span>
              <span className="ml-auto">Ctrl K or / to search from anywhere</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
