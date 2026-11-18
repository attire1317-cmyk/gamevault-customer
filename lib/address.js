import { ok } from './db';
import { HttpError } from './errors';

export const publicAddress = (a) => ({
  id: a.id,
  label: a.label,
  name: a.full_name,
  phone: a.phone,
  line1: a.line1,
  line2: a.line2,
  city: a.city,
  state: a.state,
  pincode: a.pincode,
  isDefault: !!a.is_default,
});

// Only ever the signed-in customer's own address.
export async function getOwnedAddress(db, userId, id) {
  const row = ok(await db.from('addresses').select('*').eq('id', id).eq('user_id', userId).maybeSingle());
  if (!row) throw new HttpError(422, 'Choose a delivery address.');
  return row;
}

// Copy of the address stored on the order, so later edits never change past orders.
export async function attachAddress(db, table, ids, addr) {
  const { error } = await db.from(table).update({ address: publicAddress(addr) }).in('id', ids);
  if (error) console.error('[address attach]', table, error.message);
}
