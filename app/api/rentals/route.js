import { getDb, ok, iso } from '@/lib/db';
import { handler, json } from '@/lib/http';
import { rentalSchema } from '@/lib/validate';
import { createRental } from '@/lib/store';
import { getOwnedAddress, attachAddress } from '@/lib/address';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler({ auth: true }, async ({ user }) => {
  // status ascending puts 'active' before 'returned'; then the soonest due date first.
  const rows = ok(
    await getDb()
      .from('rentals')
      .select('*, games(title, platform, image_url)')
      .eq('user_id', user.id)
      .order('status', { ascending: true })
      .order('due_at', { ascending: true })
  );
  return json({
    serverNow: new Date().toISOString(),
    rentals: rows.map((r) => ({
      id: r.id,
      title: r.games?.title ?? '',
      platform: r.games?.platform ?? '',
      imageUrl: r.games?.image_url ?? '',
      days: r.days,
      total: r.total,
      discountPercent: r.discount_percent,
      startedAt: iso(r.started_at),
      dueAt: iso(r.due_at),
      returnedAt: iso(r.returned_at),
      status: r.status,
    })),
  });
});

export const POST = handler({ auth: true, body: rentalSchema }, async ({ user, data }) => {
  const db = getDb();
  const addr = await getOwnedAddress(db, user.id, data.addressId);
  const id = await createRental(db, { userId: user.id, gameId: data.gameId, days: data.days });
  await attachAddress(db, 'rentals', [id], addr);
  return json({ id }, 201);
});
