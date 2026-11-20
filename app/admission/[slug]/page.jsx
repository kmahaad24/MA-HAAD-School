import { notFound } from 'next/navigation';
import { FaFilePdf, FaPhoneAlt, FaCheckCircle } from 'react-icons/fa';
import { getContents } from '@/server/services/site-content.service';
import { pageMetadata } from '@/lib/seo';
import { telHref } from '@/lib/utils';
import SmartImage from '@/components/ui/SmartImage';
import RichText from '@/components/ui/RichText';
import PageBanner from '@/components/school/PageBanner';
import SubpageLayout from '@/components/school/SubpageLayout';
import PrintButton from '@/components/school/PrintButton';
import { BodyHeading, CheckList, NoteBox, PillButton, Steps, delay } from '@/components/school/Blocks';

// Fixed pages under /admission; class-level pages (/admission/pg-kg …) come from Website Content → Admission & classes
const PAGES = {
  information: { title: 'Admission Information', section: 'admissionInfo' },
  'rules-and-regulations': { title: 'Rules and Regulations', section: 'rules' },
  'transfer-procedure': { title: 'Transfer Procedure', section: 'transfer' },
  prospectus: { title: 'Prospectus', section: 'prospectus' },
};

async function load(slug) {
  const content = await getContents('admission', 'admissionInfo', 'rules', 'transfer', 'prospectus', 'general');
  const program = content.admission.programs.find((p) => p.slug === slug);
  if (program) return { content, page: { title: program.title, description: program.summary, image: program.image, program } };
  const fixed = PAGES[slug];
  if (!fixed) return { content, page: null };
  const data = content[fixed.section];
  return { content, page: { ...fixed, description: data.intro, image: data.image } };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { content, page } = await load(slug);
  if (!page) return {};
  return pageMetadata({ title: page.title, description: page.description, path: `/admission/${slug}`, image: page.image || content.admission.banner.image });
}

function AgeTable({ ages, note }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <p className="bg-navy-900 px-5 py-3 font-display text-lg text-white">Age guideline</p>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-slate-100">
          {ages.map((row) => (
            <tr key={row.className}>
              <th scope="row" className="px-5 py-3 text-left font-semibold text-navy-900">{row.className}</th>
              <td className="px-5 py-3 text-right text-slate-600">{row.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {note && <p className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500">{note}</p>}
    </div>
  );
}

function Program({ program, ageNote, phone }) {
  return (
    <>
      {program.image && (
        <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-slate-100 shadow-xl shadow-navy-900/10">
          <SmartImage src={program.image} alt={program.title} fill sizes="(min-width: 1024px) 800px, 100vw" className="object-cover" />
          {program.level && <span className="absolute left-4 top-4 rounded-full bg-gold-400 px-3 py-1 text-xs font-bold uppercase tracking-wider text-navy-950">{program.level}</span>}
        </div>
      )}
      <BodyHeading kicker="Admission" title={program.title} className="mt-10" />
      <RichText value={program.paragraphs} className="prose-school mt-5" />

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {program.ages.length > 0 && <AgeTable ages={program.ages} note={ageNote} />}
        {program.subjects.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="font-display text-lg text-navy-900">Main subjects</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {program.subjects.map((s) => <li key={s} className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700">{s}</li>)}
            </ul>
          </div>
        )}
      </div>

      {program.assessment && <NoteBox title="Admission test" className="mt-6">{program.assessment}</NoteBox>}

      <div className="mt-8 flex flex-wrap gap-3">
        <PillButton href="/admission/information">How to apply</PillButton>
        {phone && <PillButton href={telHref(phone)} variant="outline"><FaPhoneAlt aria-hidden /> {phone}</PillButton>}
      </div>
    </>
  );
}

function Information({ info, programs }) {
  const rows = programs.flatMap((p) => p.ages.map((row) => ({ ...row, level: p.level })));
  return (
    <>
      <BodyHeading kicker="How to apply" title="Admission Information" />
      {info.intro && <p className="prose-school mt-5">{info.intro}</p>}

      {info.steps.length > 0 && (
        <>
          <h3 className="mt-10 font-display text-2xl text-navy-900">Admission steps</h3>
          <Steps steps={info.steps} />
        </>
      )}

      {info.documents.length > 0 && (
        <>
          <h3 className="mt-12 font-display text-2xl text-navy-900">Documents required</h3>
          <CheckList items={info.documents} className="mt-5" />
        </>
      )}

      {rows.length > 0 && (
        <>
          <h3 className="mt-12 font-display text-2xl text-navy-900">Age guideline</h3>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-navy-900 text-left text-white">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Class</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Level</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Minimum age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={`${row.level}-${row.className}`} className="even:bg-slate-50/60">
                    <td className="px-5 py-2.5 font-medium text-navy-900">{row.className}</td>
                    <td className="px-5 py-2.5 text-slate-500">{row.level}</td>
                    <td className="px-5 py-2.5 text-right text-slate-600">{row.age}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {info.notes.length > 0 && (
        <div className="mt-10 rounded-2xl bg-brand-50 p-6">
          <p className="font-display text-lg text-navy-900">Please note</p>
          <ul className="prose-school mt-3">
            {info.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </div>
      )}
    </>
  );
}

function Rules({ rules }) {
  return (
    <>
      <BodyHeading kicker="For students & parents" title="Rules and Regulations" />
      {rules.intro && <p className="prose-school mt-5">{rules.intro}</p>}
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {rules.sections.map((section, i) => (
          <section key={section.title} data-reveal="" style={delay(i)} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-3 font-display text-xl text-navy-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-100 text-sm font-bold text-gold-700">{i + 1}</span>
              {section.title}
            </h3>
            <ul className="prose-school mt-4 !text-sm">
              {section.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        ))}
      </div>
      <div className="mt-8"><PrintButton label="Print rules" /></div>
    </>
  );
}

function Transfer({ transfer, school }) {
  return (
    <>
      <BodyHeading kicker="Transfer Certificate (TC)" title="Transfer Procedure" />
      {transfer.intro && <p className="prose-school mt-5">{transfer.intro}</p>}

      {transfer.leaving.length > 0 && (
        <>
          <h3 className="mt-10 font-display text-2xl text-navy-900">Leaving {school}</h3>
          <Steps steps={transfer.leaving} />
        </>
      )}

      {transfer.joining.length > 0 && (
        <>
          <h3 className="mt-12 font-display text-2xl text-navy-900">Joining {school} from another school</h3>
          <CheckList items={transfer.joining} className="mt-5" />
        </>
      )}

      {transfer.notes.length > 0 && (
        <NoteBox className="mt-10">
          <ul className="prose-school !text-sm">
            {transfer.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </NoteBox>
      )}
    </>
  );
}

function Prospectus({ prospectus, identity }) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <BodyHeading kicker="Online prospectus" title="Prospectus" />
        <div className="flex flex-wrap gap-3">
          {prospectus.pdf && <PillButton href={prospectus.pdf}><FaFilePdf aria-hidden /> Download PDF</PillButton>}
          <PrintButton label="Print prospectus" />
        </div>
      </div>
      {prospectus.intro && <p className="prose-school mt-5">{prospectus.intro}</p>}

      <div className="relative mt-8 aspect-[21/9] overflow-hidden rounded-3xl bg-navy-900">
        <SmartImage src={prospectus.image} alt="" fill sizes="(min-width: 1024px) 800px, 100vw" className="object-cover" />
        <div className="absolute inset-0 flex items-center bg-gradient-to-r from-navy-950/90 to-transparent p-8">
          <div>
            <p className="font-display text-2xl text-white md:text-3xl">{identity.name}</p>
            <p className="mt-1 font-display italic text-gold-300">{identity.tagline}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {prospectus.sections.map((s, i) => (
          <section key={s.title} data-reveal="" style={delay(i)} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <FaCheckCircle className="mt-1 shrink-0 text-lg text-brand-600" aria-hidden />
            <div>
              <h3 className="font-display text-lg text-navy-900">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{s.text}</p>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

export default async function AdmissionDetailPage({ params }) {
  const { slug } = await params;
  const { content, page } = await load(slug);
  if (!page) notFound();
  const { admission, general } = content;

  const body = page.program ? (
    <Program program={page.program} ageNote={admission.ageNote} phone={general.contact.phones[0]} />
  ) : slug === 'information' ? (
    <Information info={content.admissionInfo} programs={admission.programs} />
  ) : slug === 'rules-and-regulations' ? (
    <Rules rules={content.rules} />
  ) : slug === 'transfer-procedure' ? (
    <Transfer transfer={content.transfer} school={general.identity.shortName || general.identity.name} />
  ) : (
    <Prospectus prospectus={content.prospectus} identity={general.identity} />
  );

  return (
    <>
      <PageBanner
        title={page.title}
        subtitle={page.program ? page.description : `${admission.banner.title} · ${general.identity.name}`}
        breadcrumbs={[{ label: admission.banner.title, href: '/admission' }, { label: page.title }]}
        image={page.program?.image || admission.banner.image}
      />
      <SubpageLayout section="/admission" current={`/admission/${slug}`}>
        {body}
      </SubpageLayout>
    </>
  );
}
