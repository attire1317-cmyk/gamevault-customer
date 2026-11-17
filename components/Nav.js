'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const [pill, setPill] = useState(null);
  const wrap = useRef(null);
  const items = useRef({});

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
    { href: '/shop', label: 'Shop' },
    ...(user ? [{ href: '/account', label: 'My rentals' }] : []),
  ];
  const isOn = (href) => (href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`));
  const active = links.find((l) => isOn(l.href))?.href;

  // The highlight is placed from the link's own offsets inside the nav, never from page
  // coordinates. The old shared-layout animation was measured against the page scroll,
  // so after scrolling the badge flew in from below instead of sliding between links.
  const measure = useCallback(() => {
    const el = items.current[active];
    if (!el || window.matchMedia('(max-width: 767px)').matches) return setPill(null);
    setPill({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
  }, [active]);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (wrap.current) ro.observe(wrap.current);
    Object.values(items.current).forEach((el) => el && ro.observe(el));
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure, links.length]);

  return (
    <header className={`nav ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container nav-inner">
        <Link href="/" className="brand" aria-label={`${STORE} home`}>
          <GameController size={26} weight="fill" />
          <span>{STORE}</span>
        </Link>

        <nav ref={wrap} className={`nav-links ${open ? 'is-open' : ''}`} aria-label="Main">
          {pill && <motion.span className="nav-pill" aria-hidden="true" initial={false} animate={{ x: pill.x, y: pill.y, width: pill.w, height: pill.h }} transition={spring} />}
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              ref={(el) => {
                items.current[l.href] = el;
              }}
              className={`nav-link ${isOn(l.href) ? 'is-on' : ''}`}
              aria-current={isOn(l.href) ? 'page' : undefined}
            >
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
