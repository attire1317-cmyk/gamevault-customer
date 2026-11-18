'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, ShoppingBag, Trash } from '@phosphor-icons/react';
import { api, errText } from '@/lib/api';
import { money } from '@/lib/format';
import { useLive, useUser } from './hooks';
import { clearCart, closeCart, openCart, removeItem, setQty, useCart } from './cartStore';
import Sheet from './Sheet';
import { toast } from './Toaster';
import AddressStep from './AddressStep';
import { spring } from './motion';

export function CartButton() {
  const { items } = useCart();
  const n = items.reduce((s, x) => s + x.qty, 0);
  return (
    <button type="button" className="icon-btn tool-btn" aria-label={`Cart, ${n} ${n === 1 ? 'item' : 'items'}`} onClick={openCart}>
      <ShoppingBag size={20} weight="bold" />
      <AnimatePresence>
        {n > 0 && (
          <motion.span key={n} className="tool-badge" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={spring}>
            {n}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

function CartSheet() {
  const router = useRouter();
  const user = useUser();
  const { items } = useCart();
  const { data } = useLive(() => api('/api/products'));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [addressId, setAddressId] = useState(null);

  const lines = items.map((x) => ({ ...x, p: data?.products.find((p) => p.id === x.id) }));
  const valid = lines.filter((l) => l.p && l.p.stock > 0);
  const total = valid.reduce((s, l) => s + l.p.finalPrice * Math.min(l.qty, l.p.stock), 0);

  async function checkout() {
    if (user === null) {
      closeCart();
      return router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    }
    setBusy(true);
    setError('');
    try {
      await api('/api/product-orders/cart', { method: 'POST', body: { addressId, items: valid.map((l) => ({ productId: l.id, qty: Math.min(l.qty, l.p.stock, 5) })) } });
      clearCart();
      closeCart();
      toast('Order placed. The shop will confirm it shortly.');
      router.push('/account');
    } catch (e) {
      setError(errText(e));
      setBusy(false);
    }
  }

  return (
    <Sheet title="Your cart" onClose={closeCart}>
      {items.length === 0 ? (
        <div className="empty">
          <ShoppingBag size={32} weight="duotone" />
          <p>Your cart is empty.</p>
          <Link href="/shop" className="btn btn-primary" onClick={closeCart}>
            Browse the shop
          </Link>
        </div>
      ) : (
        <>
          <ul className="cart-lines">
            <AnimatePresence initial={false}>
              {lines.map((l) => (
                <motion.li key={l.id} layout className="cart-line" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -24, transition: { duration: 0.18 } }} transition={spring}>
                  <img src={l.p?.imageUrl || undefined} alt="" width="56" height="70" referrerPolicy="no-referrer" />
                  <div className="cart-main">
                    <strong>{l.p?.name ?? (data ? 'No longer available' : 'Loading...')}</strong>
                    {l.p && l.p.stock < 1 ? (
                      <span className="low">Out of stock</span>
                    ) : (
                      l.p && (
                        <span className="mono">
                          {l.p.percent > 0 && <s>{money(l.p.price)}</s>} {money(l.p.finalPrice)}
                        </span>
                      )
                    )}
                    <div className="stepper sm">
                      <button type="button" className="icon-btn" aria-label="Decrease" onClick={() => setQty(l.id, l.qty - 1)} disabled={l.qty <= 1}>
                        <Minus size={14} weight="bold" />
                      </button>
                      <span className="mono" aria-live="polite">
                        {l.qty}
                      </span>
                      <button type="button" className="icon-btn" aria-label="Increase" onClick={() => setQty(l.id, l.qty + 1)} disabled={!l.p || l.qty >= Math.min(5, l.p.stock)}>
                        <Plus size={14} weight="bold" />
                      </button>
                    </div>
                  </div>
                  <button type="button" className="icon-btn" aria-label="Remove" onClick={() => removeItem(l.id)}>
                    <Trash size={16} weight="bold" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <dl className="summary">
            <div className="summary-total">
              <dt>Total</dt>
              <dd className="mono">{money(total)}</dd>
            </div>
          </dl>
          {user && <AddressStep value={addressId} onChange={setAddressId} />}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn-primary btn-lg btn-block" onClick={checkout} disabled={busy || valid.length === 0 || (user && !addressId)}>
            {busy ? 'Placing order...' : user === null ? 'Sign in to order' : 'Place order'}
          </button>
        </>
      )}
    </Sheet>
  );
}

export default function CartDrawer() {
  const { open } = useCart();
  return open ? <CartSheet /> : null;
}
