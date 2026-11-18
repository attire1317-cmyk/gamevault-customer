import { getDb, ok } from '@/lib/db';
import { handler, json, HttpError } from '@/lib/http';
import { profileSchema } from '@/lib/validate';
import { publicAddress } from '@/lib/address';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function load(db, id) {
  const me = ok(await db.from('users').select('id, name, email, phone').eq('id', id).maybeSingle());
  if (!me) throw new HttpError(404, 'Account not found.');
  const rows = ok(await db.from('addresses').select('*').eq('user_id', id).order('is_default', { ascending: false }).order('created_at', { ascending: true }));
  return { user: { id: me.id, name: me.name, email: me.email, phone: me.phone ?? '' }, addresses: rows.map(publicAddress) };
}

export const GET = handler({ auth: true }, async ({ user }) => json(await load(getDb(), user.id)));

export const PATCH = handler({ auth: true, body: profileSchema }, async ({ user, data }) => {
  const db = getDb();
  ok(await db.from('users').update({ name: data.name, phone: data.phone || null }).eq('id', user.id));
  return json(await load(db, user.id));
});
