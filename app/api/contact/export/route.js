import { route, HttpError } from '@/server/http';
import { STAFF_ROLES } from '@/config/roles';
import { exportMessages } from '@/server/services/contact.service';
import { getContent } from '@/server/services/site-content.service';
import { getCachedSetting } from '@/server/services/settings.service';
import { contactsToXlsx, contactsToPdf } from '@/server/exports/contact-export';
import { DEFAULT_TIME_ZONE } from '@/lib/timezone';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TABS = { '': 'Inbox', unread: 'Unread', read: 'Read', replied: 'Replied', archived: 'Archived', all: 'All requests' };
const TYPES = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};

// GET /api/contact/export?format=xlsx|pdf&status=unread&search=… (admins and editors)
// Downloads the requests in the current tab / search of Dashboard → Contact Requests.
export const GET = route(
  async ({ query }) => {
    const format = query.get('format');
    if (!TYPES[format]) throw new HttpError(400, 'Choose xlsx or pdf.');
    const status = query.get('status') || '';
    const search = (query.get('search') || '').slice(0, 100);

    const [rows, general, site] = await Promise.all([exportMessages({ status, search }), getContent('general'), getCachedSetting('site').catch(() => ({}))]);
    const meta = {
      school: general.identity.name,
      title: 'Contact Requests',
      filterLabel: `${TABS[status] ?? 'Inbox'}${search ? ` · search “${search}”` : ''}`,
      timeZone: site.timezone || DEFAULT_TIME_ZONE,
    };
    const file = format === 'xlsx' ? await contactsToXlsx(rows, meta) : await contactsToPdf(rows, meta);
    const name = `contact-requests-${status || 'inbox'}-${new Date().toISOString().slice(0, 10)}.${format}`;

    return new Response(file, {
      headers: {
        'Content-Type': TYPES[format],
        'Content-Disposition': `attachment; filename="${name}"`,
        'Content-Length': String(file.length),
        'Cache-Control': 'no-store',
      },
    });
  },
  { roles: STAFF_ROLES }
);
