import { getDb, ok, iso } from '@/lib/db';
import { handler, json } from '@/lib/http';
import { notifSchema } from '@/lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Works even without a scheduled job: due-date reminders are created here at most every 10 minutes.
async function sweepDue(db) {
  const g = globalThis;
  if (Date.now() - (g.__gvSweep || 0) < 10 * 60_000) return;
  g.__gvSweep = Date.now();
  try {
    await db.rpc('gv_notify_due_soon');
  } catch {}
}

export const GET = handler({ auth: true }, async ({ user }) => {
  const db = getDb();
  await sweepDue(db);
  const [items, unread] = await Promise.all([
    db.from('notifications').select('id, kind, title, body, link, read_at, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20).then(ok),
    db.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).is('read_at', null).then((r) => r.count ?? 0),
  ]);
  return json({
    unread,
    items: items.map((n) => ({ id: n.id, kind: n.kind, title: n.title, body: n.body, link: n.link, read: !!n.read_at, createdAt: iso(n.created_at) })),
  });
});

export const POST = handler({ auth: true, body: notifSchema }, async ({ user }) => {
  ok(await getDb().from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null));
  return json({ ok: true });
});
