import { getDb, ok } from '@/lib/db';
import { handler, json, HttpError } from '@/lib/http';
import { addressSchema } from '@/lib/validate';
import { publicAddress } from '@/lib/address';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler({ auth: true }, async ({ user }) => {
  const db = getDb();
  const rows = ok(await db.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }).order('created_at', { ascending: true }));
  const me = ok(await db.from('users').select('name, phone').eq('id', user.id).maybeSingle());
  return json({ addresses: rows.map(publicAddress), profile: { name: me?.name ?? '', phone: me?.phone ?? '' } });
});

export const POST = handler({ auth: true, body: addressSchema }, async ({ user, data }) => {
  const db = getDb();
  const existing = ok(await db.from('addresses').select('id').eq('user_id', user.id));
  if (existing.length >= 2) throw new HttpError(409, 'You can save up to 2 addresses. Delete one to add another.');
  const makeDefault = existing.length === 0 || !!data.makeDefault;
  if (makeDefault && existing.length) ok(await db.from('addresses').update({ is_default: false }).eq('user_id', user.id));
  const row = ok(
    await db
      .from('addresses')
      .insert({
        user_id: user.id,
        label: data.label,
        full_name: data.name,
        phone: data.phone,
        line1: data.line1,
        line2: data.line2,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        is_default: makeDefault,
      })
      .select('*')
      .single()
  );
  return json({ address: publicAddress(row) }, 201);
});
