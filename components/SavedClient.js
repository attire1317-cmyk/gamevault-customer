'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useLive, useNow } from './hooks';
import { useShop } from './useShop';
import { useWish } from './wish';
import GameCard, { GridSkeleton } from './GameCard';
import { ProductCard } from './ProductCatalog';

function Empty({ what, href }) {
  return (
    <div className="empty saved-empty">
      <Heart size={36} weight="duotone" />
      <p>No saved {what} yet. Tap the heart on any {what === 'games' ? 'game' : 'item'} to keep it here.</p>
      <Link href={href} className="btn btn-primary">
        Browse {what}
      </Link>
    </div>
  );
}

export default function SavedClient() {
  const w = useWish();
  const games = useLive(() => api('/api/games'));
  const products = useLive(() => api('/api/products'));
  const now = useNow(games.data?.serverNow);
  const { act, sheet } = useShop(games.data, now);

  const savedGames = useMemo(() => (games.data?.games || []).filter((g) => w.games.includes(g.id)), [games.data, w.games]);
  const savedItems = useMemo(() => (products.data?.products || []).filter((p) => w.products.includes(p.id)), [products.data, w.products]);
  const loading = !w.ready || !games.data || !products.data;

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <h1 className="section-title">
            <Heart size={30} weight="fill" className="saved-ico" /> Saved
          </h1>
          {!loading && <p className="muted">{savedGames.length + savedItems.length} saved</p>}
        </div>

        {loading ? (
          <GridSkeleton n={4} />
        ) : (
          <>
            <motion.h2 className="saved-h" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Games <span className="muted">{savedGames.length}</span>
            </motion.h2>
            {savedGames.length === 0 ? (
              <Empty what="games" href="/games" />
            ) : (
              <div className="grid">
                <AnimatePresence mode="popLayout">
                  {savedGames.map((g, i) => (
                    <GameCard key={g.id} game={g} index={i} onAct={act} />
                  ))}
                </AnimatePresence>
              </div>
            )}

            <h2 className="saved-h">
              Consoles and accessories <span className="muted">{savedItems.length}</span>
            </h2>
            {savedItems.length === 0 ? (
              <Empty what="items" href="/shop" />
            ) : (
              <div className="grid">
                <AnimatePresence mode="popLayout">
                  {savedItems.map((p, i) => (
                    <ProductCard key={p.id} p={p} index={i} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
      {sheet}
    </section>
  );
}
