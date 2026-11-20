import { STAFF_ROLES } from '@/config/roles';
import { route } from '@/server/http';
import * as notices from '@/server/controllers/notice.controller';

export const dynamic = 'force-dynamic';

export const GET = route(notices.show);
export const PUT = route(notices.update, { roles: STAFF_ROLES });
export const DELETE = route(notices.remove, { roles: STAFF_ROLES });
