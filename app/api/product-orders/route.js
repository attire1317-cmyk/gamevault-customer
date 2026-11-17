import { getDb, ok, iso } from '@/lib/db';
import { handler, json } from '@/lib/http';
import { productOrderSchema } from '@/lib/validate';
import { createProductOrder } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler({ auth: true }, async ({ user }) => {
  const rows = ok(
    await getDb()
      .from('product_orders')
      .select('*, products(name, image_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
  );
  return json({
    orders: rows.map((o) => ({
      id: o.id,
      name: o.products?.name ?? '',
      imageUrl: o.products?.image_url ?? '',
      qty: o.qty,
      unitPrice: o.unit_price,
      total: o.total,
      status: o.status,
      createdAt: iso(o.created_at),
    })),
  });
});

export const POST = handler({ auth: true, body: productOrderSchema }, async ({ user, data }) => {
  const id = await createProductOrder(getDb(), { userId: user.id, productId: data.productId, qty: data.qty });
  return json({ id }, 201);
});
