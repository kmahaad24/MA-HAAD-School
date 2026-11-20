import { EVENT_TYPES } from '@/data/calendar';
import { MONTHS, DAY_LETTERS, buildDayMap, dateKey, monthCells, typeOfDay } from '@/lib/calendar';
import { cn } from '@/lib/utils';

export { formatRange, weekdayOf, buildDayMap } from '@/lib/calendar';

function Month({ year, month, dayMap, weekend, compact }) {
  const cells = monthCells(year, month);
  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white', compact ? 'break-inside-avoid rounded-lg p-2' : 'p-4 shadow-sm')}>
      <p className={cn('font-display text-navy-900', compact ? 'mb-1 text-[11pt] font-bold' : 'mb-3 text-lg')}>
        {MONTHS[month]} <span className="text-gold-700">’{String(year).slice(2)}</span>
      </p>
      <div className={cn('grid grid-cols-7 text-center', compact ? 'gap-px text-[8pt]' : 'gap-1 text-xs')}>
        {DAY_LETTERS.map((d, i) => (
          <span key={i} className={cn('font-semibold', compact ? 'py-0.5' : 'py-1', weekend.includes(i) ? 'text-emerald-700' : 'text-slate-400')}>{d}</span>
        ))}
        {cells.map((day, i) => {
          if (!day) return <span key={`e-${i}`} />;
          const date = dateKey(year, month, day);
          const entries = dayMap.get(date) || [];
          const type = typeOfDay(entries);
          const isWeekend = weekend.includes(i % 7);
          return (
            <span key={date} className="cal-day" data-t={type || (isWeekend ? 'w' : undefined)} title={entries.length ? entries.map((e) => e.title).join(' · ') : undefined}>
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function Legend({ weekendLabel, className }) {
  return (
    <ul className={cn('flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600', className)}>
      {Object.entries(EVENT_TYPES).map(([type, { label, cell }]) => (
        <li key={type} className="flex items-center gap-2">
          <span className={cn('h-4 w-4 rounded', cell)} aria-hidden /> {label}
        </li>
      ))}
      <li className="flex items-center gap-2">
        <span className="h-4 w-4 rounded bg-emerald-50 ring-1 ring-emerald-200" aria-hidden /> Weekend ({weekendLabel})
      </li>
    </ul>
  );
}

// Twelve month grids for one year, colour-coded by event type. `compact` = the A4 print layout.
export default function YearCalendar({ year, entries, weekend, compact = false }) {
  const dayMap = buildDayMap(entries);
  return (
    <div className={cn('grid', compact ? 'cal-compact grid-cols-3 gap-2' : 'gap-4 sm:grid-cols-2 xl:grid-cols-3')}>
      {Array.from({ length: 12 }, (_, m) => (
        <Month key={m} year={year} month={m} dayMap={dayMap} weekend={weekend} compact={compact} />
      ))}
    </div>
  );
}
