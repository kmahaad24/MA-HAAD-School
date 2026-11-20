import { route, ok, readJson } from '@/server/http';
import { getProfile, updateProfile } from '@/server/services/user.service';

export const dynamic = 'force-dynamic';

// Dashboard → My Profile (any signed-in user): GET · PUT { name, email, phone, designation, avatar }
export const GET = route(async ({ session }) => ok(await getProfile(session._id)), { auth: true });
export const PUT = route(async ({ req, session }) => ok(await updateProfile(session._id, await readJson(req)), 'Profile saved.'), { auth: true });
