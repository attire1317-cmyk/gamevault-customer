'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GameController, List, X, SignOut } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { reconnectLive } from '@/lib/live';
import { refreshUser, useUser } from './hooks';
import { spring } from './motion';

const STORE = process.env.NEXT_PUBLIC_STORE_NAME || 'GameVault';

export default function Nav() {
  const user = useUser();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  async function logout() {
    try {
      await api('/api/auth/logout', { method: 'POST', body: {} });
    } catch {}
    await refreshUser();
    reconnectLive();
    router.push('/');
    router.refresh();
  }

  const links = [
    { href: '/', label: 'Home' },
    { href: '/games', label: 'Games' },
    ...(user ? [{ href: '/account', label: 'My rentals' }] : []),
  ];
  const isOn = (href) => (href === '/account' ? path === '/account' : href === '/games' ? path.startsWith('/games') : path === '/');

  return (
    <header className={`nav ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container nav-inner">
        <Link href="/" className="brand" aria-label={`${STORE} home`}>
          <GameController size={26} weight="fill" />
          <span>{STORE}</span>
        </Link>

        <nav className={`nav-links ${open ? 'is-open' : ''}`} aria-label="Main">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={`nav-link ${isOn(l.href) ? 'is-on' : ''}`} aria-current={isOn(l.href) ? 'page' : undefined}>
              {isOn(l.href) && <motion.span layoutId="nav-pill" className="nav-pill" transition={spring} />}
              <span className="nav-label">{l.label}</span>
            </Link>
          ))}
          <div className="nav-auth">
            {user === undefined ? null : user ? (
              <>
                <span className="avatar" title={user.name} aria-hidden="true">
                  {(user.name || '?').trim().charAt(0).toUpperCase()}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={logout}>
                  <SignOut size={16} weight="bold" /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost btn-sm">
                  Sign in
                </Link>
                <Link href="/register" className="btn btn-primary btn-sm">
                  Create account
                </Link>
              </>
            )}
          </div>
        </nav>

        <button className="icon-btn nav-toggle" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
          {open ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
        </button>
      </div>
    </header>
  );
}
