'use client';
import { api } from '@/lib/api';
import { money, fmtDate, remaining } from '@/lib/format';
import { useLive, useNow } from './hooks';
import { Stagger, Item } from './motion';
import Link from 'next/link';
import { useWish, WishButton } from './wish';

function RentalCard({ r, now }) {
  const active = r.status === 'active';
  const t = active ? remaining(r.dueAt, r.startedAt, now) : null;
  return (
    <article className={`rental ${active ? `is-${t.state}` : 'is-done'}`}>
      <img src={r.imageUrl} alt="" width="84" height="105" loading="lazy" referrerPolicy="no-referrer" />
      <div className="rental-main">
        <h3>{r.title}</h3>
        <p className="muted">
          {r.platform}, {r.days} {r.days === 1 ? 'day' : 'days'}, {money(r.total)}
        </p>
        {active ? (
          <>
            <div className="meter" aria-hidden="true">
              <span style={{ transform: `scaleX(${t.elapsed})` }} />
            </div>
            <p className="rental-due">
              Due {fmtDate(r.dueAt)}. <span>{t.detail}</span>
            </p>
          </>
        ) : (
          <p className="rental-due">Returned {fmtDate(r.returnedAt)}</p>
        )}
      </div>
      {active ? (
        <div className="countdown" aria-label={t.overdue ? 'Overdue' : `${t.daysLeft} days left`}>
          <strong className="mono">{t.overdue ? '0' : t.daysLeft}</strong>
          <span>{t.overdue ? 'overdue' : t.daysLeft === 1 ? 'day left' : 'days left'}</span>
        </div>
      ) : (
        <span className="badge">Returned</span>
      )}
    </article>
  );
}

export default function AccountClient({ name }) {
  const rentals = useLive(() => api('/api/rentals'));
  const orders = useLive(() => api('/api/orders'));
  const gear = useLive(() => api('/api/product-orders'));
  const wish = useWish();
  const gamesData = useLive(() => api('/api/games'));
  const itemsData = useLive(() => api('/api/products'));
  const savedGames = (gamesData.data?.games || []).filter((g) => wish.games.includes(g.id));
  const savedItems = (itemsData.data?.products || []).filter((p) => wish.products.includes(p.id));
  const now = useNow(rentals.data?.serverNow);

  const active = rentals.data?.rentals.filter((r) => r.status === 'active') || [];
  const past = rentals.data?.rentals.filter((r) => r.status !== 'active') || [];

  return (
    <main className="container page">
      <h1 className="page-title">Hi {name.split(' ')[0]}</h1>

      <section className="block">
        <h2>Rented now</h2>
        {!rentals.data ? (
          <div className="rental skeleton" aria-hidden="true" />
        ) : active.length === 0 ? (
          <div className="empty">
            <p>Nothing rented at the moment.</p>
            <a className="btn btn-primary" href="/games">
              Find a game
            </a>
          </div>
        ) : (
          <Stagger className="stack">
            {active.map((r) => (
              <Item key={r.id}><RentalCard r={r} now={now} /></Item>
            ))}
          </Stagger>
        )}
      </section>

      {past.length > 0 && (
        <section className="block">
          <h2>Past rentals</h2>
          <Stagger className="stack">
            {past.map((r) => (
              <Item key={r.id}><RentalCard r={r} now={now} /></Item>
            ))}
          </Stagger>
        </section>
      )}

      <section className="block">
        <h2>Orders</h2>
        {!orders.data ? (
          <div className="rental skeleton" aria-hidden="true" />
        ) : orders.data.orders.length === 0 ? (
          <div className="empty">
            <p>No purchases yet.</p>
          </div>
        ) : (
          <Stagger className="stack">
            {orders.data.orders.map((o) => (
              <Item as="article" key={o.id} className="rental is-done">
                <img src={o.imageUrl} alt="" width="84" height="105" loading="lazy" referrerPolicy="no-referrer" />
                <div className="rental-main">
                  <h3>{o.title}</h3>
                  <p className="muted">
                    {o.qty} x {money(o.unitPrice)}, {fmtDate(o.createdAt)}
                  </p>
                  <p className="rental-due mono">{money(o.total)}</p>
                </div>
                <span className={`badge badge-${o.status}`}>{o.status}</span>
              </Item>
            ))}
          </Stagger>
        )}
      </section>

      {savedGames.length + savedItems.length > 0 && (
        <section className="block">
          <h2>Saved for later</h2>
          <p className="muted saved-note">We will notify you here when a saved item is back in stock.</p>
          <div className="grid saved-grid">
            {savedGames.map((g) => (
              <div key={`g${g.id}`} className="card-game mini">
                <Link href={`/games/${g.id}`} className="card-media card-media-link" aria-label={g.title}>
                  <img src={g.imageUrl} alt="" width="640" height="800" loading="lazy" referrerPolicy="no-referrer" />
                </Link>
                <WishButton kind="game" id={g.id} />
                <div className="card-body">
                  <h3>{g.title}</h3>
                  <span className="muted">{g.stockRent > 0 || g.stockSale > 0 ? 'Available' : 'Out of stock'}</span>
                </div>
              </div>
            ))}
            {savedItems.map((p) => (
              <div key={`p${p.id}`} className="card-game mini">
                <Link href={`/shop/${p.id}`} className="card-media card-media-link" aria-label={p.name}>
                  <img src={p.imageUrl} alt="" width="640" height="800" loading="lazy" referrerPolicy="no-referrer" />
                </Link>
                <WishButton kind="product" id={p.id} />
                <div className="card-body">
                  <h3>{p.name}</h3>
                  <span className="muted">{p.stock > 0 ? 'Available' : 'Out of stock'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {gear.data?.orders.length > 0 && (
        <section className="block">
          <h2>Consoles and accessories</h2>
          <Stagger className="stack">
            {gear.data.orders.map((o) => (
              <Item as="article" key={o.id} className="rental is-done">
                <img src={o.imageUrl} alt="" width="84" height="105" loading="lazy" referrerPolicy="no-referrer" />
                <div className="rental-main">
                  <h3>{o.name}</h3>
                  <p className="muted">
                    {o.qty} x {money(o.unitPrice)}, {fmtDate(o.createdAt)}
                  </p>
                  <p className="rental-due mono">{money(o.total)}</p>
                </div>
                <span className={`badge badge-${o.status}`}>{o.status}</span>
              </Item>
            ))}
          </Stagger>
        </section>
      )}
    </main>
  );
}
