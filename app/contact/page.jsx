import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaClock, FaDirections } from 'react-icons/fa';
import { getContents } from '@/server/services/site-content.service';
import { pageMetadata } from '@/lib/seo';
import { telHref } from '@/lib/utils';
import PageBanner from '@/components/school/PageBanner';
import { Kicker } from '@/components/school/SectionHeading';
import Container from '@/components/ui/Container';
import ContactForm from '@/components/forms/ContactForm';
import MapEmbed from '@/components/school/MapEmbed';
import { Section, delay } from '@/components/school/Blocks';

export async function generateMetadata() {
  const { contact, general } = await getContents('contact', 'general');
  const c = general.contact;
  return pageMetadata({
    title: contact.banner.title,
    description: `Address, phone numbers, email and calling time of ${general.identity.name}. ${c.address} · ${c.phones.join(', ')}`,
    path: '/contact',
    image: contact.banner.image,
  });
}

function InfoCard({ icon: Icon, title, index, children }) {
  return (
    <div data-reveal="" style={delay(index)} className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-navy-900 to-brand-600 text-xl text-white shadow-lg">
        <Icon aria-hidden />
      </span>
      <p className="mt-4 font-display text-lg text-navy-900">{title}</p>
      <div className="mt-2 text-sm leading-relaxed text-slate-600">{children}</div>
    </div>
  );
}

export default async function ContactPage() {
  const { contact: page, general } = await getContents('contact', 'general');
  const { contact, identity } = general;
  const cards = [
    contact.address && { icon: FaMapMarkerAlt, title: 'Visit Us', body: contact.mapUrl ? <a href={contact.mapUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brand-700">{contact.address}</a> : contact.address },
    contact.phones.length > 0 && {
      icon: FaPhoneAlt,
      title: 'Call Us',
      body: contact.phones.map((phone) => <a key={phone} href={telHref(phone)} className="block font-semibold text-navy-900 hover:text-brand-700">{phone}</a>),
    },
    contact.email && { icon: FaEnvelope, title: 'Email Us', body: <a href={`mailto:${contact.email}`} className="break-all hover:text-brand-700">{contact.email}</a> },
    contact.callingTime && { icon: FaClock, title: 'Calling Time', body: contact.callingTime },
  ].filter(Boolean);

  return (
    <>
      <PageBanner banner={page.banner} breadcrumbs={[{ label: page.banner.title }]} />

      <Section heading={page.heading}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <InfoCard key={card.title} icon={card.icon} title={card.title} index={i}>{card.body}</InfoCard>
          ))}
        </div>
      </Section>

      <section className="bg-slate-50 py-16 md:py-20">
        <Container className="grid gap-10 lg:grid-cols-2">
          <div data-reveal="">
            {page.form.kicker && <Kicker>{page.form.kicker}</Kicker>}
            <h2 className="mt-4 font-display text-3xl text-navy-900">{page.form.title}</h2>
            {page.form.text && <p className="mt-2 text-slate-500">{page.form.text}</p>}
            <div className="mt-6 rounded-2xl bg-white p-6 shadow-xl shadow-navy-900/5 ring-1 ring-slate-200 sm:p-8">
              <ContactForm topics={page.form.topics} privacyNote={page.form.privacyNote} />
            </div>
          </div>

          <div className="flex flex-col" data-reveal="">
            {page.location.kicker && <Kicker>{page.location.kicker}</Kicker>}
            <h2 className="mt-4 font-display text-3xl text-navy-900">{page.location.title}</h2>
            {contact.address && <p className="mt-2 text-slate-500">{contact.address}</p>}
            <MapEmbed
              src={contact.mapEmbed}
              title={`Map — ${identity.name}`}
              address={contact.address}
              directionsUrl={contact.mapUrl}
              className="mt-6 min-h-[360px] flex-1 rounded-2xl shadow-xl shadow-navy-900/5 ring-1 ring-slate-200"
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              {contact.phones[0] && (
                <a href={telHref(contact.phones[0])} className="flex items-center justify-center gap-2 rounded-xl bg-navy-900 py-3 text-sm font-semibold text-white hover:bg-navy-800">
                  <FaPhoneAlt aria-hidden /> Call Now
                </a>
              )}
              {contact.mapUrl && (
                <a href={contact.mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-brand-300 bg-white py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                  <FaDirections aria-hidden /> Directions
                </a>
              )}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
