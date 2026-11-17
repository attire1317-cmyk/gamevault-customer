import { getDb, ok } from '@/lib/db';
import { handler, json } from '@/lib/http';
import { listActiveOffers, publicGame, publicOffer } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public catalogue + live offers in one payload.
export const GET = handler({}, async () => {
  const db = getDb();
  const [offers, rows] = await Promise.all([
    listActiveOffers(db),
    db
      .from('games')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .then(ok),
  ]);
  const games = rows.map((g) => publicGame(g, offers));
  const titles = new Map(games.map((g) => [g.id, g.title]));
  return json({
    serverNow: new Date().toISOString(),
    games,
    offers: offers.map((o) => publicOffer(o, o.game_id ? titles.get(o.game_id) ?? null : null)),
  });
});
