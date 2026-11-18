'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarCheck, CaretDown, GameController, House, SignOut, Storefront, UserCircle } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { reconnectLive } from '@/lib/live';
import { refreshUser, useUser } from './hooks';
import { spring } from './motion';
import CartDrawer, { CartButton } from './Cart';
import Notifications from './Notifications';

const STORE = process.env.NEXT_PUBLIC_STORE_NAME || 'GameVault';
const ease = [0.16, 1, 0.3, 1];

const menu = { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.06 } } };
const row = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } } };

function Burger({ open }) {
  const t = { duration: 0.28, ease };
  return (
    <span className="burger" aria-hidden="true">
      <motion.span animate={open ? { y: 4, rotate: 45 } : { y: -4, rotate: 0 }} transition={t} />
      <motion.span animate={open ? { y: -4, rotate: -45 } : { y: 4, rotate: 0 }} transition={t} />
    </span>
  );
}

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useEffect(() => {
    if (!open) return;
    const away = (e) => !box.current?.contains(e.target) && setOpen(false);
    const key = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', key);
    };
  }, [open]);
  return (
    <div className="user-menu" ref={box}>
      <button type="button" className="user-btn" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((o) => !o)}>
        <span className="avatar" aria-hidden="true">
          {(user.name || '?').trim().charAt(0).toUpperCase()}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease }} style={{ display: 'inline-grid' }}>
          <CaretDown size={14} weight="bold" />
        </motion.span>
        <span className="sr-only">Account menu</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="user-panel" role="menu" initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.2, ease }}>
            <div className="user-who">
              <strong>{user.name}</strong>
              <span className="muted">{user.email}</span>
            </div>
            <Link href="/profile" role="menuitem" className="user-item" onClick={() => setOpen(false)}>
              <UserCircle size={18} weight="bold" /> Profile
            </Link>
            <Link href="/account" role="menuitem" className="user-item" onClick={() => setOpen(false)}>
              <CalendarCheck size={18} weight="bold" /> My rentals
            </Link>
            <button role="menuitem" className="user-item" onClick={onLogout}>
              <SignOut size={18} weight="bold" /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Nav() {
  const user = useUser();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pill, setPill] = useState(null);
  const rail = useRef(null);
  const items = useRef({});

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  // Mobile menu: lock page scroll, close on Escape, close when the screen grows to desktop size.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const key = (e) => e.key === 'Escape' && setOpen(false);
    const mq = matchMedia('(min-width: 768px)');
    const grow = () => mq.matches && setOpen(false);
    window.addEventListener('keydown', key);
    mq.addEventListener('change', grow);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', key);
      mq.removeEventListener('change', grow);
    };
  }, [open]);

  async function logout() {
    try {
      await api('/api/auth/logout', { method: 'POST', body: {} });
    } catch {}
    await refreshUser();
    reconnectLive();
    setOpen(false);
    router.push('/');
    router.refresh();
  }

  const links = [
    { href: '/', label: 'Home', icon: House },
    { href: '/games', label: 'Games', icon: GameController },
    { href: '/shop', label: 'Shop', icon: Storefront },
    ...(user ? [{ href: '/account', label: 'My rentals', icon: CalendarCheck }] : []),
  ];
  const isOn = (href) => (href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`));
  const active = links.find((l) => isOn(l.href))?.href;

  // The highlight is placed from the link's own offsets inside the rail, never from page coordinates.
  const measure = useCallback(() => {
    const el = items.current[active];
    if (!el || !rail.current || rail.current.offsetParent === null) return setPill(null);
    setPill({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
  }, [active]);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (rail.current) ro.observe(rail.current);
    Object.values(items.current).forEach((el) => el && ro.observe(el));
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure, links.length]);

  return (
    <>
      <header className={`nav ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}>
        <div className="container">
          <div className="nav-bar">
            <Link href="/" className="brand" aria-label={`${STORE} home`}>
              <GameController size={26} weight="fill" />
              <span>{STORE}</span>
            </Link>

            <nav ref={rail} className="nav-links" aria-label="Main">
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
            </nav>

            <div className="nav-tools">
              <CartButton />
              {user && <Notifications />}
              <div className="nav-account">
                {user === undefined ? null : user ? (
                  <UserMenu user={user} onLogout={logout} />
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
              <button type="button" className="icon-btn nav-toggle" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-menu">
                <Burger open={open} />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <>
              <motion.button key="scrim" type="button" className="nav-scrim" aria-label="Close menu" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} />
              <motion.div key="menu" id="mobile-menu" className="nav-menu" initial={{ opacity: 0, y: -14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.18 } }} transition={{ duration: 0.38, ease }}>
                <motion.nav variants={menu} initial="hidden" animate="show" aria-label="Mobile">
                  {links.map((l) => {
                    const Icon = l.icon;
                    return (
                      <motion.div key={l.href} variants={row}>
                        <Link href={l.href} className={`menu-link ${isOn(l.href) ? 'is-on' : ''}`} aria-current={isOn(l.href) ? 'page' : undefined}>
                          <Icon size={22} weight={isOn(l.href) ? 'fill' : 'bold'} />
                          {l.label}
                        </Link>
                      </motion.div>
                    );
                  })}
                  <motion.div variants={row} className="menu-account">
                    {user === undefined ? null : user ? (
                      <>
                        <div className="menu-who">
                          <span className="avatar" aria-hidden="true">
                            {(user.name || '?').trim().charAt(0).toUpperCase()}
                          </span>
                          <span>
                            <strong>{user.name}</strong>
                            <small className="muted">{user.email}</small>
                          </span>
                        </div>
                        <Link href="/profile" className="btn btn-ghost">
                          <UserCircle size={18} weight="bold" /> Profile
                        </Link>
                        <button className="btn btn-ghost" onClick={logout}>
                          <SignOut size={18} weight="bold" /> Sign out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href="/login" className="btn btn-ghost">
                          Sign in
                        </Link>
                        <Link href="/register" className="btn btn-primary">
                          Create account
                        </Link>
                      </>
                    )}
                  </motion.div>
                </motion.nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
      <CartDrawer />
    </>
  );
}
