// Website content edited in Dashboard → Website Content. Each section (src/content/schema.js) is stored as one
// SiteContent document and merged over the built-in defaults (src/content/defaults.js) when read.
// Reads are cached in memory; a save clears the cache and refreshes the pages.
import { cache as perRequest } from 'react';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/db';
import SiteContent from '@/models/SiteContent';
import { CONTENT_SECTIONS, getSection } from '@/content/schema';
import { CONTENT_DEFAULTS } from '@/content/defaults';
import { cached, invalidate } from '@/server/cache';
import { sanitizeSection } from '@/server/content-sanitize';
import { HttpError } from '@/server/http';
import { toPlain } from '@/server/validate';

const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

// Saved values over defaults: objects merge key by key, arrays and plain values replace
function merge(base, saved) {
  if (!isObject(base) || !isObject(saved)) return saved === undefined ? base : saved;
  const out = { ...base };
  for (const [k, v] of Object.entries(saved)) out[k] = k in base ? merge(base[k], v) : v;
  return out;
}

const defaultsOf = (key) => structuredClone(CONTENT_DEFAULTS[key] ?? {});

// ---------- automatic menu links ----------
// Facilities and class levels each have their own page, so their menu links are kept in step automatically:
// adding, renaming, reordering or removing a facility / class level updates the "Facilities" and "Admission"
// dropdowns (and the footer's admission column) — no need to edit Menus as well.
// Other links in those dropdowns (e.g. Admission Information) are kept after the automatic ones.
const FIXED_ADMISSION_PAGES = new Set(['/admission/information', '/admission/rules-and-regulations', '/admission/transfer-procedure', '/admission/prospectus']);

const AUTO_MENUS = [
  {
    href: '/facilities',
    links: (all) => all.facilities.items.map((f) => ({ label: f.title, href: `/facilities/${f.slug}` })),
    // Any /facilities/<page> link is generated; the rest are the admin's own links
    isAuto: (href) => /^\/facilities\/[^/]+$/.test(href),
  },
  {
    href: '/admission',
    links: (all) => all.admission.programs.map((p) => ({ label: p.title, href: `/admission/${p.slug}` })),
    isAuto: (href) => /^\/admission\/[^/]+$/.test(href) && !FIXED_ADMISSION_PAGES.has(href),
  },
];

const syncLinks = (generated, existing = [], isAuto) => [...generated, ...existing.filter((l) => !isAuto(l.href))];

export function withAutoMenus(navigation, all) {
  const nav = structuredClone(navigation);
  for (const auto of AUTO_MENUS) {
    const item = nav.main?.find((i) => i.href === auto.href);
    if (item) item.children = syncLinks(auto.links(all), item.children, auto.isAuto);
  }
  // Footer "Admission" column follows the class levels too (only if it already lists them)
  const admission = AUTO_MENUS[1];
  if (nav.footerAdmission?.some((l) => admission.isAuto(l.href))) nav.footerAdmission = syncLinks(admission.links(all), nav.footerAdmission, admission.isAuto);
  return nav;
}

function finish(all) {
  return { ...all, navigation: withAutoMenus(all.navigation, all) };
}

async function loadAll() {
  try {
    await connectDB();
    const docs = await SiteContent.find().lean();
    return finish(Object.fromEntries(CONTENT_SECTIONS.map(({ key }) => [key, toPlain(merge(defaultsOf(key), docs.find((d) => d.key === key)?.value))])));
  } catch (error) {
    // Database unreachable — the site still works with the built-in text
    console.error('Website content could not be loaded:', error.message);
    return finish(Object.fromEntries(CONTENT_SECTIONS.map(({ key }) => [key, defaultsOf(key)])));
  }
}

// All sections in one read (cached 60 s, cleared on save). perRequest() lets a page, its metadata and
// its components share one result.
export const getAllContent = perRequest(() => cached('content:all', loadAll));

export async function getContent(key) {
  if (!getSection(key)) throw new Error(`Unknown content section: ${key}`);
  return (await getAllContent())[key];
}

// Several sections at once: const { general, home } = await getContents('general', 'home')
export async function getContents(...keys) {
  const all = await getAllContent();
  return Object.fromEntries(keys.map((k) => [k, all[k]]));
}

// ---------- dashboard ----------

export async function listSections() {
  await connectDB();
  const docs = await SiteContent.find().select('key updatedAt').lean();
  return CONTENT_SECTIONS.map(({ key, group, title, description, view }) => ({
    key,
    group,
    title,
    description,
    view,
    updatedAt: docs.find((d) => d.key === key)?.updatedAt || null,
  }));
}

function sectionOr404(key) {
  const section = getSection(key);
  if (!section) throw new HttpError(404, 'Unknown content section.');
  return section;
}

export async function readSection(key) {
  const section = sectionOr404(key);
  await connectDB();
  const doc = await SiteContent.findOne({ key }).lean();
  let value = merge(defaultsOf(key), doc?.value);
  // The Menus editor shows the facility / class-level links exactly as the website does
  if (key === 'navigation') value = withAutoMenus(value, await loadAll());
  return toPlain({ key, title: section.title, value, customised: Boolean(doc), updatedAt: doc?.updatedAt || null });
}

function refresh() {
  invalidate('content:');
  try {
    revalidatePath('/', 'layout');
  } catch {
    /* called outside a request (scripts) */
  }
}

export async function updateSection(key, input, { userId } = {}) {
  const section = sectionOr404(key);
  const value = sanitizeSection(section, input, defaultsOf(key));
  await connectDB();
  await SiteContent.updateOne({ key }, { $set: { value, updatedBy: userId } }, { upsert: true });
  refresh();
  return readSection(key);
}

// Back to the built-in text
export async function resetSection(key) {
  const section = sectionOr404(key);
  await connectDB();
  await SiteContent.deleteOne({ key });
  refresh();
  return { ...(await readSection(key)), title: section.title };
}
