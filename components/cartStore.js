'use client';
import { useSyncExternalStore } from 'react';

// Tiny cart for consoles and accessories. Lives in this browser (localStorage); the server prices everything again at checkout.
const KEY = 'gv_cart';
const EMPTY = { items: [], open: false };
let state = EMPTY;
let loaded = false;
const subs = new Set();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (Array.isArray(v)) state = { ...state, items: v.filter((x) => Number.isInteger(x?.id) && x.qty >= 1 && x.qty <= 5).slice(0, 20) };
  } catch {}
}
function set(next) {
  state = { ...state, ...next };
  if (next.items) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state.items));
    } catch {}
  }
  subs.forEach((f) => f());
}

export function addToCart(id, qty = 1) {
  load();
  const cur = state.items.find((x) => x.id === id);
  const items = cur ? state.items.map((x) => (x.id === id ? { ...x, qty: Math.min(5, x.qty + qty) } : x)) : [...state.items, { id, qty: Math.min(5, qty) }];
  set({ items, open: true });
}
export const setQty = (id, qty) => set({ items: state.items.map((x) => (x.id === id ? { ...x, qty: Math.min(5, Math.max(1, qty)) } : x)) });
export const removeItem = (id) => set({ items: state.items.filter((x) => x.id !== id) });
export const clearCart = () => set({ items: [] });
export const openCart = () => set({ open: true });
export const closeCart = () => set({ open: false });

export function useCart() {
  return useSyncExternalStore(
    (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    () => {
      load();
      return state;
    },
    () => EMPTY
  );
}
