import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { HttpError } from './errors';
import { rateLimit } from './ratelimit';
import { getSessionUser } from './auth';

export { HttpError };

const NO_STORE = { 'Cache-Control': 'no-store' };

export function json(data, status = 200, headers = {}) {
  return NextResponse.json(data, { status, headers: { ...NO_STORE, ...headers } });
}

// With TRUST_PROXY=1 we use the right-most X-Forwarded-For entry, i.e. the address
// your own proxy appended. Left-most entries can be forged by the client.
export function clientIp(request) {
  if (process.env.TRUST_PROXY === '1') {
    const xf = request.headers.get('x-forwarded-for');
    if (xf) return xf.split(',').pop().trim();
  }
  return request.headers.get('x-real-ip') || 'local';
}

// CSRF defence in depth (cookies are already SameSite=Strict): mutating requests must come from our own origin.
function checkOrigin(request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!origin) throw new HttpError(403, 'Forbidden.');
  try {
    const o = new URL(origin);
    if (o.host === host || allowed.includes(origin)) return;
  } catch {}
  throw new HttpError(403, 'Forbidden.');
}

async function readJson(request) {
  const type = request.headers.get('content-type') || '';
  if (!type.includes('application/json')) throw new HttpError(415, 'Expected JSON.');
  const text = await request.text();
  if (text.length > 20_000) throw new HttpError(413, 'Request too large.');
  try {
    return JSON.parse(text || '{}');
  } catch {
    throw new HttpError(400, 'Invalid JSON.');
  }
}

function errorResponse(e) {
  if (e instanceof HttpError) {
    const headers = e.extra?.retryAfter ? { 'Retry-After': String(e.extra.retryAfter) } : {};
    return json({ error: e.message }, e.status, headers);
  }
  if (e instanceof ZodError) {
    return json(
      { error: 'Please check the highlighted fields.', details: e.issues.map((i) => ({ field: i.path.join('.'), message: i.message })) },
      422
    );
  }
  console.error('[api error]', e?.message || e); // never send internals to the client
  return json({ error: 'Something went wrong. Please try again.' }, 500);
}

/**
 * Wraps an API route: rate limit, origin check, auth, role check, body validation, safe errors.
 * opts: { limit?: 'api'|'write'|'auth', auth?: bool, admin?: bool, body?: zodSchema }
 */
export function handler(opts, fn) {
  return async (request, ctx) => {
    try {
      const ip = clientIp(request);
      const mutating = !['GET', 'HEAD'].includes(request.method);

      const base = rateLimit(ip, 'api');
      if (!base.ok) throw new HttpError(429, 'Too many requests. Please slow down.', { retryAfter: base.retryAfter });
      const preset = opts.limit || (mutating ? 'write' : null);
      if (preset && preset !== 'api') {
        const rl = rateLimit(ip, preset);
        if (!rl.ok) throw new HttpError(429, 'Too many requests. Please try again later.', { retryAfter: rl.retryAfter });
      }

      if (mutating) checkOrigin(request);

      let user = null;
      if (opts.auth || opts.admin) {
        user = await getSessionUser();
        if (!user) throw new HttpError(401, 'Please sign in.');
        if (opts.admin && user.role !== 'admin') throw new HttpError(403, 'Forbidden.');
      }

      const data = opts.body ? opts.body.parse(await readJson(request)) : undefined;
      const params = ctx?.params ? await ctx.params : {};
      return await fn({ request, user, ip, data, params });
    } catch (e) {
      return errorResponse(e);
    }
  };
}

export function intParam(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(404, 'Not found.');
  return n;
}
