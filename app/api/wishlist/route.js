import { getDb, ok } from '@/lib/db';
import { handler, json } from '@/lib/http';
import { wishSchema } from '@/lib/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler({ auth: true }, async ({ user }) => {
  const rows = ok(await getDb().from('wishlist').select('game_id, product_id').eq('user_id', user.id));
  return json({
    games: rows.filter((r) => r.game_id).map((r) => r.game_id),
    products: rows.filter((r) => r.product_id).map((r) => r.product_id),
  });
});

// on: true saves the item, on: false removes it.
export const POST = handler({ auth: true, body: wishSchema }, async ({ user, data }) => {
  const db = getDb();
  const col = data.gameId !== undefined ? 'game_id' : 'product_id';
  const id = data.gameId ?? data.productId;
  if (data.on) {
    // Plain insert: ON CONFLICT cannot target the partial unique indexes. A duplicate (23505) just means it is already saved.
    const { error } = await db.from('wishlist').insert({ user_id: user.id, [col]: id });
    if (error && error.code !== '23505') ok({ data: null, error });
  } else {
    ok(await db.from('wishlist').delete().eq('user_id', user.id).eq(col, id));
  }
  return json({ ok: true });
});
