// Sliding-window rate limiter, in memory.
// NOTE: counters live inside one Node process. If you run several instances
// (or serverless), swap `store` for Redis/Upstash so limits are shared.

const PRESETS = {
  api: { max: 120, windowMs: 60_000 }, // general reads
  write: { max: 40, windowMs: 60_000 }, // any mutation
  auth: { max: 10, windowMs: 15 * 60_000 }, // login / register: 10 per 15 min
  stream: { max: 20, windowMs: 60_000 }, // live connections
};

const MAX_KEYS = 50_000;
const g = globalThis;
const store = g.__gvRateStore ?? (g.__gvRateStore = new Map());

if (!g.__gvRateSweep) {
  g.__gvRateSweep = setInterval(() => {
    const now = Date.now();
    for (const [key, arr] of store) {
      if (!arr.length || now - arr[arr.length - 1] > 15 * 60_000) store.delete(key);
    }
  }, 5 * 60_000);
  g.__gvRateSweep.unref?.();
}

export function rateLimit(key, preset) {
  const { max, windowMs } = PRESETS[preset];
  const now = Date.now();
  const k = `${preset}:${key}`;
  const arr = (store.get(k) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    store.set(k, arr);
    return { ok: false, retryAfter: Math.max(1, Math.ceil((windowMs - (now - arr[0])) / 1000)) };
  }
  arr.push(now);
  store.set(k, arr);
  if (store.size > MAX_KEYS) {
    // memory guard: drop the oldest keys
    let drop = store.size - MAX_KEYS;
    for (const key2 of store.keys()) {
      store.delete(key2);
      if (--drop <= 0) break;
    }
  }
  return { ok: true };
}
