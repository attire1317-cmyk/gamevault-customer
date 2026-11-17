// Browser-side fetch helper. Same-origin cookies, JSON in and out, readable errors.
export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) {
    const err = new Error(data?.error || 'Something went wrong. Please try again.');
    err.status = res.status;
    err.details = data?.details;
    throw err;
  }
  return data;
}

export function errText(e) {
  if (e?.details?.length) return e.details.map((d) => d.message).join('. ');
  return e?.message || 'Something went wrong.';
}
