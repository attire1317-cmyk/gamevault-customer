import bcrypt from 'bcryptjs';
import { getDb, audit } from '@/lib/db';
import { handler, json, HttpError } from '@/lib/http';
import { registerSchema } from '@/lib/validate';
import { setSession } from '@/lib/auth';

export const runtime = 'nodejs';

export const POST = handler({ limit: 'auth', body: registerSchema }, async ({ data }) => {
  const db = getDb();
  const hash = await bcrypt.hash(data.password, 12);
  const { data: row, error } = await db
    .from('users')
    .insert({ name: data.name, email: data.email, phone: data.phone || null, password_hash: hash, role: 'customer' })
    .select('id, name, email, role')
    .single();
  if (error?.code === '23505') throw new HttpError(409, 'An account with this email already exists.');
  if (error) throw new Error(`[supabase] ${error.message}`);
  await audit(db, row.id, 'user.register');
  await setSession(row.id);
  return json({ user: row }, 201);
});
