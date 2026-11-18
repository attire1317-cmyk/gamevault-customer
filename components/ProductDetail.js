'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CaretRight, Minus, Package, Plus, ShieldCheck, Tag, Truck } from '@phosphor-icons/react';
import { api, errText } from '@/lib/api';
import { money, untilEnd } from '@/lib/format';
import { useLive, useNow, useUser } from './hooks';
import { categoryLabel } from './ProductCatalog';
import { toast } from './Toaster';
import { WishButton } from './wish';
import { addToCart } from './cartStore';
import { Stagger, Item, spring } from './motion';

export default function ProductDetail({ id }) {
  const router = useRouter();
  const user = useUser();
  const { data, error, refresh } = useLive(() => api('/api/products'));
  const now = useNow(data?.serverNow);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  if (!data) {
    return (
      <main className="container page">
        {error ? (
          <div className="empty">
            <p>Could not load this item.</p>
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

  const p = data.products.find((x) => x.id === id);
  if (!p) {
    return (
      <main className="container page">
        <div className="empty">
          <p>This item is no longer listed.</p>
          <Link href="/shop" className="btn btn-primary">
            Back to the shop
          </Link>
        </div>
      </main>
    );
  }

  const out = p.stock < 1;
  const max = Math.max(1, Math.min(5, p.stock));
  const q = Math.min(qty, max);
  const related = data.products.filter((x) => x.id !== p.id && x.category === p.category).slice(0, 4);

  async function submit() {
    if (user === null) return router.push(`/login?next=${encodeURIComponent(`/shop/${p.id}`)}`);
    setBusy(true);
    setMsg('');
    try {
      await api('/api/product-orders', { method: 'POST', body: { productId: p.id, qty: q } });
      toast('Order placed. The shop will confirm it shortly.');
      router.push('/account');
    } catch (e) {
      setMsg(errText(e));
      setBusy(false);
    }
  }

  return (
    <main className="container page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <CaretRight size={12} weight="bold" />
        <Link href="/shop">Shop</Link>
        <CaretRight size={12} weight="bold" />
        <span aria-current="page">{p.name}</span>
      </nav>

      <div className="pd">
        <motion.div className="pd-media" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...spring, delay: 0.05 }}>
          <img src={p.imageUrl} alt={p.name} width="800" height="1000" referrerPolicy="no-referrer" fetchPriority="high" />
          {p.percent > 0 && (
            <span className="badge badge-deal">
              <Tag size={14} weight="fill" /> {p.percent}% off
            </span>
          )}
        </motion.div>

        <Stagger className="pd-info">
          <Item className="pd-tags">
            <span className="tag">{categoryLabel(p.category)}</span>
            {p.brand && <span className="tag">{p.brand}</span>}
          </Item>
          <Item as="h1" className="pd-title">
            {p.name}
          </Item>
          <Item className="pd-price">
            {p.percent > 0 && <s className="mono">{money(p.price)}</s>}
            <strong className="mono">{money(p.finalPrice)}</strong>
            {p.percent > 0 && p.discountEndsAt && <span className="offer-note">{untilEnd(p.discountEndsAt, now)}</span>}
          </Item>

          <Item className="pd-buy">
            <div className={`stockline ${out ? 'is-out' : p.stock <= 2 ? 'is-low' : 'is-ok'}`}>
              <span className="dot" aria-hidden="true" /> {out ? 'Out of stock' : p.stock <= 2 ? `Only ${p.stock} left` : 'In stock'}
            </div>
            <div className="field">
              <label htmlFor="pq">Quantity</label>
              <div className="stepper">
                <button type="button" className="icon-btn" onClick={() => setQty(Math.max(1, q - 1))} aria-label="Decrease" disabled={out}>
                  <Minus size={18} weight="bold" />
                </button>
                <input
                  id="pq"
                  inputMode="numeric"
                  value={q}
                  disabled={out}
                  onChange={(e) => {
                    const v = parseInt(e.target.value.replace(/\D/g, ''), 10);
                    setQty(Number.isNaN(v) ? 1 : Math.min(max, Math.max(1, v)));
                  }}
                />
                <button type="button" className="icon-btn" onClick={() => setQty(Math.min(max, q + 1))} aria-label="Increase" disabled={out}>
                  <Plus size={18} weight="bold" />
                </button>
              </div>
            </div>
            <dl className="summary">
              <div>
                <dt>Each</dt>
                <dd>{money(p.finalPrice)}</dd>
              </div>
              <div className="summary-total">
                <dt>Total</dt>
                <dd className="mono">{money(p.finalPrice * q)}</dd>
              </div>
            </dl>
            {msg && (
              <p className="form-error" role="alert">
                {msg}
              </p>
            )}
            <div className="buy-actions">
              <button className="btn btn-primary btn-lg" onClick={() => addToCart(p.id, q)} disabled={out}>
                {out ? 'Out of stock' : 'Add to cart'}
              </button>
              <button className="btn btn-ghost btn-lg" onClick={submit} disabled={busy || out}>
                {busy ? 'Working...' : 'Buy now'}
              </button>
            </div>
          </Item>

          <Item className="pd-save">
            <WishButton kind="product" id={p.id} labelled soldOut={out} />
            {out && <span className="muted">Save it and we will tell you when it is back.</span>}
          </Item>

          <Item className="pd-trust">
            <div>
              <ShieldCheck size={22} weight="duotone" />
              <span>Every order is confirmed by the shop</span>
            </div>
            <div>
              <Package size={22} weight="duotone" />
              <span>Stock updates the moment someone buys</span>
            </div>
            <div>
              <Truck size={22} weight="duotone" />
              <span>Track your order in My rentals</span>
            </div>
          </Item>
        </Stagger>
      </div>

      <section className="pd-about">
        <div>
          <h2>About this item</h2>
          <p className="muted">{p.description || 'No description has been added yet.'}</p>
        </div>
        <dl className="specs">
          <div>
            <dt>Category</dt>
            <dd>{categoryLabel(p.category)}</dd>
          </div>
          <div>
            <dt>Brand</dt>
            <dd>{p.brand || 'Not set'}</dd>
          </div>
          <div>
            <dt>Price</dt>
            <dd className="mono">{money(p.finalPrice)}</dd>
          </div>
          <div>
            <dt>Availability</dt>
            <dd>{out ? 'Out of stock' : `${p.stock} in stock`}</dd>
          </div>
        </dl>
      </section>

      {related.length > 0 && (
        <section className="block">
          <h2>More {categoryLabel(p.category).toLowerCase()}s</h2>
          <div className="grid">
            {related.map((x) => (
              <Link key={x.id} href={`/shop/${x.id}`} className="card-game mini">
                <div className="card-media">
                  <img src={x.imageUrl} alt="" width="640" height="800" loading="lazy" referrerPolicy="no-referrer" />
                </div>
                <div className="card-body">
                  <h3>{x.name}</h3>
                  <strong className="mono">{money(x.finalPrice)}</strong>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
