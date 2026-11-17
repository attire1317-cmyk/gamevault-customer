import bcrypt from 'bcryptjs';
import { getDb, ok, audit } from '@/lib/db';
import { handler, json, HttpError } from '@/lib/http';
import { loginSchema } from '@/lib/validate';
import { setSession } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';

export const runtime = 'nodejs';

// Compared against when the email is unknown, so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-password', 12);
const LOCK_AFTER = 5;
const LOCK_MINUTES = 15;

export const POST = handler({ limit: 'auth', body: loginSchema }, async ({ data }) => {
  const db = getDb();

  const perAccount = rateLimit(data.email, 'auth');
  if (!perAccount.ok) {
    throw new HttpError(429, 'Too many attempts. Try again later.', { retryAfter: perAccount.retryAfter });
  }

  // Only accounts with this app's role can sign in here (customer accounts).
  const u = ok(await db.from('users').select('*').eq('email', data.email).eq('role', 'customer').maybeSingle());
  const now = Date.now();

  if (u?.locked_until && Date.parse(u.locked_until) > now) {
    await bcrypt.compare(data.password, DUMMY_HASH);
    throw new HttpError(429, 'This account is temporarily locked. Try again in a few minutes.');
  }

  const good = await bcrypt.compare(data.password, u?.password_hash ?? DUMMY_HASH);
  if (!u || !good) {
    if (u) {
      const fails = u.failed_logins + 1;
      if (fails >= LOCK_AFTER) {
        ok(
          await db
            .from('users')
            .update({ failed_logins: 0, locked_until: new Date(now + LOCK_MINUTES * 60_000).toISOString() })
            .eq('id', u.id)
        );
        await audit(db, u.id, 'user.locked');
      } else {
        ok(await db.from('users').update({ failed_logins: fails }).eq('id', u.id));
      }
    }
    throw new HttpError(401, 'Invalid email or password.');
  }

  ok(await db.from('users').update({ failed_logins: 0, locked_until: null }).eq('id', u.id));
  await audit(db, u.id, 'user.login');
  await setSession(u.id);
  return json({ user: { id: u.id, name: u.name, email: u.email, role: u.role } });
});
