import { getDb } from '@/lib/db';
import { handler, json } from '@/lib/http';
import { cartSchema } from '@/lib/validate';
import { createProductCart } from '@/lib/store';
import { getOwnedAddress, attachAddress } from '@/lib/address';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// One atomic order for the whole cart (see gv_create_product_cart).
export const POST = handler({ auth: true, body: cartSchema }, async ({ user, data }) => {
  const db = getDb();
  const addr = await getOwnedAddress(db, user.id, data.addressId);
  const ids = await createProductCart(db, { userId: user.id, items: data.items });
  await attachAddress(db, 'product_orders', ids, addr);
  return json({ ids }, 201);
});
