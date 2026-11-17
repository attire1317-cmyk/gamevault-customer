'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlass, Tag } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { useLive } from './hooks';
import { GridSkeleton } from './GameCard';
import { spring } from './motion';

export const CATEGORIES = [
  ['all', 'All'],
  ['console', 'Consoles'],
  ['controller', 'Controllers'],
  ['accessory', 'Accessories'],
];
export const categoryLabel = (c) => CATEGORIES.find(([k]) => k === c)?.[1].replace(/s$/, '') ?? c;

function ProductCard({ p, index }) {
  const out = p.stock < 1;
  return (
    <motion.article
      className="card-game"
      layout
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
      whileHover={{ y: -4 }}
      transition={{ ...spring, delay: (index % 4) * 0.06, opacity: { duration: 0.4, delay: (index % 4) * 0.06 } }}
    >
      <Link href={`/shop/${p.id}`} className="card-media card-media-link" aria-label={`${p.name}, view details`}>
        <img src={p.imageUrl} alt="" width="640" height="800" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
        {p.percent > 0 && (
          <span className="badge badge-deal">
            <Tag size={14} weight="fill" /> {p.percent}% off
          </span>
        )}
      </Link>
      <div className="card-body">
        <p className="card-meta">
          {categoryLabel(p.category)}
          {p.brand ? `, ${p.brand}` : ''}
        </p>
        <h3>
          <Link href={`/shop/${p.id}`}>{p.name}</Link>
        </h3>
        <div className="prices one">
          <strong className="mono">
            {p.percent > 0 && <s>{money(p.price)}</s>} {money(p.finalPrice)}
          </strong>
          {out ? <em className="low">Out of stock</em> : p.stock <= 2 && <em className="low">{p.stock} left</em>}
        </div>
        <div className="card-actions single">
          <Link href={`/shop/${p.id}`} className={`btn ${out ? 'btn-ghost' : 'btn-primary'}`}>
            {out ? 'See details' : 'View and buy'}
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

export default function ProductCatalog() {
  const { data, error, refresh } = useLive(() => api('/api/products'));
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');

  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data?.products || []).filter((p) => (cat === 'all' || p.category === cat) && (!term || `${p.name} ${p.brand}`.toLowerCase().includes(term)));
  }, [data, cat, q]);

  return (
    <section className="section">
      <div className="container">
        <h1 className="section-title">Consoles and accessories</h1>
        <div className="toolbar">
          <div className="search">
            <MagnifyingGlass size={18} />
            <input type="search" placeholder="Search consoles and accessories" aria-label="Search the shop" value={q} onChange={(e) => setQ(e.target.value)} maxLength={60} />
          </div>
          <div className="chips" role="group" aria-label="Category">
            {CATEGORIES.map(([k, label]) => (
              <button key={k} className={`chip ${cat === k ? 'is-on' : ''}`} onClick={() => setCat(k)}>
                {cat === k && <motion.span layoutId="shop-chip" className="chip-pill" transition={spring} />}
                <span className="chip-label">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {error && !data ? (
          <div className="empty">
            <p>Could not load the shop.</p>
            <button className="btn btn-ghost" onClick={refresh}>
              Try again
            </button>
          </div>
        ) : !data ? (
          <GridSkeleton />
        ) : items.length === 0 ? (
          <div className="empty">
            <p>{data.products.length === 0 ? 'Consoles and accessories are coming soon.' : 'Nothing matches that search.'}</p>
          </div>
        ) : (
          <div className="grid">
            <AnimatePresence mode="popLayout">
              {items.map((p, i) => (
                <ProductCard key={p.id} p={p} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
