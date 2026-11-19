'use client';
import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useLive, useNow } from './hooks';
import { useShop } from './useShop';
import GameCard, { GridSkeleton } from './GameCard';
import Pagination from './Pagination';
import SortBar from './SortBar';
import SearchBox, { matchScore } from './SearchBox';
import { spring, pageSlide as slide } from './motion';

const PLATFORMS = ['All', 'PS5', 'PS4', 'Xbox Series X|S', 'Xbox One', 'Nintendo Switch'];
const PAGE_SIZE = 12;
const SORTS = [
  ['new', 'Featured'],
  ['low', 'Price: low to high'],
  ['high', 'Price: high to low'],
  ['deal', 'Biggest discount'],
  ['az', 'Title A to Z'],
];
const price = (g) => (g.salePrice > 0 ? g.buyFinal : g.rentFinal);
const discount = (g) => Math.max(g.buyPercent, g.rentPercent);
const inStock = (g) => (g.salePrice > 0 && g.stockSale > 0) || (g.rentPerDay > 0 && g.stockRent > 0);

export default function Catalog() {
  const { data, error, refresh } = useLive(() => api('/api/games'));
  const now = useNow(data?.serverNow);
  const { act, sheet } = useShop(data, now);
  const [platform, setPlatform] = useState('All');
  const [q, setQ] = useState(''); // applied by the Search button
  const [draft, setDraft] = useState(''); // what is typed
  const [sort, setSort] = useState('new');
  const [deals, setDeals] = useState(false);
  const [stock, setStock] = useState(false);
  const [[page, dir], setPage] = useState([1, 0]);
  const top = useRef(null);

  const suggest = useMemo(
    () => (data?.games || []).map((g) => ({ id: g.id, title: g.title, sub: `${g.platform}${g.genre ? `, ${g.genre}` : ''}`, img: g.imageUrl, hay: `${g.genre} ${g.platform}`.toLowerCase() })),
    [data]
  );

  const games = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = (data?.games || []).filter(
      (g) =>
        (platform === 'All' || g.platform === platform) &&
        (!term || matchScore(g.title, `${g.genre} ${g.platform}`, term) < 9) &&
        (!deals || discount(g) > 0) &&
        (!stock || inStock(g))
    );
    const by = { low: (a, b) => price(a) - price(b), high: (a, b) => price(b) - price(a), deal: (a, b) => discount(b) - discount(a), az: (a, b) => a.title.localeCompare(b.title) }[sort];
    return by ? [...list].sort(by) : list;
  }, [data, platform, q, sort, deals, stock]);

  const pages = Math.max(1, Math.ceil(games.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = games.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function go(n) {
    setPage([n, n > current ? 1 : -1]);
    const el = top.current;
    if (el && el.getBoundingClientRect().top < 80) {
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  }
  const resetPage = () => setPage([1, 0]);

  return (
    <>
      <section className="section games-page" ref={top}>
        <div className="container">
          <h1 className="section-title">All games</h1>
          <div className="toolbar">
            <SearchBox
              items={suggest}
              value={draft}
              label="Search games"
              placeholder="Search by title or genre"
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
            <div className="chips" role="group" aria-label="Platform">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  className={`chip ${platform === p ? 'is-on' : ''}`}
                  onClick={() => {
                    setPlatform(p);
                    resetPage();
                  }}
                >
                  {platform === p && <motion.span layoutId="chip-pill" className="chip-pill" transition={spring} />}
                  <span className="chip-label">{p}</span>
                </button>
              ))}
            </div>
            <SortBar sort={sort} onSort={(v) => { setSort(v); resetPage(); }} options={SORTS} deals={deals} onDeals={(v) => { setDeals(v); resetPage(); }} stock={stock} onStock={(v) => { setStock(v); resetPage(); }} />
          </div>

          {error && !data ? (
            <div className="empty">
              <p>Could not load games.</p>
              <button className="btn btn-ghost" onClick={refresh}>
                Try again
              </button>
            </div>
          ) : !data ? (
            <GridSkeleton n={PAGE_SIZE} />
          ) : games.length === 0 ? (
            <div className="empty">
              <p>{data.games.length === 0 ? 'No games are listed yet. Check back soon.' : 'No games match that search.'}</p>
              {data.games.length > 0 && (
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setQ('');
                    setDraft('');
                    setPlatform('All');
                    setDeals(false);
                    setStock(false);
                    resetPage();
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="muted result-count" aria-live="polite">
                {q ? `Results for “${q}”: ` : ''}Showing {(current - 1) * PAGE_SIZE + 1} to {(current - 1) * PAGE_SIZE + shown.length} of {games.length}
              </p>
              <AnimatePresence mode="wait" custom={dir} initial={false}>
                <motion.div
                  key={current}
                  className="grid"
                  custom={dir}
                  variants={slide}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                >
                  {shown.map((g, i) => (
                    <GameCard key={g.id} game={g} index={i} onAct={act} />
                  ))}
                </motion.div>
              </AnimatePresence>
              <Pagination page={current} pages={pages} onChange={go} />
            </>
          )}
        </div>
      </section>
      {sheet}
    </>
  );
}
