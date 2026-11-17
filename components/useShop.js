'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from './hooks';
import Checkout from './Checkout';

// Shared Rent/Buy flow for every page that lists games.
export function useShop(data, now) {
  const router = useRouter();
  const user = useUser();
  const [active, setActive] = useState(null); // { game, mode }

  const act = (game, mode) => {
    if (user === null) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setActive({ game, mode });
  };

  // keep the open sheet in sync with live stock and price changes
  const live = active && data ? { ...active, game: data.games.find((g) => g.id === active.game.id) || active.game } : active;
  const sheet = live ? <Checkout game={live.game} mode={live.mode} now={now} onClose={() => setActive(null)} /> : null;
  return { act, sheet };
}
