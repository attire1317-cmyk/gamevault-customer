import { getDb, ok } from '@/lib/db';
import { handler, json, intParam, HttpError } from '@/lib/http';
import { addressPatchSchema } from '@/lib/validate';
import { publicAddress } from '@/lib/address';

export const runtime = 'nodejs';

export const PATCH = handler({ auth: true, body: addressPatchSchema }, async ({ user, data, params }) => {
  const db = getDb();
  const id = intParam(params.id);
  const mine = ok(await db.from('addresses').select('id').eq('id', id).eq('user_id', user.id).maybeSingle());
  if (!mine) throw new HttpError(404, 'Address not found.');

  const patch = {};
  if (data.label !== undefined) patch.label = data.label;
  if (data.name !== undefined) patch.full_name = data.name;
  for (const k of ['phone', 'line1', 'line2', 'city', 'state', 'pincode']) if (data[k] !== undefined) patch[k] = data[k];

  if (data.makeDefault) {
    ok(await db.from('addresses').update({ is_default: false }).eq('user_id', user.id));
    patch.is_default = true;
  }
  if (!Object.keys(patch).length) return json({ ok: true });
  const row = ok(await db.from('addresses').update(patch).eq('id', id).eq('user_id', user.id).select('*').single());
  return json({ address: publicAddress(row) });
});

export const DELETE = handler({ auth: true }, async ({ user, params }) => {
  const db = getDb();
  const id = intParam(params.id);
  const gone = ok(await db.from('addresses').delete().eq('id', id).eq('user_id', user.id).select('id, is_default'));
  if (!gone.length) throw new HttpError(404, 'Address not found.');
  if (gone[0].is_default) {
    // the remaining address (if any) becomes the default
    const left = ok(await db.from('addresses').select('id').eq('user_id', user.id).order('created_at', { ascending: true }).limit(1));
    if (left[0]) ok(await db.from('addresses').update({ is_default: true }).eq('id', left[0].id));
  }
  return json({ ok: true });
});
