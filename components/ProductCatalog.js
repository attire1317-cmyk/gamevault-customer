'use client';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { useLive } from './hooks';
import { GridSkeleton } from './GameCard';
import Pagination from './Pagination';
import SortBar from './SortBar';
import SearchBox, { matchScore } from './SearchBox';
import { WishButton } from './wish';
import { addToCart } from './cartStore';
import { spring, pageSlide } from './motion';

const PAGE_SIZE = 12;
const SORTS = [
  ['new', 'Newest'],
  ['low', 'Price: low to high'],
  ['high', 'Price: high to low'],
  ['deal', 'Biggest discount'],
  ['az', 'Name A to Z'],
];

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
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
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
      <WishButton kind="product" id={p.id} soldOut={out} />
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
        <div className="card-actions">
          <button className="btn btn-primary" disabled={out} onClick={() => addToCart(p.id)}>
            {out ? 'Sold out' : 'Add to cart'}
          </button>
          <Link href={`/shop/${p.id}`} className="btn btn-ghost">
            Details
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
  const [draft, setDraft] = useState('');
  const [sort, setSort] = useState('new');
  const [deals, setDeals] = useState(false);
  const [stock, setStock] = useState(false);
  const [[page, dir], setPage] = useState([1, 0]);
  const top = useRef(null);

  const suggest = useMemo(
    () => (data?.products || []).map((p) => ({ id: p.id, title: p.name, sub: `${categoryLabel(p.category)}${p.brand ? `, ${p.brand}` : ''}`, img: p.imageUrl, hay: `${p.brand} ${p.category}`.toLowerCase() })),
    [data]
  );

  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = (data?.products || []).filter(
      (p) => (cat === 'all' || p.category === cat) && (!term || matchScore(p.name, `${p.brand} ${p.category}`, term) < 9) && (!deals || p.percent > 0) && (!stock || p.stock > 0)
    );
    const by = { low: (a, b) => a.finalPrice - b.finalPrice, high: (a, b) => b.finalPrice - a.finalPrice, deal: (a, b) => b.percent - a.percent, az: (a, b) => a.name.localeCompare(b.name) }[sort];
    return by ? [...list].sort(by) : list;
  }, [data, cat, q, sort, deals, stock]);

  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = items.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const resetPage = () => setPage([1, 0]);

  function go(n) {
    setPage([n, n > current ? 1 : -1]);
    const el = top.current;
    if (el && el.getBoundingClientRect().top < 80) {
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  }

  return (
    <section className="section games-page" ref={top}>
      <div className="container">
        <h1 className="section-title">Consoles and accessories</h1>
        <div className="toolbar">
          <SearchBox
            items={suggest}
            value={draft}
            label="Search the shop"
            placeholder="Search consoles and accessories"
            onChange={(v) => {
              setDraft(v);
              if (!v.trim()) {
                setQ('');
                resetPage();
              }
            }}
            onSubmit={(t) => {
              setQ(t);
              resetPage();
            }}
          />
          <div className="chips" role="group" aria-label="Category">
            {CATEGORIES.map(([k, label]) => (
              <button key={k} className={`chip ${cat === k ? 'is-on' : ''}`} onClick={() => {
                  setCat(k);
                  resetPage();
                }}>
                {cat === k && <motion.span layoutId="shop-chip" className="chip-pill" transition={spring} />}
                <span className="chip-label">{label}</span>
              </button>
            ))}
          </div>
          <SortBar sort={sort} onSort={(v) => { setSort(v); resetPage(); }} options={SORTS} deals={deals} onDeals={(v) => { setDeals(v); resetPage(); }} stock={stock} onStock={(v) => { setStock(v); resetPage(); }} />
        </div>

        {error && !data ? (
          <div className="empty">
            <p>Could not load the shop.</p>
            <button className="btn btn-ghost" onClick={refresh}>
              Try again
            </button>
          </div>
        ) : !data ? (
          <GridSkeleton n={PAGE_SIZE} />
        ) : items.length === 0 ? (
          <div className="empty">
            <p>{data.products.length === 0 ? 'Consoles and accessories are coming soon.' : 'Nothing matches that search.'}</p>
          </div>
        ) : (
          <>
            <p className="muted result-count" aria-live="polite">
              {q ? `Results for “${q}”: ` : ''}Showing {(current - 1) * PAGE_SIZE + 1} to {(current - 1) * PAGE_SIZE + shown.length} of {items.length}
            </p>
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.div key={`${current}-${cat}`} className="grid" custom={dir} variants={pageSlide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}>
                {shown.map((p, i) => (
                  <ProductCard key={p.id} p={p} index={i} />
                ))}
              </motion.div>
            </AnimatePresence>
            <Pagination page={current} pages={pages} onChange={go} />
          </>
        )}
      </div>
    </section>
  );
}
