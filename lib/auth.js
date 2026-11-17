import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getDb } from './db';

export const COOKIE_NAME = 'gv_session';
const ROLE = 'customer'; // this app only ever signs in users with this role
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days

function secretKey() {
  let s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET must be set to 32+ random characters.');
    }
    s = 'dev-only-insecure-secret-change-me-0123456789abcdef';
  }
  return new TextEncoder().encode(s);
}

function useSecureCookie() {
  if (process.env.COOKIE_SECURE) return process.env.COOKIE_SECURE === '1';
  return process.env.NODE_ENV === 'production';
}

export async function setSession(userId) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: useSecureCookie(),
    sameSite: 'strict',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  (await cookies()).set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: useSecureCookie(),
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

// The user and role are always read from the database, never trusted from the token.
export async function getSessionUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    const id = Number(payload.sub);
    if (!Number.isInteger(id)) return null;
    const { data } = await getDb().from('users').select('id, name, email, role').eq('id', id).eq('role', ROLE).maybeSingle();
    return data || null;
  } catch {
    return null;
  }
}
