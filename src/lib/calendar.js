// Academic-calendar arithmetic shared by the web pages, the print pages and the PDF downloads, so they all
// show the same numbers. Dates are "YYYY-MM-DD" strings handled in UTC (no timezone shifts).

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// When several things fall on one day, the first in this list colours the day
export const PRIORITY = ['holiday', 'vacation', 'exam', 'meeting', 'event'];

const utc = (date) => new Date(`${date}T00:00:00Z`);
const pad = (n) => String(n).padStart(2, '0');
export const dateKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

// Every date from start to end (inclusive)
export function expand(start, end = start) {
  const out = [];
  const d = utc(start);
  const last = utc(end || start);
  while (d <= last) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

export const dayCount = (e) => expand(e.date, e.end).length;
export const weekdayOf = (date, style = 'short') => utc(date).toLocaleDateString('en-GB', { weekday: style, timeZone: 'UTC' });
export const isWeekend = (date, weekend = []) => weekend.includes(utc(date).getUTCDay());

// "12 Jan" or "12 – 20 Jan" / "28 Jan – 3 Feb"
export function formatRange(entry, { year = false } = {}) {
  const opts = { day: 'numeric', month: 'short', timeZone: 'UTC', ...(year && { year: 'numeric' }) };
  const a = utc(entry.date).toLocaleDateString('en-GB', opts);
  if (!entry.end || entry.end === entry.date) return a;
  return `${a} – ${utc(entry.end).toLocaleDateString('en-GB', opts)}`;
}

// Weekday(s) of an entry: "Sun" or "Sun – Tue"
export const weekdayRange = (e) => (e.end && e.end !== e.date ? `${weekdayOf(e.date)} – ${weekdayOf(e.end)}` : weekdayOf(e.date));

// date → entries on that day
export function buildDayMap(entries) {
  const map = new Map();
  entries.forEach((entry) =>
    expand(entry.date, entry.end).forEach((date) => {
      const list = map.get(date) || [];
      list.push(entry);
      map.set(date, list);
    })
  );
  return map;
}

export const typeOfDay = (entries = []) => PRIORITY.find((t) => entries.some((e) => e.type === t));

// Days off the school calendar: holidays and vacations
const isOff = (e) => e.type === 'holiday' || e.type === 'vacation';

/**
 * Holiday totals without double counting: a holiday inside a vacation (e.g. Christmas during the winter
 * vacation) is one day off, not two.
 *   calendarDays  — distinct calendar days off (including weekends)
 *   schoolDays    — distinct days off that would otherwise be school days (weekends excluded)
 *   overlaps      — Map(entry → titles of the vacations / holidays it overlaps)
 */
export function holidayStats(holidays, weekend = []) {
  const off = new Map();
  holidays.filter(isOff).forEach((h) => expand(h.date, h.end).forEach((d) => off.set(d, [...(off.get(d) || []), h])));
  const overlaps = new Map();
  holidays.forEach((h) => {
    const others = new Set();
    expand(h.date, h.end).forEach((d) => (off.get(d) || []).forEach((o) => o !== h && others.add(o.title)));
    if (others.size) overlaps.set(h, [...others]);
  });
  const days = [...off.keys()];
  return { calendarDays: days.length, schoolDays: days.filter((d) => !isWeekend(d, weekend)).length, overlaps };
}

// Days in the year that are not a weekend, holiday or vacation
export function workingDays(year, entries, weekend = []) {
  const off = new Set(entries.filter(isOff).flatMap((e) => expand(e.date, e.end)));
  let count = 0;
  for (const d = new Date(Date.UTC(year, 0, 1)); d.getUTCFullYear() === year; d.setUTCDate(d.getUTCDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    if (!weekend.includes(d.getUTCDay()) && !off.has(key)) count += 1;
  }
  return count;
}

// Entries grouped by the month they start in: [{ name, month, items }]
export function byMonth(entries) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date) || (a.end || a.date).localeCompare(b.end || b.date));
  return MONTHS.map((name, m) => ({ name, month: m, items: sorted.filter((e) => Number(e.date.slice(5, 7)) === m + 1) })).filter((g) => g.items.length);
}

// Mini-calendar cells for one month: null for the blanks before the 1st
export function monthCells(year, month) {
  const first = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
}
