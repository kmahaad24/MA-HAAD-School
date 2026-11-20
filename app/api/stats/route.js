import { STAFF_ROLES } from '@/config/roles';
import { route } from '@/server/http';
import * as stats from '@/server/controllers/stats.controller';

export const dynamic = 'force-dynamic';

export const GET = route(stats.overview, { roles: STAFF_ROLES });
