'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, errText } from '@/lib/api';
import { reconnectLive } from '@/lib/live';
import { refreshUser } from './hooks';

function safeNext() {
  const n = new URLSearchParams(window.location.search).get('next') || '/';
  return n.startsWith('/') && !n.startsWith('//') ? n : '/';
}

export default function AuthForm({ mode }) {
  const router = useRouter();
  const register = mode === 'register';
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = register
        ? { name: form.name, email: form.email, phone: form.phone, password: form.password }
        : { email: form.email, password: form.password };
      await api(`/api/auth/${register ? 'register' : 'login'}`, { method: 'POST', body });
      await refreshUser();
      reconnectLive();
      router.push(safeNext());
      router.refresh();
    } catch (err) {
      setError(errText(err));
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <form className="auth-card" onSubmit={submit} noValidate>
        <h1>{register ? 'Create your account' : 'Welcome back'}</h1>
        <p className="muted">{register ? 'Rent and buy in a few taps.' : 'Sign in to see your rentals and orders.'}</p>

        {register && (
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" autoComplete="name" value={form.name} onChange={set('name')} required maxLength={60} />
          </div>
        )}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} required maxLength={120} />
        </div>
        {register && (
          <div className="field">
            <label htmlFor="phone">Phone (optional)</label>
            <input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} maxLength={20} />
          </div>
        )}
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete={register ? 'new-password' : 'current-password'}
            value={form.password}
            onChange={set('password')}
            required
            maxLength={72}
          />
          {register && <span className="hint">At least 8 characters.</span>}
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy ? 'Please wait...' : register ? 'Create account' : 'Sign in'}
        </button>
        <p className="auth-alt">
          {register ? (
            <>
              Already have an account? <Link href="/login">Sign in</Link>
            </>
          ) : (
            <>
              New here? <Link href="/register">Create an account</Link>
            </>
          )}
        </p>
      </form>
    </main>
  );
}
