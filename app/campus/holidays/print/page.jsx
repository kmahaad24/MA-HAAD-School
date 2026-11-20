import { EVENT_TYPES } from '@/data/calendar';
import { currentSession } from '@/server/services/content.service';
import { getContents } from '@/server/services/site-content.service';
import { dayCount, formatRange, holidayStats, weekdayRange } from '@/lib/calendar';
import PrintSheet, { Letterhead, PrintFooter } from '@/components/print/PrintSheet';
import PrintToolbar from '@/components/print/PrintToolbar';

export async function generateMetadata() {
  const session = await currentSession();
  return { title: `List of Holidays ${session.year} — print`, robots: { index: false } };
}

// A4 print version of /campus/holidays
export default async function HolidaysPrintPage() {
  const [session, { general, campus }] = await Promise.all([currentSession(), getContents('general', 'campus')]);
  const list = [...session.holidays].sort((a, b) => a.date.localeCompare(b.date) || dayCount(b) - dayCount(a));
  const stats = holidayStats(list, session.weekend);
  const tentative = list.some((h) => h.tentative);

  return (
    <div className="print-desk">
      <PrintToolbar backHref="/campus/holidays" backLabel="Back to page" pdfHref="/campus/holidays/pdf" title="List of Holidays" />
      <PrintSheet>
        <Letterhead general={general} title={`List of Holidays ${session.year}`} subtitle={`${session.label} · Weekly holidays: ${session.weekendLabel}`} badge={session.confirmed ? null : 'Tentative — dates confirmed by notice'} />

        <table className="text-[8.5pt] leading-snug">
          <thead>
            <tr className="bg-navy-900 text-left text-white">
              <th className="w-[8mm] px-2 py-1.5 font-semibold">#</th>
              <th className="px-2 py-1.5 font-semibold">Occasion</th>
              <th className="w-[38mm] px-2 py-1.5 font-semibold">Date</th>
              <th className="w-[24mm] px-2 py-1.5 font-semibold">Day</th>
              <th className="w-[13mm] px-2 py-1.5 text-right font-semibold">Days</th>
            </tr>
          </thead>
          <tbody>
            {list.map((h, i) => {
              const type = EVENT_TYPES[h.type] || EVENT_TYPES.holiday;
              const inside = stats.overlaps.get(h);
              return (
                <tr key={`${h.date}-${h.title}`} className="border-b border-slate-200 even:bg-slate-50">
                  <td className="px-2 py-[3px] align-top text-slate-400">{i + 1}</td>
                  <td className="px-2 py-[3px] align-top">
                    <p className="font-semibold text-navy-900">{h.title}</p>
                    <p className="text-[7.5pt] text-slate-500">
                      <span className={`mr-1 inline-block h-2 w-2 rounded-full align-middle ${type.dot}`} /> {h.kind || type.label}
                      {h.tentative && <span className="ml-2 font-semibold text-amber-700">Tentative</span>}
                      {inside && <span className="ml-2 italic">Falls within: {inside.join(', ')}</span>}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-2 py-[3px] align-top">{formatRange(h, { year: true })}</td>
                  <td className="whitespace-nowrap px-2 py-[3px] align-top text-slate-600">{weekdayRange(h)}</td>
                  <td className="px-2 py-1.5 text-right align-top font-semibold">{dayCount(h)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          {[
            [list.length, 'Holidays & vacations'],
            [stats.calendarDays, 'Days off (incl. weekends)'],
            [stats.schoolDays, 'School days off'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2">
              <p className="font-display text-[16pt] font-bold leading-none text-navy-900">{value}</p>
              <p className="mt-1 text-[7.5pt] uppercase tracking-wide text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 space-y-0.5 text-[8pt] text-slate-600">
          <p>• Days that fall within another holiday or vacation are counted once in the totals.</p>
          {campus.holidays.intro && <p>• {campus.holidays.intro}</p>}
          {tentative && !campus.holidays.intro && <p>• Dates marked “Tentative” depend on the moon or on a Government notice and may change.</p>}
        </div>

        <PrintFooter general={general} note={`Weekly holidays: ${session.weekendLabel}.`} />
      </PrintSheet>
    </div>
  );
}
