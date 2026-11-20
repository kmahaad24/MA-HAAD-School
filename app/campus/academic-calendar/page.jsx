import { FaInfoCircle } from 'react-icons/fa';
import { EVENT_TYPES } from '@/data/calendar';
import { currentSession } from '@/server/services/content.service';
import { getContents } from '@/server/services/site-content.service';
import { pageMetadata } from '@/lib/seo';
import PageBanner from '@/components/school/PageBanner';
import SectionHeading from '@/components/school/SectionHeading';
import Container from '@/components/ui/Container';
import PrintActions from '@/components/print/PrintActions';
import YearCalendar, { Legend } from '@/components/school/YearCalendar';
import { byMonth as groupByMonth, formatRange, weekdayRange, workingDays } from '@/lib/calendar';
import { cn } from '@/lib/utils';

export async function generateMetadata() {
  const [session, { general, campus }] = await Promise.all([currentSession(), getContents('general', 'campus')]);
  return pageMetadata({
    title: 'Academic Calendar',
    description: `Academic calendar for ${session.label} at ${general.identity.name} — examinations, events and holidays.`,
    path: '/campus/academic-calendar',
    image: campus.calendar.image,
  });
}

// The session is managed in Dashboard → Academic Sessions
export default async function AcademicCalendarPage() {
  const [session, { campus }] = await Promise.all([currentSession(), getContents('campus')]);
  const entries = [...session.events, ...session.holidays].sort((a, b) => a.date.localeCompare(b.date));
  const byMonth = groupByMonth(entries);

  return (
    <>
      <PageBanner title="Academic Calendar" subtitle={session.label} breadcrumbs={[{ label: campus.banner.title, href: '/campus' }, { label: 'Academic Calendar' }]} image={campus.calendar.image} />

      <section className="py-14 md:py-16">
        <Container>
          <SectionHeading kicker={session.label} title={`Academic Calendar ${session.year}`} subtitle={campus.calendar.subtitle} />

          {!session.confirmed && campus.calendar.tentativeNote && (
            <p className="mx-auto mt-6 flex max-w-3xl items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              <FaInfoCircle className="mt-0.5 shrink-0" aria-hidden />
              {campus.calendar.tentativeNote}
            </p>
          )}

          <div className="mt-8 flex flex-col gap-4 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <Legend weekendLabel={session.weekendLabel} />
            <PrintActions base="/campus/academic-calendar" className="shrink-0" />
          </div>

          <div className="mt-6">
            <YearCalendar year={session.year} entries={entries} weekend={session.weekend} />
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[280px_1fr]">
            <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
              <div className="rounded-2xl bg-navy-900 p-6 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold-300">Working days</p>
                <p className="mt-2 font-display text-5xl">{workingDays(session.year, entries, session.weekend)}</p>
                {campus.calendar.resumeNote && <p className="mt-2 text-sm text-white/70">{campus.calendar.resumeNote}</p>}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                <p className="font-semibold text-navy-900">Weekly holidays</p>
                <p className="mt-1">{session.weekendLabel}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="grid grid-cols-[130px_1fr] bg-navy-900 px-5 py-3 text-sm font-semibold text-white sm:grid-cols-[160px_1fr]">
                <span>Key dates</span>
                <span>Details / activities</span>
              </div>
              {byMonth.map((month) => (
                <div key={month.name}>
                  <p className="bg-brand-50 px-5 py-2 text-center text-sm font-bold text-brand-800">{month.name} {session.year}</p>
                  <ul className="divide-y divide-slate-100">
                    {month.items.map((e) => (
                      <li key={`${e.date}-${e.title}`} className="grid grid-cols-[130px_1fr] items-start gap-2 px-5 py-2.5 text-sm sm:grid-cols-[160px_1fr]">
                        <span className="font-medium text-navy-900">
                          {formatRange(e)}
                          <span className="block text-xs font-normal text-slate-400">{weekdayRange(e)}</span>
                        </span>
                        <span className="flex flex-wrap items-center gap-2 text-slate-600">
                          <span className={cn('h-2 w-2 shrink-0 rounded-full', (EVENT_TYPES[e.type] || EVENT_TYPES.event).dot)} aria-hidden />
                          {e.title}
                          {e.tentative && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">Tentative</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
