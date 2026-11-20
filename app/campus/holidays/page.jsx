import { EVENT_TYPES } from '@/data/calendar';
import { currentSession } from '@/server/services/content.service';
import { getContents } from '@/server/services/site-content.service';
import { pageMetadata } from '@/lib/seo';
import PageBanner from '@/components/school/PageBanner';
import SubpageLayout from '@/components/school/SubpageLayout';
import { Kicker } from '@/components/school/SectionHeading';
import PrintActions from '@/components/print/PrintActions';
import { dayCount, formatRange, holidayStats, weekdayRange } from '@/lib/calendar';
import { cn } from '@/lib/utils';

export async function generateMetadata() {
  const [session, { general, campus }] = await Promise.all([currentSession(), getContents('general', 'campus')]);
  return pageMetadata({ title: 'List of Holidays', description: `Holidays for ${session.label} at ${general.identity.name}.`, path: '/campus/holidays', image: campus.holidays.image });
}

// The session is managed in Dashboard → Academic Sessions
export default async function HolidaysPage() {
  const [session, { campus }] = await Promise.all([currentSession(), getContents('campus')]);
  const list = [...session.holidays].sort((a, b) => a.date.localeCompare(b.date) || dayCount(b) - dayCount(a));
  // Overlapping days (e.g. Christmas inside the winter vacation) are counted once
  const stats = holidayStats(list, session.weekend);

  return (
    <>
      <PageBanner title="List of Holidays" subtitle={session.label} breadcrumbs={[{ label: campus.banner.title, href: '/campus' }, { label: 'List of Holidays' }]} image={campus.holidays.image} />
      <SubpageLayout section="/campus" current="/campus/holidays">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Kicker>{session.label}</Kicker>
            <h2 className="mt-4 font-display text-3xl text-navy-900">Holidays & Vacations</h2>
          </div>
          <PrintActions base="/campus/holidays" />
        </div>
        <p className="prose-school mt-4">
          Weekly holidays: <strong>{session.weekendLabel}</strong>. {campus.holidays.intro}
        </p>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-navy-900 text-left text-white">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">#</th>
                <th scope="col" className="px-4 py-3 font-semibold">Occasion</th>
                <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                <th scope="col" className="px-4 py-3 font-semibold">Day</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((h, i) => (
                <tr key={`${h.date}-${h.title}`} className="even:bg-slate-50/60">
                  <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-navy-900">{h.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className={cn('h-2 w-2 rounded-full', (EVENT_TYPES[h.type] || EVENT_TYPES.holiday).dot)} aria-hidden /> {h.kind || (EVENT_TYPES[h.type] || EVENT_TYPES.holiday).label}
                      {h.tentative && <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800">Tentative</span>}
                      {stats.overlaps.get(h) && <span className="italic">Falls within: {stats.overlaps.get(h).join(', ')}</span>}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatRange(h)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                    {weekdayRange(h)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-navy-900">{dayCount(h)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-brand-50">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right font-semibold text-navy-900">Total days off (including weekends; overlaps counted once)</td>
                <td className="px-4 py-3 text-right font-bold text-brand-700">{stats.calendarDays}</td>
              </tr>
              <tr className="border-t border-brand-100">
                <td colSpan={4} className="px-4 py-3 text-right font-semibold text-navy-900">School days off (excluding weekly holidays)</td>
                <td className="px-4 py-3 text-right font-bold text-brand-700">{stats.schoolDays}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </SubpageLayout>
    </>
  );
}
