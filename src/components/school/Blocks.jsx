// Reusable building blocks for the public pages. Server components unless noted; text comes from
// Dashboard → Website Content (src/content/).
import Link from 'next/link';
import { FaArrowRight, FaPhoneAlt, FaUserTie, FaCheckCircle } from 'react-icons/fa';
import { getContents } from '@/server/services/site-content.service';
import { cn, telHref, isExternal } from '@/lib/utils';
import Container from '@/components/ui/Container';
import Icon from '@/components/ui/Icon';
import SmartImage from '@/components/ui/SmartImage';
import SectionHeading from './SectionHeading';
import MapEmbed from './MapEmbed';

// ---------- links & buttons ----------

// Internal links use next/link (instant navigation); external, tel: and mailto: links use <a>
export function SmartLink({ href = '#', children, ...props }) {
  if (isExternal(href)) return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
  if (/^(tel:|mailto:|#)/.test(href)) return <a href={href} {...props}>{children}</a>;
  return <Link href={href} {...props}>{children}</Link>;
}

const PILL = {
  navy: 'bg-gradient-to-r from-navy-900 to-brand-700 text-white shadow-lg shadow-navy-900/20 hover:brightness-110',
  gold: 'bg-gradient-to-r from-gold-400 to-gold-500 text-navy-950 shadow-lg shadow-gold-500/25 hover:brightness-105',
  outline: 'border border-brand-300 bg-white text-brand-700 hover:bg-brand-50',
  light: 'border border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20',
};

// Rounded pill link in the school style
export function PillButton({ href, children, variant = 'navy', className, ...props }) {
  if (!href) return null;
  return (
    <SmartLink href={href} className={cn('inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition active:scale-[0.98]', PILL[variant], className)} {...props}>
      {children}
    </SmartLink>
  );
}

// ---------- sections ----------

// A page section with an optional heading (from content: { kicker, title, subtitle })
export function Section({ heading, tone = 'white', className, containerClassName, children, light }) {
  const tones = { white: '', slate: 'bg-slate-50', brand: 'bg-brand-50/60' };
  return (
    <section className={cn('py-16 md:py-20', tones[tone], className)}>
      <Container className={containerClassName}>
        {heading?.title && <SectionHeading kicker={heading.kicker} title={heading.title} subtitle={heading.subtitle} light={light} />}
        <div className={cn(heading?.title && 'mt-10')}>{children}</div>
      </Container>
    </section>
  );
}

// Small label + serif title used inside page bodies
export function BodyHeading({ kicker, title, as: Tag = 'h2', className }) {
  return (
    <div className={className}>
      {kicker && (
        <span className="inline-flex items-center gap-2 rounded-full bg-gold-100 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-700">
          <span className="h-px w-3 bg-gold-600" aria-hidden />
          {kicker}
        </span>
      )}
      <Tag className="mt-4 font-display text-3xl text-navy-900">{title}</Tag>
    </div>
  );
}

// Responsive card grid; children fade up one after another
export function CardGrid({ cols = 3, className, children }) {
  const grid = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'grid-cols-2 lg:grid-cols-4', 6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' };
  return <div className={cn('grid gap-5', grid[cols], className)}>{children}</div>;
}

// Stagger delay for the n-th card (scroll animation)
export const delay = (i) => ({ '--reveal-delay': `${Math.min(i, 8) * 70}ms` });

// ---------- cards ----------

/**
 * Card with an icon, title and text. Variants:
 *   center  — centred, gradient icon (mission, approach, contact info)
 *   side    — icon left of the text (approach on About)
 *   compact — gold icon left, linkable (facilities on Home)
 */
export function IconCard({ icon, title, text, href, variant = 'center', index = 0, children }) {
  const inner =
    variant === 'center' ? (
      <>
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-900 to-brand-600 text-xl text-white shadow-lg shadow-brand-900/20 transition-transform duration-300 group-hover:scale-110">
          <Icon name={icon} />
        </span>
        <h3 className="mt-5 font-display text-lg text-navy-900 group-hover:text-brand-700">{title}</h3>
        {text && <p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p>}
        {children}
      </>
    ) : (
      <>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-xl text-gold-600 transition group-hover:bg-gold-400 group-hover:text-navy-950">
          <Icon name={icon} />
        </span>
        <div>
          <h3 className="font-display text-lg text-navy-900 group-hover:text-brand-700">{title}</h3>
          {text && <p className="mt-1 text-sm leading-relaxed text-slate-500">{text}</p>}
          {children}
        </div>
      </>
    );
  const classes = cn(
    'group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/5',
    variant === 'center' ? 'text-center' : 'flex gap-4'
  );
  return href ? (
    <SmartLink href={href} className={classes} data-reveal="" style={delay(index)}>{inner}</SmartLink>
  ) : (
    <div className={classes} data-reveal="" style={delay(index)}>{inner}</div>
  );
}

// Photo card linking to a detail page (facilities, class levels)
export function ImageLinkCard({ href, image, badge, icon, title, text, cta = 'Learn more', tags = [], index = 0, sizes = '(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw' }) {
  return (
    <SmartLink
      href={href}
      data-reveal=""
      style={delay(index)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-navy-900 to-brand-700">
        <SmartImage src={image} alt="" fill sizes={sizes} className="object-cover transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/50 via-transparent to-transparent" aria-hidden />
        {badge && <span className="absolute bottom-3 left-3 rounded-full bg-gold-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-navy-950">{badge}</span>}
      </div>
      <div className="relative flex flex-1 flex-col px-6 pb-6">
        {icon ? (
          <span className="-mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-900 to-brand-600 text-2xl text-white shadow-lg ring-4 ring-white">
            <Icon name={icon} />
          </span>
        ) : (
          <span className="h-6" aria-hidden />
        )}
        <h3 className="mt-4 font-display text-2xl text-navy-900 group-hover:text-brand-700">{title}</h3>
        {text && <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{text}</p>}
        {tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {tags.map((t) => <li key={t} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">{t}</li>)}
          </ul>
        )}
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-600">
          {cta} <FaArrowRight className="transition-transform group-hover:translate-x-1" aria-hidden />
        </span>
      </div>
    </SmartLink>
  );
}

// Person photo, or a neutral placeholder until a photo is added
export function PersonPhoto({ photo, name, className, sizes = '300px' }) {
  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br from-brand-50 to-brand-100', className)}>
      {photo ? (
        <SmartImage src={photo} alt={name || ''} fill sizes={sizes} className="object-cover object-top" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center text-brand-300">
          <FaUserTie className="h-2/5 w-2/5" aria-hidden />
        </div>
      )}
    </div>
  );
}

// ---------- lists ----------

// Two-column list with check marks
export function CheckList({ items = [], className }) {
  if (!items.length) return null;
  return (
    <ul className={cn('grid gap-3 sm:grid-cols-2', className)}>
      {items.map((item, i) => (
        <li key={`${i}-${item}`} data-reveal="" style={delay(i)} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
          <FaCheckCircle className="mt-0.5 shrink-0 text-brand-600" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

// Numbered steps on a dashed line (admission, transfer)
export function Steps({ steps = [] }) {
  return (
    <ol className="relative mt-6 space-y-4 border-l-2 border-dashed border-brand-200 pl-8">
      {steps.map((step, i) => (
        <li key={`${i}-${step.title}`} data-reveal="" style={delay(i)} className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="absolute -left-[3.05rem] top-5 flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white ring-4 ring-white">{i + 1}</span>
          <p className="font-semibold text-navy-900">{step.title}</p>
          {step.text && <p className="mt-1 text-sm leading-relaxed text-slate-500">{step.text}</p>}
        </li>
      ))}
    </ol>
  );
}

// Gold-bordered note box
export function NoteBox({ title, children, className }) {
  return (
    <div className={cn('rounded-2xl border-l-4 border-gold-400 bg-gold-50 p-6', className)}>
      {title && <p className="font-display text-lg text-navy-900">{title}</p>}
      <div className={cn('text-sm leading-relaxed text-slate-600', title && 'mt-2')}>{children}</div>
    </div>
  );
}

// ---------- shared content blocks ----------

// Section shown while a list (teachers, trustees) is still being prepared
export async function ComingSoon({ title, text }) {
  const { general, shared } = await getContents('general', 'shared');
  const phone = general.contact.phones[0];
  return (
    <div className="rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/50 px-6 py-12 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl text-brand-600 shadow-sm">
        <FaUserTie aria-hidden />
      </span>
      <h2 className="mt-5 font-display text-2xl text-navy-900">{title || shared.comingSoon.title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">{text || shared.comingSoon.text}</p>
      {phone && (
        <a href={telHref(phone)} className="mt-6 inline-flex items-center gap-2 rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
          <FaPhoneAlt aria-hidden /> {phone}
        </a>
      )}
    </div>
  );
}

// Admission call-to-action band (end of most pages)
export async function AdmissionCta() {
  const { general, shared } = await getContents('general', 'shared');
  const { cta } = shared;
  const { phones, callingTime } = general.contact;
  return (
    <section className="relative isolate overflow-hidden bg-navy-900">
      <SmartImage src={cta.image} alt="" fill sizes="100vw" className="-z-20 object-cover opacity-25" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-900/95 to-brand-800/80" aria-hidden />
      <Container className="flex flex-col items-start gap-6 py-12 md:flex-row md:items-center md:justify-between md:py-14" data-reveal="">
        <div>
          {cta.badge && <span className="inline-flex rounded-full bg-gold-400 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-navy-950">{cta.badge}</span>}
          <h2 className="mt-4 font-display text-3xl text-white md:text-4xl">{cta.title}</h2>
          {cta.text && <p className="mt-2 max-w-xl text-white/75">{cta.text}</p>}
          {phones[0] && (
            <p className="mt-2 text-sm text-white/60">
              <a href={telHref(phones[0])} className="font-semibold text-gold-300 hover:text-gold-200">{phones[0]}</a>
              {callingTime && ` · ${callingTime}`}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <PillButton href={cta.primaryHref} variant="gold">{cta.primaryLabel} <FaArrowRight aria-hidden /></PillButton>
          <PillButton href={cta.secondaryHref} variant="light">{cta.secondaryLabel}</PillButton>
        </div>
      </Container>
    </section>
  );
}

// Google map of the campus (loads on demand — see MapEmbed)
export async function CampusMap({ className, title = true }) {
  const { general, shared } = await getContents('general', 'shared');
  const { contact, identity } = general;
  if (!contact.mapEmbed) return null;
  return (
    <section className={cn('bg-slate-50', className)}>
      {title && (
        <Container className="pb-10 pt-16">
          <SectionHeading kicker={shared.map.kicker} title={shared.map.title} subtitle={shared.map.subtitle || contact.address} />
        </Container>
      )}
      <MapEmbed src={contact.mapEmbed} title={`Map — ${identity.name}`} address={contact.address} directionsUrl={contact.mapUrl} className="h-[360px] md:h-[420px]" />
    </section>
  );
}
