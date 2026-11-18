'use client';
import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart } from '@phosphor-icons/react';
import { api, errText } from '@/lib/api';
import { useUser } from './hooks';
import { toast } from './Toaster';
import { spring } from './motion';

// Saved items. Saving something that is out of stock means "tell me when it is back": the database notifies everyone who saved it.
const EMPTY = { games: [], products: [], ready: false };
let state = EMPTY;
let loading = false;
const subs = new Set();
const emit = (next) => {
  state = next;
  subs.forEach((f) => f());
};

async function loadWish() {
  if (loading || state.ready) return;
  loading = true;
  try {
    const d = await api('/api/wishlist');
    emit({ games: d.games, products: d.products, ready: true });
  } catch {}
  loading = false;
}
const reset = () => state.ready && emit(EMPTY);

export function useWish() {
  const user = useUser();
  useEffect(() => {
    if (user) loadWish();
    else if (user === null) reset();
  }, [user]);
  return useSyncExternalStore(
    (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    () => state,
    () => EMPTY
  );
}

export function WishButton({ kind, id, labelled = false, className = '', soldOut = false }) {
  const router = useRouter();
  const user = useUser();
  const w = useWish();
  const list = kind === 'game' ? w.games : w.products;
  const on = list.includes(id);

  async function toggle(e) {
    e.preventDefault();
    e.stopPropagation();
    if (user === null) return router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    const key = kind === 'game' ? 'games' : 'products';
    const prev = state;
    emit({ ...state, [key]: on ? list.filter((x) => x !== id) : [...list, id] });
    try {
      await api('/api/wishlist', { method: 'POST', body: { [kind === 'game' ? 'gameId' : 'productId']: id, on: !on } });
      if (!on) toast(soldOut ? 'Saved. We will tell you when it is back.' : 'Saved to your list.');
    } catch (err) {
      emit(prev);
      toast(errText(err), 'error');
    }
  }

  return (
    <motion.button
      type="button"
      className={`wish ${labelled ? 'wish-label' : ''} ${on ? 'is-on' : ''} ${className}`}
      aria-pressed={on}
      aria-label={on ? 'Remove from saved' : soldOut ? 'Notify me when back' : 'Save for later'}
      onClick={toggle}
      whileTap={{ scale: 0.9 }}
      transition={spring}
    >
      <motion.span animate={on ? { scale: [1, 1.35, 1] } : { scale: 1 }} transition={{ duration: 0.35 }} style={{ display: 'inline-grid' }}>
        <Heart size={labelled ? 20 : 18} weight={on ? 'fill' : 'bold'} />
      </motion.span>
      {labelled && <span>{on ? 'Saved' : soldOut ? 'Notify me' : 'Save'}</span>}
    </motion.button>
  );
}
