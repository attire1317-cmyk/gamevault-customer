'use client';
import { useEffect, useId, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowsLeftRight, Briefcase, Check, House, MapPin, Plus } from '@phosphor-icons/react';
import { api, errText } from '@/lib/api';
import { useLive } from './hooks';
import Sheet from './Sheet';
import { spring } from './motion';

const ease = [0.16, 1, 0.3, 1];
const LABELS = [
  ['Home', House],
  ['Work', Briefcase],
  ['Other', MapPin],
];
const iconFor = (l) => (LABELS.find(([n]) => n === l) || LABELS[2])[1];

// One saved address. Pass onClick to make it a pickable radio option.
export function AddressCard({ a, selected = false, onClick, footer }) {
  const Icon = iconFor(a.label);
  const body = (
    <>
      <span className="addr-ico" aria-hidden="true">
        <Icon size={20} weight="duotone" />
      </span>
      <span className="addr-body">
        <span className="addr-top">
          <strong>{a.label}</strong>
          {a.isDefault && <span className="badge">Default</span>}
        </span>
        <span className="addr-name">
          {a.name}, {a.phone}
        </span>
        <span className="muted">{[a.line1, a.line2].filter(Boolean).join(', ')}</span>
        <span className="muted">
          {a.city}, {a.state} {a.pincode}
        </span>
      </span>
      <AnimatePresence>
        {selected && (
          <motion.span className="addr-check" aria-hidden="true" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={spring}>
            <Check size={14} weight="bold" />
          </motion.span>
        )}
      </AnimatePresence>
    </>
  );
  if (onClick) {
    return (
      <button type="button" role="radio" aria-checked={selected} className={`addr-card is-pick ${selected ? 'is-on' : ''}`} onClick={onClick}>
        {body}
      </button>
    );
  }
  return (
    <div className="addr-card-wrap">
      <div className={`addr-card ${selected ? 'is-on' : ''}`}>{body}</div>
      {footer}
    </div>
  );
}

// Add or edit form. onSubmit(values) may throw; the message is shown under the form.
export function AddressForm({ initial, defaultName = '', defaultPhone = '', onSubmit, onCancel, submitLabel = 'Save address', showDefault = false }) {
  const uid = useId();
  const [f, setF] = useState({
    label: initial?.label || 'Home',
    name: initial?.name ?? defaultName,
    phone: initial?.phone ?? defaultPhone,
    line1: initial?.line1 ?? '',
    line2: initial?.line2 ?? '',
    city: initial?.city ?? '',
    state: initial?.state ?? '',
    pincode: initial?.pincode ?? '',
    makeDefault: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSubmit({ ...f, ...(showDefault ? {} : { makeDefault: undefined }) });
    } catch (err) {
      setError(errText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="addr-form" onSubmit={submit} noValidate>
      <div className="field span-2">
        <span className="label">Save as</span>
        <div className="chips" role="radiogroup" aria-label="Address type">
          {LABELS.map(([n, Icon]) => (
            <button key={n} type="button" role="radio" aria-checked={f.label === n} className={`chip ${f.label === n ? 'is-on' : ''}`} onClick={() => setF((x) => ({ ...x, label: n }))}>
              {f.label === n && <motion.span layoutId={`${uid}-label`} className="chip-pill" transition={spring} />}
              <span className="chip-label chip-icon">
                <Icon size={16} weight="bold" /> {n}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label htmlFor={`${uid}-n`}>Receiver name</label>
        <input id={`${uid}-n`} autoComplete="name" value={f.name} onChange={set('name')} maxLength={60} />
      </div>
      <div className="field">
        <label htmlFor={`${uid}-p`}>Phone</label>
        <input id={`${uid}-p`} type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} maxLength={20} />
      </div>
      <div className="field span-2">
        <label htmlFor={`${uid}-1`}>House, street, area</label>
        <input id={`${uid}-1`} autoComplete="address-line1" value={f.line1} onChange={set('line1')} maxLength={120} />
      </div>
      <div className="field span-2">
        <label htmlFor={`${uid}-2`}>Landmark (optional)</label>
        <input id={`${uid}-2`} autoComplete="address-line2" value={f.line2} onChange={set('line2')} maxLength={120} />
      </div>
      <div className="field">
        <label htmlFor={`${uid}-c`}>City</label>
        <input id={`${uid}-c`} autoComplete="address-level2" value={f.city} onChange={set('city')} maxLength={60} />
      </div>
      <div className="field">
        <label htmlFor={`${uid}-s`}>State</label>
        <input id={`${uid}-s`} autoComplete="address-level1" value={f.state} onChange={set('state')} maxLength={60} />
      </div>
      <div className="field">
        <label htmlFor={`${uid}-z`}>Pincode</label>
        <input id={`${uid}-z`} inputMode="numeric" autoComplete="postal-code" value={f.pincode} onChange={(e) => setF((x) => ({ ...x, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} />
      </div>
      {showDefault && (
        <label className="check">
          <input type="checkbox" checked={f.makeDefault} onChange={(e) => setF((x) => ({ ...x, makeDefault: e.target.checked }))} /> Make this my default address
        </label>
      )}
      <AnimatePresence>
        {error && (
          <motion.p className="form-error span-2" role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      <div className="addr-form-actions span-2">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        )}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

// The "Deliver to" block shown before any rent or buy. Picks the default address first;
// "Switch address" opens the saved list; a new customer is asked to add one.
export default function AddressStep({ value, onChange }) {
  const { data, error, refresh } = useLive(() => api('/api/addresses'));
  const [mode, setMode] = useState('view'); // view | switch | add
  const list = data?.addresses;

  useEffect(() => {
    if (!list) return;
    if (!list.some((a) => a.id === value)) onChange(list.find((a) => a.isDefault)?.id ?? list[0]?.id ?? null);
  }, [list, value, onChange]);

  async function create(values) {
    const { address } = await api('/api/addresses', { method: 'POST', body: values });
    await refresh();
    onChange(address.id);
    setMode('view');
  }

  if (!data) {
    return (
      <div className="addr-step">
        {error ? (
          <p className="form-error" role="alert">
            Could not load your addresses.{' '}
            <button type="button" className="link-btn" onClick={refresh}>
              Try again
            </button>
          </p>
        ) : (
          <div className="skeleton" style={{ height: 96 }} />
        )}
      </div>
    );
  }

  const defaults = { defaultName: data.profile?.name, defaultPhone: data.profile?.phone };

  if (list.length === 0) {
    return (
      <div className="addr-step">
        <span className="addr-h">Delivery address</span>
        <p className="muted addr-note">Add where we should deliver this order. You can save up to 2 addresses.</p>
        <AddressForm {...defaults} onSubmit={create} submitLabel="Save and continue" />
      </div>
    );
  }

  const selected = list.find((a) => a.id === value);
  const canAdd = list.length < 2;
  const toggle = () => setMode((m) => (m !== 'view' ? 'view' : list.length > 1 ? 'switch' : 'add'));

  return (
    <div className="addr-step">
      <div className="addr-head">
        <span className="addr-h">Deliver to</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={toggle} aria-expanded={mode !== 'view'}>
          {mode !== 'view' ? (
            'Close'
          ) : list.length > 1 ? (
            <>
              <ArrowsLeftRight size={15} weight="bold" /> Switch address
            </>
          ) : (
            <>
              <Plus size={15} weight="bold" /> Add address
            </>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {selected && (
          <motion.div key={selected.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22, ease }}>
            <AddressCard a={selected} selected />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {mode === 'switch' && (
          <motion.div key="switch" className="addr-panel" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }}>
            <div className="addr-list" role="radiogroup" aria-label="Saved addresses">
              {list.map((a) => (
                <AddressCard
                  key={a.id}
                  a={a}
                  selected={a.id === value}
                  onClick={() => {
                    onChange(a.id);
                    setMode('view');
                  }}
                />
              ))}
              {canAdd && (
                <button type="button" className="addr-add" onClick={() => setMode('add')}>
                  <Plus size={16} weight="bold" /> Add a new address
                </button>
              )}
            </div>
          </motion.div>
        )}
        {mode === 'add' && (
          <motion.div key="add" className="addr-panel" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }}>
            <div className="addr-list">
              <AddressForm {...defaults} onSubmit={create} onCancel={() => setMode('view')} submitLabel="Save and use" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Used where the buy button sits on a page (consoles and accessories): asks for the address in a sheet first.
export function AddressSheet({ title = 'Delivery address', confirmLabel = 'Place order', busy, error, onConfirm, onClose, children }) {
  const [id, setId] = useState(null);
  return (
    <Sheet title={title} onClose={onClose}>
      <AddressStep value={id} onChange={setId} />
      {children}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-primary btn-lg btn-block" disabled={!id || busy} onClick={() => onConfirm(id)}>
        {busy ? 'Working...' : confirmLabel}
      </button>
    </Sheet>
  );
}
