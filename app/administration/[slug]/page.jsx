import { notFound } from 'next/navigation';
import { listStaff } from '@/server/services/content.service';
import { getContent } from '@/server/services/site-content.service';
import { pageMetadata } from '@/lib/seo';
import PageBanner from '@/components/school/PageBanner';
import SubpageLayout from '@/components/school/SubpageLayout';
import { BodyHeading, ComingSoon, PersonPhoto, delay } from '@/components/school/Blocks';

async function find(slug) {
  const administration = await getContent('administration');
  return { administration, group: administration.groups.find((g) => g.slug === slug) };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { administration, group } = await find(slug);
  return group ? pageMetadata({ title: group.title, description: group.intro, path: `/administration/${slug}`, image: administration.banner.image }) : {};
}

function MemberCard({ member, index }) {
  return (
    <li data-reveal="" style={delay(index)} className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <PersonPhoto photo={member.photo} name={member.name} className="h-32 w-32 rounded-full ring-4 ring-gold-200 ring-offset-2" sizes="128px" />
      <p className="mt-5 font-display text-lg text-navy-900">{member.name}</p>
      {member.designation && <p className="mt-2 rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-700">{member.designation}</p>}
      {member.subject && <p className="mt-2 text-sm text-brand-700">{member.subject}</p>}
      {member.qualification && <p className="mt-1 text-xs text-slate-500">{member.qualification}</p>}
    </li>
  );
}

export default async function StaffPage({ params }) {
  const { slug } = await params;
  const { administration, group } = await find(slug);
  if (!group) notFound();
  // People are managed in Dashboard → Teachers & Staff
  const members = await listStaff(slug).catch(() => []);

  return (
    <>
      <PageBanner title={group.title} subtitle={group.intro} breadcrumbs={[{ label: administration.banner.title, href: '/administration' }, { label: group.title }]} image={administration.banner.image} />
      <SubpageLayout section="/administration" current={`/administration/${slug}`}>
        <BodyHeading kicker={group.kicker} title={group.title} />
        {group.intro && <p className="prose-school mt-3">{group.intro}</p>}

        <div className="mt-10">
          {members.length > 0 ? (
            <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {members.map((member, i) => <MemberCard key={member._id} member={member} index={i} />)}
            </ul>
          ) : (
            <ComingSoon />
          )}
        </div>
      </SubpageLayout>
    </>
  );
}
