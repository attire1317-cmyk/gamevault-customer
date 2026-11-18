import { handler, json, HttpError } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Looks up the city and state of an Indian pincode on the server (the browser may only talk to this site).
// Results are cached in memory for a day, so repeated lookups never hit the public service again.
const cache = globalThis.__gvPin ?? (globalThis.__gvPin = new Map());
const DAY = 86_400_000;

export const GET = handler({}, async ({ params }) => {
  const pin = String(params.pin || '');
  if (!/^[1-9][0-9]{5}$/.test(pin)) throw new HttpError(422, 'Enter a 6 digit pincode.');

  const hit = cache.get(pin);
  if (hit && Date.now() - hit.at < DAY) return json(hit.value);

  let value;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: AbortSignal.timeout(5000), cache: 'no-store' });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const body = await res.json();
    const offices = body?.[0]?.Status === 'Success' ? body[0].PostOffice || [] : [];
    value = offices.length
      ? {
          found: true,
          city: String(offices[0].District || offices[0].Block || '').slice(0, 60),
          state: String(offices[0].State || '').slice(0, 60),
          areas: [...new Set(offices.map((o) => String(o.Name || '')).filter(Boolean))].slice(0, 8),
        }
      : { found: false };
  } catch (e) {
    console.error('[pincode]', e?.message);
    throw new HttpError(502, 'Could not look up that pincode right now.');
  }
  cache.set(pin, { at: Date.now(), value });
  if (cache.size > 2000) cache.delete(cache.keys().next().value);
  return json(value);
});
