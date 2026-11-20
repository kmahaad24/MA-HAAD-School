// Dashboard search (the search box at the top of every dashboard page): finds records in the database.
// Pages, menu items and Website Content fields are matched in the browser (src/components/dashboard/DashboardSearch.jsx).
import connectDB from '@/lib/db';
import Notice from '@/models/Notice';
import ContactMessage from '@/models/ContactMessage';
import StaffMember from '@/models/StaffMember';
import GalleryPhoto from '@/models/GalleryPhoto';
import AcademicSession from '@/models/AcademicSession';
import User from '@/models/User';
import { escapeRegex } from '@/lib/utils';
import { str, toPlain } from '@/server/validate';

const LIMIT = 5;
const short = (text, max = 90) => {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};

export async function searchDashboard(query, { role } = {}) {
  const q = str(query, 80);
  if (q.length < 2) return [];
  await connectDB();
  const re = new RegExp(escapeRegex(q), 'i');

  const [notices, requests, staff, photos, sessions, users] = await Promise.all([
    Notice.find({ $or: [{ title: re }, { summary: re }] }).select('title status category date').sort({ date: -1 }).limit(LIMIT).lean(),
    ContactMessage.find({ $or: [{ fullName: re }, { email: re }, { phone: re }, { subject: re }, { message: re }] })
      .select('fullName email subject status createdAt')
      .sort({ createdAt: -1 })
      .limit(LIMIT)
      .lean(),
    StaffMember.find({ $or: [{ name: re }, { designation: re }, { subject: re }] }).select('name designation group photo').limit(LIMIT).lean(),
    GalleryPhoto.find({ $or: [{ title: re }, { category: re }] }).select('title category src').limit(LIMIT).lean(),
    AcademicSession.find({ $or: [{ label: re }, { 'holidays.title': re }, { 'events.title': re }] }).select('year label holidays.title holidays.date events.title events.date').sort({ year: -1 }).limit(3).lean(),
    role === 'admin' ? User.find({ $or: [{ name: re }, { email: re }, { designation: re }] }).select('name email role avatar').limit(LIMIT).lean() : [],
  ]);

  const groups = [
    {
      group: 'Contact requests',
      items: requests.map((m) => ({ title: m.fullName, subtitle: [m.subject, m.email].filter(Boolean).join(' · '), badge: m.status, href: `/dashboard/messages?open=${m._id}`, icon: 'envelope' })),
    },
    {
      group: 'Notices',
      items: notices.map((n) => ({ title: n.title, subtitle: `${n.category} · ${n.status}`, href: `/dashboard/notices?search=${encodeURIComponent(n.title)}`, icon: 'bullhorn' })),
    },
    {
      group: 'Teachers & staff',
      items: staff.map((s) => ({ title: s.name, subtitle: [s.designation, s.group.replace(/-/g, ' ')].filter(Boolean).join(' · '), href: `/dashboard/staff?group=${s.group}`, image: s.photo, icon: 'users' })),
    },
    {
      group: 'Photo gallery',
      items: photos.map((p) => ({ title: p.title || 'Untitled photo', subtitle: p.category, href: '/dashboard/gallery', image: p.src, icon: 'images' })),
    },
    {
      group: 'Academic sessions',
      items: sessions.flatMap((s) => {
        const hits = [...(s.holidays || []), ...(s.events || [])].filter((e) => re.test(e.title)).slice(0, 3);
        const label = s.label || `Session ${s.year}`;
        return hits.length
          ? hits.map((e) => ({ title: e.title, subtitle: `${label} · ${e.date}`, href: '/dashboard/sessions', icon: 'calendar' }))
          : [{ title: label, subtitle: 'Holidays, calendar and book list', href: '/dashboard/sessions', icon: 'calendar' }];
      }),
    },
    {
      group: 'Users',
      items: users.map((u) => ({ title: u.name, subtitle: `${u.email} · ${u.role}`, href: '/dashboard/users', image: u.avatar, icon: 'user' })),
    },
  ];

  return toPlain(groups.filter((g) => g.items.length).map((g) => ({ ...g, items: g.items.map((i) => ({ ...i, subtitle: short(i.subtitle) })) })));
}
