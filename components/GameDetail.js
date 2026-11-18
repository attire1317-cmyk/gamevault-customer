'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, CaretRight, Fire, Minus, Package, Plus, ShieldCheck, Tag } from '@phosphor-icons/react';
import { api, errText } from '@/lib/api';
import { money, fmtDate, untilEnd } from '@/lib/format';
import { useLive, useNow, useUser } from './hooks';
import GameCard from './GameCard';
import { toast } from './Toaster';
import AddressStep from './AddressStep';
import { WishButton } from './wish';
import { Stagger, Item, spring } from './motion';

const DAY = 86_400_000;

function stockLabel(n) {
  if (n < 1) return ['Out of stock', 'is-out'];
  if (n <= 2) return [`Only ${n} left`, 'is-low'];
  return ['In stock', 'is-ok'];
}

export default function GameDetail({ id }) {
  const router = useRouter();
  const user = useUser();
  const { data, error, refresh } = useLive(() => api('/api/games'));
  const now = useNow(data?.serverNow);
  const [pick, setPick] = useState(null);
  const [days, setDays] = useState(3);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [addressId, setAddressId] = useState(null);

  if (!data) {
    return (
      <main className="container page">
        {error ? (
          <div className="empty">
            <p>Could not load this game.</p>
            <button className="btn btn-ghost" onClick={refresh}>
              Try again
            </button>
          </div>
        ) : (
          <div className="pd">
            <div className="pd-media skeleton" />
            <div className="pd-info">
              <div className="skeleton" style={{ height: 36, width: '70%' }} />
              <div className="skeleton" style={{ height: 160 }} />
            </div>
          </div>
        )}
      </main>
    );
  }

  const game = data.games.find((g) => g.id === id);
  if (!game) {
    return (
      <main className="container page">
        <div className="empty">
          <p>This game is no longer listed.</p>
          <Link href="/games" className="btn btn-primary">
            Browse all games
          </Link>
        </div>
      </main>
    );
  }

  const hasRent = game.rentPerDay > 0;
  const hasBuy = game.salePrice > 0;
  const mode = pick ?? (hasRent ? 'rent' : 'buy');
  const rent = mode === 'rent';
  const stock = rent ? game.stockRent : game.stockSale;
  const unit = rent ? game.rentFinal : game.buyFinal;
  const pct = rent ? game.rentPercent : game.buyPercent;
  const base = rent ? game.rentPerDay : game.salePrice;
  const n = rent ? days : qty;
  const max = rent ? 30 : Math.max(1, Math.min(3, game.stockSale));
  const setN = (v) => (rent ? setDays(v) : setQty(v));
  const dueLabel = fmtDate(new Date(now + n * DAY).toISOString());
  const [stockText, stockCls] = stockLabel(stock);
  const best = Math.max(game.rentPercent, game.buyPercent);
  const dealOffer = (data.offers || []).find((o) => (o.gameId === game.id || o.gameId === null) && (o.appliesTo === 'both' || o.appliesTo === mode));
  const related = data.games.filter((g) => g.id !== game.id && g.platform === game.platform).slice(0, 4);

  async function submit() {
    if (user === null) return router.push(`/login?next=${encodeURIComponent(`/games/${game.id}`)}`);
    if (!addressId) return setMsg('Choose a delivery address.');
    setBusy(true);
    setMsg('');
    try {
      if (rent) await api('/api/rentals', { method: 'POST', body: { gameId: game.id, days, addressId } });
      else await api('/api/orders', { method: 'POST', body: { gameId: game.id, qty, addressId } });
      toast(rent ? `${game.title} is yours until ${dueLabel}.` : 'Order placed. The shop will confirm it shortly.');
      router.push('/account');
    } catch (e) {
      setMsg(errText(e));
      setBusy(false);
    }
  }

  const options = [
    hasRent && ['rent', 'Rent', `${money(game.rentFinal)}/day`, game.rentPercent > 0 && money(game.rentPerDay)],
    hasBuy && ['buy', 'Buy', money(game.buyFinal), game.buyPercent > 0 && money(game.salePrice)],
  ].filter(Boolean);

  return (
    <main className="container page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <CaretRight size={12} weight="bold" />
        <Link href="/games">Games</Link>
        <CaretRight size={12} weight="bold" />
        <span aria-current="page">{game.title}</span>
      </nav>

      <div className="pd">
        <motion.div className="pd-media" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...spring, delay: 0.05 }}>
          <img src={game.imageUrl} alt={`${game.title} cover`} width="800" height="1000" referrerPolicy="no-referrer" fetchPriority="high" />
          {best > 0 && (
            <span className="badge badge-deal">
              <Tag size={14} weight="fill" /> {best}% off
            </span>
          )}
        </motion.div>

        <Stagger className="pd-info">
          <Item className="pd-tags">
            <span className="tag">{game.platform}</span>
            {game.genre && <span className="tag">{game.genre}</span>}
            {game.trending && (
              <span className="tag tag-hot">
                <Fire size={13} weight="fill" /> Trending
              </span>
            )}
          </Item>
          <Item as="h1" className="pd-title">
            {game.title}
          </Item>

          <Item className="pd-options" role="radiogroup" aria-label="Rent or buy">
            {options.map(([key, label, price, was]) => (
              <button key={key} type="button" role="radio" aria-checked={mode === key} className={`opt ${mode === key ? 'is-on' : ''}`} onClick={() => setPick(key)}>
                {mode === key && <motion.span layoutId="pd-opt" className="opt-pill" transition={spring} />}
                <span className="opt-body">
                  <span className="opt-label">{label}</span>
                  <strong className="mono">{price}</strong>
                  {was && <s>{was}</s>}
                </span>
              </button>
            ))}
            {options.length === 0 && <p className="muted">This game is not available right now.</p>}
          </Item>

          {options.length > 0 && (
            <Item className="pd-buy">
              <div className={`stockline ${stockCls}`}>
                <span className="dot" aria-hidden="true" /> {stockText}
                {dealOffer && <span className="offer-note">{dealOffer.percent}% off. {untilEnd(dealOffer.endsAt, now)}</span>}
              </div>

              <div className="field">
                <label htmlFor="pd-n">{rent ? 'Rental days' : 'Quantity'}</label>
                <div className="stepper">
                  <button type="button" className="icon-btn" onClick={() => setN(Math.max(1, n - 1))} aria-label="Decrease">
                    <Minus size={18} weight="bold" />
                  </button>
                  <input
                    id="pd-n"
                    inputMode="numeric"
                    value={n}
                    onChange={(e) => {
                      const v = parseInt(e.target.value.replace(/\D/g, ''), 10);
                      setN(Number.isNaN(v) ? 1 : Math.min(max, Math.max(1, v)));
                    }}
                  />
                  <button type="button" className="icon-btn" onClick={() => setN(Math.min(max, n + 1))} aria-label="Increase">
                    <Plus size={18} weight="bold" />
                  </button>
                </div>
                {rent && (
                  <div className="chips">
                    {[3, 7, 14].map((d) => (
                      <button key={d} type="button" className={`chip ${n === d ? 'is-on' : ''}`} onClick={() => setN(d)}>
                        {n === d && <motion.span layoutId="pd-days" className="chip-pill" transition={spring} />}
                        <span className="chip-label">{d} days</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <dl className="summary">
                <div>
                  <dt>{rent ? 'Per day' : 'Each'}</dt>
                  <dd>
                    {pct > 0 && <s>{money(base)}</s>} {money(unit)}
                  </dd>
                </div>
                {rent && (
                  <div>
                    <dt>Return by</dt>
                    <dd>{dueLabel}</dd>
                  </div>
                )}
                <div className="summary-total">
                  <dt>Total</dt>
                  <dd className="mono">{money(unit * n)}</dd>
                </div>
              </dl>

              {user && <AddressStep value={addressId} onChange={setAddressId} />}

              {msg && (
                <p className="form-error" role="alert">
                  {msg}
                </p>
              )}
              <button className="btn btn-primary btn-lg btn-block" onClick={submit} disabled={busy || stock < 1 || (user && !addressId)}>
                {busy ? 'Working...' : stock < 1 ? (rent ? 'Rented out' : 'Sold out') : rent ? 'Rent this game' : 'Buy this game'}
              </button>
            </Item>
          )}

          <Item className="pd-save">
            <WishButton kind="game" id={game.id} labelled soldOut={stock < 1} />
            {stock < 1 && <span className="muted">Save it and we will tell you when it is back.</span>}
          </Item>

          <Item className="pd-trust">
            <div>
              <CalendarCheck size={22} weight="duotone" />
              <span>Return date counted down in My rentals</span>
            </div>
            <div>
              <ShieldCheck size={22} weight="duotone" />
              <span>Every order is confirmed by the shop</span>
            </div>
            <div>
              <Package size={22} weight="duotone" />
              <span>Stock and prices are always current</span>
            </div>
          </Item>
        </Stagger>
      </div>

      <section className="pd-about">
        <div>
          <h2>About this game</h2>
          <p className="muted">{game.description || 'No description has been added yet.'}</p>
        </div>
        <dl className="specs">
          <div>
            <dt>Platform</dt>
            <dd>{game.platform}</dd>
          </div>
          <div>
            <dt>Genre</dt>
            <dd>{game.genre || 'Not set'}</dd>
          </div>
          {hasRent && (
            <div>
              <dt>Rental</dt>
              <dd className="mono">{money(game.rentFinal)}/day, {game.stockRent} available</dd>
            </div>
          )}
          {hasBuy && (
            <div>
              <dt>Purchase</dt>
              <dd className="mono">{money(game.buyFinal)}, {game.stockSale} in stock</dd>
            </div>
          )}
        </dl>
      </section>

      {related.length > 0 && (
        <section className="block">
          <h2>More for {game.platform}</h2>
          <div className="grid">
            {related.map((g, i) => (
              <GameCard key={g.id} game={g} index={i} onAct={(x) => router.push(`/games/${x.id}`)} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
