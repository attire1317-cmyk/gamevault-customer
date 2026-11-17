'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Tag } from '@phosphor-icons/react';
import { money } from '@/lib/format';
import { spring } from './motion';

export function GridSkeleton({ n = 6 }) {
  return (
    <div className="grid">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="card-game skeleton" aria-hidden="true" />
      ))}
    </div>
  );
}

export default function GameCard({ game, onAct, index = 0, flat = false, clone = false }) {
  const rentOut = game.stockRent < 1 || game.rentPerDay === 0;
  const soldOut = game.stockSale < 1 || game.salePrice === 0;
  const low = (n) => (n > 0 && n <= 2 ? `${n} left` : null);
  return (
    <motion.article
      className="card-game"
      aria-hidden={clone || undefined}
      {...(flat
        ? { whileHover: { y: -4 }, transition: spring }
        : {
            layout: true,
            initial: { opacity: 0, y: 28 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true, margin: '0px 0px -8% 0px' },
            exit: { opacity: 0, scale: 0.96, transition: { duration: 0.18 } },
            whileHover: { y: -4 },
            transition: { ...spring, delay: (index % 4) * 0.06, opacity: { duration: 0.4, delay: (index % 4) * 0.06 } },
          })}
    >
      <Link href={`/games/${game.id}`} className="card-media card-media-link" tabIndex={clone ? -1 : undefined} aria-label={`${game.title}, view details`}>
        <img src={game.imageUrl} alt={`${game.title} cover`} width="640" height="800" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
        {(game.rentPercent > 0 || game.buyPercent > 0) && (
          <span className="badge badge-deal">
            <Tag size={14} weight="fill" /> Up to {Math.max(game.rentPercent, game.buyPercent)}% off
          </span>
        )}
      </Link>
      <div className="card-body">
        <p className="card-meta">
          {game.platform}
          {game.genre ? `, ${game.genre}` : ''}
        </p>
        <h3>
          <Link href={`/games/${game.id}`} tabIndex={clone ? -1 : undefined}>
            {game.title}
          </Link>
        </h3>
        <div className="prices">
          <div>
            <span className="muted">Rent</span>
            <strong className="mono">
              {game.rentPerDay === 0 ? 'N/A' : <>{game.rentPercent > 0 && <s>{money(game.rentPerDay)}</s>} {money(game.rentFinal)}</>}
              {game.rentPerDay !== 0 && <small>/day</small>}
            </strong>
            {low(game.stockRent) && <em className="low">{low(game.stockRent)}</em>}
          </div>
          <div>
            <span className="muted">Buy</span>
            <strong className="mono">
              {game.salePrice === 0 ? 'N/A' : <>{game.buyPercent > 0 && <s>{money(game.salePrice)}</s>} {money(game.buyFinal)}</>}
            </strong>
            {low(game.stockSale) && <em className="low">{low(game.stockSale)}</em>}
          </div>
        </div>
        <div className="card-actions">
          <button className="btn btn-primary" tabIndex={clone ? -1 : undefined} disabled={rentOut} onClick={() => onAct(game, 'rent')}>
            {rentOut ? 'Rented out' : 'Rent'}
          </button>
          <button className="btn btn-ghost" tabIndex={clone ? -1 : undefined} disabled={soldOut} onClick={() => onAct(game, 'buy')}>
            {soldOut ? 'Sold out' : 'Buy'}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
