import { timingSafeEqual } from 'node:crypto';
import { getDb, ok } from '@/lib/db';
import { handler, json, HttpError } from '@/lib/http';
import { mailEnabled, sendMail } from '@/lib/mailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const same = (a, b) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

// Called by a scheduler (vercel.json cron or any pinger) with  Authorization: Bearer <CRON_SECRET>.
// Creates due-date reminders, then emails any notification that has not been emailed yet.
export const GET = handler({}, async ({ request }) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new HttpError(404, 'Not found.');
  if (!same(request.headers.get('authorization') || '', `Bearer ${secret}`)) throw new HttpError(401, 'Unauthorized.');

  const db = getDb();
  const created = Number(ok(await db.rpc('gv_notify_due_soon')));
  let emailed = 0;
  if (mailEnabled()) {
    const since = new Date(Date.now() - 3 * 86_400_000).toISOString();
    const rows = ok(
      await db
        .from('notifications')
        .select('id, title, body, users!user_id(email, name)')
        .is('emailed_at', null)
        .gte('created_at', since)
        .order('id')
        .limit(50)
    );
    for (const n of rows) {
      if (!n.users?.email) continue;
      try {
        await sendMail({ to: n.users.email, subject: n.title, text: `Hi ${n.users.name || 'there'},\n\n${n.body}\n\n${process.env.NEXT_PUBLIC_STORE_NAME || 'GameVault'}` });
        await db.from('notifications').update({ emailed_at: new Date().toISOString() }).eq('id', n.id);
        emailed++;
      } catch (e) {
        console.error('[mail]', e?.message);
      }
    }
  }
  return json({ created, emailed });
});
