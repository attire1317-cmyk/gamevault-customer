import { handler, json } from '@/lib/http';
import { clearSession } from '@/lib/auth';

export const runtime = 'nodejs';

export const POST = handler({}, async () => {
  await clearSession();
  return json({ ok: true });
});
