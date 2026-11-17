import { ok, iso } from './db';

export const applyPct = (price, pct) => Math.round((price * (100 - pct)) / 100);

export async function listActiveOffers(db) {
  const now = new Date().toISOString();
  return ok(
    await db
      .from('offers')
      .select('*')
      .eq('active', true)
      .lte('starts_at', now)
      .gte('ends_at', now)
      .order('percent', { ascending: false })
  );
}

export function bestPercent(offers, gameId, kind) {
  let best = 0;
  for (const o of offers) {
    if (o.game_id !== null && o.game_id !== gameId) continue;
    if (o.applies_to !== 'both' && o.applies_to !== kind) continue;
    if (o.percent > best) best = o.percent;
  }
  return best;
}

export function publicGame(g, offers) {
  const buyPercent = bestPercent(offers, g.id, 'buy');
  const rentPercent = bestPercent(offers, g.id, 'rent');
  return {
    id: g.id,
    title: g.title,
    platform: g.platform,
    genre: g.genre,
    description: g.description,
    imageUrl: g.image_url,
    salePrice: g.sale_price,
    rentPerDay: g.rent_per_day,
    stockSale: g.stock_sale,
    stockRent: g.stock_rent,
    trending: !!g.trending,
    trendingAt: iso(g.trending_at),
    buyPercent,
    rentPercent,
    buyFinal: applyPct(g.sale_price, buyPercent),
    rentFinal: applyPct(g.rent_per_day, rentPercent),
  };
}

export function publicOffer(o, gameTitle = null) {
  return {
    id: o.id,
    title: o.title,
    percent: o.percent,
    gameId: o.game_id,
    gameTitle,
    appliesTo: o.applies_to,
    startsAt: iso(o.starts_at),
    endsAt: iso(o.ends_at),
    active: !!o.active,
  };
}

// Stock check, price, discount and insert all happen atomically inside the database (see supabase/schema.sql).
export async function createRental(db, { userId, gameId, days }) {
  return Number(
    ok(await db.rpc('gv_create_rental', { p_user: userId, p_game: gameId, p_days: days, p_created_by: null, p_limit: true }))
  );
}

export async function createOrder(db, { userId, gameId, qty }) {
  return Number(ok(await db.rpc('gv_create_order', { p_user: userId, p_game: gameId, p_qty: qty })));
}

// Consoles, controllers and accessories. The discount is a plain percent stored on the product with an optional end time.
export function productPercent(p, now = Date.now()) {
  if (!p.discount_percent) return 0;
  if (p.discount_ends_at && Date.parse(p.discount_ends_at) <= now) return 0;
  return p.discount_percent;
}

export function publicProduct(p) {
  const percent = productPercent(p);
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    brand: p.brand,
    description: p.description,
    imageUrl: p.image_url,
    price: p.price,
    stock: p.stock,
    percent,
    finalPrice: applyPct(p.price, percent),
    discountEndsAt: percent ? iso(p.discount_ends_at) : null,
  };
}

export async function createProductOrder(db, { userId, productId, qty }) {
  return Number(ok(await db.rpc('gv_create_product_order', { p_user: userId, p_product: productId, p_qty: qty })));
}
