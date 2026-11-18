'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus } from '@phosphor-icons/react';
import { api, errText } from '@/lib/api';
import { money, fmtDate } from '@/lib/format';
import Sheet from './Sheet';
import { toast } from './Toaster';
import AddressStep from './AddressStep';

const DAY = 86_400_000;

export default function Checkout({ game, mode, now, onClose }) {
  const router = useRouter();
  const rent = mode === 'rent';
  const [n, setN] = useState(rent ? 3 : 1); // days or quantity
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [addressId, setAddressId] = useState(null);

  const max = rent ? 30 : Math.min(3, game.stockSale);
  const unit = rent ? game.rentFinal : game.buyFinal;
  const pct = rent ? game.rentPercent : game.buyPercent;
  const total = unit * n;
  const dueLabel = fmtDate(new Date(now + n * DAY).toISOString());

  async function submit() {
    setBusy(true);
    setError('');
    try {
      if (rent) await api('/api/rentals', { method: 'POST', body: { gameId: game.id, days: n, addressId } });
      else await api('/api/orders', { method: 'POST', body: { gameId: game.id, qty: n, addressId } });
      toast(rent ? `${game.title} is yours until ${dueLabel}.` : 'Order placed. The shop will confirm it shortly.');
      onClose();
      router.push('/account');
    } catch (e) {
      if (e.status === 401) {
        router.push('/login?next=/');
        return;
      }
      setError(errText(e));
      setBusy(false);
    }
  }

  return (
    <Sheet title={rent ? `Rent ${game.title}` : `Buy ${game.title}`} onClose={onClose}>
      <div className="co-game">
        <img src={game.imageUrl} alt="" width="72" height="90" />
        <div>
          <strong>{game.title}</strong>
          <span className="muted">{game.platform}</span>
        </div>
      </div>

      <AddressStep value={addressId} onChange={setAddressId} />

      <div className="field">
        <label htmlFor="co-n">{rent ? 'How many days?' : 'How many copies?'}</label>
        <div className="stepper">
          <button type="button" className="icon-btn" onClick={() => setN((v) => Math.max(1, v - 1))} aria-label="Decrease">
            <Minus size={18} weight="bold" />
          </button>
          <input
            id="co-n"
            inputMode="numeric"
            value={n}
            onChange={(e) => {
              const v = parseInt(e.target.value.replace(/\D/g, ''), 10);
              setN(Number.isNaN(v) ? 1 : Math.min(max, Math.max(1, v)));
            }}
          />
          <button type="button" className="icon-btn" onClick={() => setN((v) => Math.min(max, v + 1))} aria-label="Increase">
            <Plus size={18} weight="bold" />
          </button>
        </div>
        {rent && (
          <div className="chips">
            {[3, 7, 14].map((d) => (
              <button key={d} type="button" className={`chip ${n === d ? 'is-on' : ''}`} onClick={() => setN(d)}>
                {d} days
              </button>
            ))}
          </div>
        )}
      </div>

      <dl className="summary">
        <div>
          <dt>{rent ? 'Per day' : 'Each'}</dt>
          <dd>
            {pct > 0 && <s>{money(rent ? game.rentPerDay : game.salePrice)}</s>} {money(unit)}
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
          <dd className="mono">{money(total)}</dd>
        </div>
      </dl>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-primary btn-lg btn-block" onClick={submit} disabled={busy || !addressId}>
        {busy ? 'Working...' : rent ? 'Confirm rental' : 'Place order'}
      </button>
    </Sheet>
  );
}
