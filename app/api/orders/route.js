import { getDb, ok, iso } from '@/lib/db';
import { handler, json } from '@/lib/http';
import { orderSchema } from '@/lib/validate';
import { createOrder } from '@/lib/store';
import { getOwnedAddress, attachAddress } from '@/lib/address';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler({ auth: true }, async ({ user }) => {
  const rows = ok(
    await getDb()
      .from('orders')
      .select('*, games(title, platform, image_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
  );
  return json({
    orders: rows.map((o) => ({
      id: o.id,
      title: o.games?.title ?? '',
      platform: o.games?.platform ?? '',
      imageUrl: o.games?.image_url ?? '',
      qty: o.qty,
      unitPrice: o.unit_price,
      discountPercent: o.discount_percent,
      total: o.total,
      status: o.status,
      createdAt: iso(o.created_at),
    })),
  });
});

export const POST = handler({ auth: true, body: orderSchema }, async ({ user, data }) => {
  const db = getDb();
  const addr = await getOwnedAddress(db, user.id, data.addressId);
  const id = await createOrder(db, { userId: user.id, gameId: data.gameId, qty: data.qty });
  await attachAddress(db, 'orders', [id], addr);
  return json({ id }, 201);
});
