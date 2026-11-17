import { createClient } from '@supabase/supabase-js';

// Live updates through Supabase Realtime. The database touches a row in `live_pings`
// whenever a game, offer, rental or order changes (in ANY app), and every open page
// refetches its own data. The row holds no private data, so the public anon key is safe here.
// If the keys are missing, pages still refresh by themselves every 60 seconds.
let client = null;
let channel = null;
const subs = new Set();

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

function connect() {
  if (channel || typeof window === 'undefined' || !subs.size) return;
  const sb = getClient();
  if (!sb) return;
  channel = sb
    .channel('gv-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'live_pings' }, () => subs.forEach((f) => f()))
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') subs.forEach((f) => f());
    });
}

function disconnect() {
  if (channel && client) client.removeChannel(channel);
  channel = null;
}

export function subscribe(fn) {
  subs.add(fn);
  connect();
  return () => {
    subs.delete(fn);
    if (!subs.size) disconnect();
  };
}

// Kept so existing calls after login/logout still work. Realtime is not per-user, so nothing to redo.
export function reconnectLive() {}
