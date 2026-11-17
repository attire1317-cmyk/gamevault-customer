import { handler, json } from '@/lib/http';
import { getSessionUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler({}, async () => {
  const user = await getSessionUser();
  return json({ user });
});
