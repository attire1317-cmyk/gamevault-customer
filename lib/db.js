import { createClient } from '@supabase/supabase-js';
import { HttpError } from './errors';

// Server-side Supabase client. Uses the SERVICE ROLE key, so this file must never
// be imported from a 'use client' component. The key is never sent to the browser.
function make() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (see .env.example).');
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function getDb() {
  const g = globalThis;
  if (!g.__gvSb) g.__gvSb = make();
  return g.__gvSb;
}

// Unwraps a Supabase result. Database functions raise 'GV:<status>:<message>' for
// expected problems (out of stock, not found); those become clean HTTP errors.
export function ok({ data, error }) {
  if (error) {
    const m = /^GV:(\d{3}):([\s\S]*)$/.exec(error.message || '');
    if (m) throw new HttpError(Number(m[1]), m[2]);
    const e = new Error(`[supabase] ${error.message}`);
    e.code = error.code;
    throw e;
  }
  return data;
}

// Postgres returns timestamps like 2026-11-17T10:00:00.123456+00:00. Normalise to plain ISO.
export const iso = (v) => (v ? new Date(v).toISOString() : null);

export async function audit(db, actorId, action, detail = '') {
  try {
    await db.from('audit').insert({ actor_id: actorId ?? null, action, detail: String(detail).slice(0, 300) });
  } catch {}
}
