import Link from 'next/link';
import { FaArrowRight, FaBullhorn } from 'react-icons/fa';
import { getContents } from '@/server/services/site-content.service';
import { listGalleryPublic } from '@/server/services/content.service';
import { latest } from '@/server/services/notice.service';
import { pageMetadata } from '@/lib/seo';
import Container from '@/components/ui/Container';
import Icon from '@/components/ui/Icon';
import SmartImage from '@/components/ui/SmartImage';
import HeroSlider from '@/components/school/HeroSlider';
import SectionHeading, { Kicker } from '@/components/school/SectionHeading';
import NoticeCard from '@/components/school/NoticeCard';
import GalleryGrid from '@/components/school/GalleryGrid';
import { AdmissionCta, CampusMap, PillButton, Section, CardGrid, IconCard, ImageLinkCard, delay } from '@/components/school/Blocks';

export async function generateMetadata() {
  return pageMetadata({ path: '/' });
}

const safe = (promise, fallback) => promise.catch(() => fallback);

function QuickLinks({ items }) {
  if (!items.length) return null;
  return (
    <Container className="relative z-20 -mt-20 sm:-mt-24">
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {items.map(({ title, text, href, cta, icon }, i) => (
          <Link
            key={`${href}-${title}`}
            href={href}
            className="group flex flex-col items-center rounded-2xl border-b-4 border-navy-900 bg-white p-4 text-center shadow-xl shadow-navy-900/10 transition hover:-translate-y-1 hover:border-gold-400 sm:p-6"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-xl text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white sm:h-14 sm:w-14">
              <Icon name={icon} />
            </span>
            <span className="mt-3 font-display text-base font-bold text-navy-900 sm:text-lg">{title}</span>
            {text && <span className="mt-1 hidden text-sm text-slate-500 sm:block">{text}</span>}
            {cta && (
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gold-700 sm:text-sm">
                {cta} <FaArrowRight className="transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            )}
          </Link>
        ))}
      </div>
    </Container>
  );
}

function Welcome({ block, about }) {
  const { welcome, highlights } = about;
  return (
    <section className="py-16 md:py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative mx-auto w-full max-w-xl pb-10 pr-6 sm:pr-10 lg:mx-0" data-reveal="">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-slate-100 shadow-2xl shadow-navy-900/20">
            <SmartImage src={block.image} alt={welcome.title} fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
          </div>
          {block.image2 && (
            <div className="absolute bottom-0 right-0 aspect-[4/3] w-1/2 overflow-hidden rounded-2xl border-[6px] border-white bg-slate-100 shadow-xl">
              <SmartImage src={block.image2} alt="" fill sizes="280px" className="object-cover" />
            </div>
          )}
          {block.badgeTitle && (
            <div className="absolute -left-3 top-6 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-500 px-5 py-4 text-navy-950 shadow-xl sm:-left-6">
              <p className="font-display text-3xl font-bold leading-none">{block.badgeTitle}</p>
              {block.badgeText && <p className="mt-1 text-xs font-semibold uppercase tracking-wider">{block.badgeText}</p>}
            </div>
          )}
        </div>

        <div data-reveal="">
          {block.kicker && <Kicker>{block.kicker}</Kicker>}
          <h2 className="mt-4 font-display text-3xl leading-tight text-navy-900 md:text-4xl">{welcome.title}</h2>
          {welcome.tagline && <p className="mt-2 font-display text-lg italic text-gold-700">{welcome.tagline}</p>}
          <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-slate-600">
            {welcome.paragraphs[0] && <p className="font-medium text-navy-900">{welcome.paragraphs[0]}</p>}
            {welcome.paragraphs[1] && <p>{welcome.paragraphs[1]}</p>}
          </div>
          {highlights.length > 0 && (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {highlights.map(({ icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-sm font-semibold text-navy-900">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-100 text-gold-700"><Icon name={icon} /></span>
                  {label}
                </li>
              ))}
            </ul>
          )}
          {block.buttonLabel && (
            <PillButton href="/about" className="mt-8">
              {block.buttonLabel}
              <span className="sr-only"> about {welcome.title}</span>
              <FaArrowRight aria-hidden />
            </PillButton>
          )}
        </div>
      </Container>
    </section>
  );
}

function LatestNotices({ heading, notices, phones }) {
  return (
    <Section heading={heading} tone="slate">
      {notices.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {notices.map((notice, i) => (
            <div key={notice._id} data-reveal="" style={delay(i)}>
              <NoticeCard notice={notice} />
            </div>
          ))}
        </div>
      ) : (
        <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
          <FaBullhorn className="text-3xl text-gold-500" aria-hidden />
          <p className="mt-4 font-semibold text-navy-900">New notices will appear here</p>
          {phones.length > 0 && <p className="mt-1 text-sm text-slate-500">For admission and other enquiries, call {phones.join(' / ')}.</p>}
        </div>
      )}
      <div className="mt-10 text-center">
        <PillButton href="/notices">View All Notices <FaArrowRight aria-hidden /></PillButton>
      </div>
    </Section>
  );
}

function ValuesBand({ heading, image, items }) {
  if (!items.length) return null;
  return (
    <section className="relative isolate overflow-hidden bg-navy-900 py-16 md:py-20">
      <SmartImage src={image} alt="" fill sizes="100vw" quality={50} className="-z-20 object-cover opacity-20" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-navy-950/95 via-navy-900/90 to-brand-800/85" aria-hidden />
      <Container>
        <SectionHeading light kicker={heading.kicker} title={heading.title} subtitle={heading.subtitle} />
        <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {items.map(({ icon, title }, i) => (
            <li key={title} data-reveal="" style={delay(i)} className="flex flex-col items-center rounded-2xl bg-white/5 px-3 py-6 text-center ring-1 ring-white/10 backdrop-blur transition hover:bg-white/10">
              <span className="flex h-14 w-14 items-center justify-center rounded-full text-xl text-gold-300 ring-2 ring-gold-400/60">
                <Icon name={icon} />
              </span>
              <span className="mt-4 font-display text-lg text-white">{title}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function GalleryPreview({ heading, photos }) {
  if (!photos.length) return null;
  return (
    <Section heading={heading}>
      <GalleryGrid items={photos} limit={6} />
      <div className="mt-10 text-center">
        <PillButton href="/gallery">View Full Gallery <FaArrowRight aria-hidden /></PillButton>
      </div>
    </Section>
  );
}

export default async function HomePage() {
  const [notices, photos, content] = await Promise.all([safe(latest(3), []), safe(listGalleryPublic(6), []), getContents('home', 'about', 'admission', 'facilities', 'general')]);
  const { home, about, admission, facilities, general } = content;

  return (
    <>
      <HeroSlider slides={home.slides} buttons={home.slideButtons} />
      <QuickLinks items={home.quickLinks} />
      <Welcome block={home.welcome} about={about} />
      <LatestNotices heading={home.notices} notices={notices} phones={general.contact.phones} />

      <Section heading={home.programmes} tone="brand">
        <CardGrid cols={3} className="md:grid-cols-3">
          {admission.programs.map((p, i) => (
            <ImageLinkCard key={p.slug} index={i} href={`/admission/${p.slug}`} image={p.image} badge={p.level} title={p.title} text={p.summary} tags={p.classes} cta="Details" sizes="(min-width: 768px) 33vw, 100vw" />
          ))}
        </CardGrid>
      </Section>

      <ValuesBand heading={home.values} image={home.valuesImage} items={home.valueItems} />

      <Section heading={home.approach}>
        <CardGrid cols={3}>
          {about.approach.map((item, i) => <IconCard key={item.title} index={i} {...item} />)}
        </CardGrid>
      </Section>

      <Section heading={home.facilities} tone="slate">
        <CardGrid cols={3}>
          {facilities.items.map((f, i) => <IconCard key={f.slug} index={i} variant="compact" icon={f.icon} title={f.title} text={f.summary} href={`/facilities/${f.slug}`} />)}
        </CardGrid>
      </Section>

      <GalleryPreview heading={home.gallery} photos={photos} />
      <AdmissionCta />
      <CampusMap />
    </>
  );
}
