'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { subscribe } from '@/lib/live';

// Loads data, then refetches whenever the server announces a change
// (plus a slow safety poll in case the live connection drops).
export function useLive(load) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const loadRef = useRef(load);
  loadRef.current = load;

  const refresh = useCallback(async () => {
    try {
      setData(await loadRef.current());
      setError(null);
    } catch (e) {
      setError(e?.message || 'Could not load.');
    }
  }, []);

  useEffect(() => {
    let timer;
    refresh();
    const off = subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 150);
    });
    const poll = setInterval(refresh, 60_000);
    return () => {
      off();
      clearInterval(poll);
      clearTimeout(timer);
    };
  }, [refresh]);

  return { data, error, refresh };
}

// A ticking "now" corrected to the server clock, so remaining days match everywhere
// even when the visitor's device clock is wrong.
export function useNow(serverNow, every = 15_000) {
  const [, setTick] = useState(0);
  const offset = useMemo(() => (serverNow ? Date.parse(serverNow) - Date.now() : 0), [serverNow]);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), every);
    return () => clearInterval(id);
  }, [every]);
  return Date.now() + offset;
}

let current; // undefined = unknown yet, null = signed out
const listeners = new Set();

export async function refreshUser() {
  try {
    current = (await api('/api/auth/me')).user;
  } catch {
    current = null;
  }
  listeners.forEach((f) => f(current));
  return current;
}

export function useUser() {
  const [user, setUser] = useState(current);
  useEffect(() => {
    listeners.add(setUser);
    if (current === undefined) refreshUser();
    else setUser(current);
    return () => listeners.delete(setUser);
  }, []);
  return user;
}
