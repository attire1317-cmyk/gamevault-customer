import { getDb, ok } from '@/lib/db';
import { handler, json } from '@/lib/http';
import { publicProduct } from '@/lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public list of consoles and accessories for sale.
export const GET = handler({}, async () => {
  const rows = ok(
    await getDb()
      .from('products')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
  );
  return json({ serverNow: new Date().toISOString(), products: rows.map(publicProduct) });
});
