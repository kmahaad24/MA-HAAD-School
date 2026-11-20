import { EVENT_TYPES } from '@/data/calendar';
import { currentSession } from '@/server/services/content.service';
import { getContents } from '@/server/services/site-content.service';
import { byMonth, formatRange, holidayStats, weekdayRange, workingDays } from '@/lib/calendar';
import YearCalendar from '@/components/school/YearCalendar';
import PrintSheet, { Letterhead, PrintFooter } from '@/components/print/PrintSheet';
import PrintToolbar from '@/components/print/PrintToolbar';
import { cn } from '@/lib/utils';

export async function generateMetadata() {
  const session = await currentSession();
  return { title: `Academic Calendar ${session.year} — print`, robots: { index: false } };
}

// A4 print version of /campus/academic-calendar: page 1 = the year at a glance, page 2+ = key dates
export default async function AcademicCalendarPrintPage() {
  const [session, { general, campus }] = await Promise.all([currentSession(), getContents('general', 'campus')]);
  const entries = [...session.events, ...session.holidays];
  const months = byMonth(entries);
  const stats = holidayStats(session.holidays, session.weekend);
  const badge = session.confirmed ? null : 'Tentative plan';

  return (
    <div className="print-desk">
      <PrintToolbar backHref="/campus/academic-calendar" backLabel="Back to page" pdfHref="/campus/academic-calendar/pdf" title="Academic Calendar" />
      <PrintSheet>
        {/* Page 1 — the year at a glance */}
        <Letterhead general={general} title={`Academic Calendar ${session.year}`} subtitle={campus.calendar.subtitle || session.label} badge={badge} />

        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[7.5pt] text-slate-700">
            {Object.entries(EVENT_TYPES).map(([type, { label, cell }]) => (
              <li key={type} className="flex items-center gap-1.5">
                <span className={cn('h-3 w-3 rounded-sm', cell)} /> {label}
              </li>
            ))}
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-emerald-50 ring-1 ring-emerald-200" /> Weekend ({session.weekendLabel})
            </li>
          </ul>
          <p className="text-[8pt] text-slate-600">
            <strong className="text-navy-900">{workingDays(session.year, entries, session.weekend)}</strong> working days · <strong className="text-navy-900">{stats.calendarDays}</strong> days of holidays & vacations
          </p>
        </div>

        <YearCalendar year={session.year} entries={entries} weekend={session.weekend} compact />

        {!session.confirmed && campus.calendar.tentativeNote && <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[8pt] text-amber-900">{campus.calendar.tentativeNote}</p>}

        {/* Page 2+ — key dates */}
        <section className="page-break pt-1">
          <h2 className="mb-2 font-display text-[14pt] font-bold text-navy-900">Key dates — {session.label}</h2>
          <table className="text-[8.5pt]">
            <thead>
              <tr className="bg-navy-900 text-left text-white">
                <th className="w-[36mm] px-2 py-1.5 font-semibold">Date</th>
                <th className="w-[22mm] px-2 py-1.5 font-semibold">Day</th>
                <th className="px-2 py-1.5 font-semibold">Details / activities</th>
              </tr>
            </thead>
            {months.map((month) => (
              <tbody key={month.name}>
                <tr className="bg-brand-50">
                  <td colSpan={3} className="px-2 py-1 text-center text-[8pt] font-bold uppercase tracking-wider text-brand-800">
                    {month.name} {session.year}
                  </td>
                </tr>
                {month.items.map((e) => {
                  const type = EVENT_TYPES[e.type] || EVENT_TYPES.event;
                  return (
                    <tr key={`${e.date}-${e.title}`} className="border-b border-slate-200">
                      <td className="whitespace-nowrap px-2 py-1 align-top font-medium text-navy-900">{formatRange(e)}</td>
                      <td className="whitespace-nowrap px-2 py-1 align-top text-slate-600">{weekdayRange(e)}</td>
                      <td className="px-2 py-1 align-top">
                        <span className={cn('mr-1.5 inline-block h-2 w-2 rounded-full align-middle', type.dot)} />
                        {e.title}
                        <span className="ml-1.5 text-[7pt] text-slate-500">({type.label})</span>
                        {e.tentative && <span className="ml-1.5 text-[7pt] font-semibold text-amber-700">Tentative</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
          <PrintFooter general={general} note={`Weekly holidays: ${session.weekendLabel}. ${campus.calendar.resumeNote || ''}`.trim()} />
        </section>
      </PrintSheet>
    </div>
  );
}
