import { getDb } from '@/lib/db';
import { handler, json } from '@/lib/http';
import { cartSchema } from '@/lib/validate';
import { createProductCart } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// One atomic order for the whole cart (see gv_create_product_cart).
export const POST = handler({ auth: true, body: cartSchema }, async ({ user, data }) => {
  const ids = await createProductCart(getDb(), { userId: user.id, items: data.items });
  return json({ ids }, 201);
});
