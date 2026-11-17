import { getDb, ok, iso } from '@/lib/db';
import { handler, json } from '@/lib/http';
import { orderSchema } from '@/lib/validate';
import { createOrder } from '@/lib/store';

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
  const id = await createOrder(getDb(), { userId: user.id, gameId: data.gameId, qty: data.qty });
  return json({ id }, 201);
});
