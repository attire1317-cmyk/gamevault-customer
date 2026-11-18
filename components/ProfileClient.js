'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Envelope, PencilSimple, Phone, Plus, Trash, User } from '@phosphor-icons/react';
import { api, errText } from '@/lib/api';
import { useLive } from './hooks';
import Sheet from './Sheet';
import { toast } from './Toaster';
import { AddressCard, AddressForm } from './AddressStep';
import { Stagger, Item, spring } from './motion';

const ease = [0.16, 1, 0.3, 1];

export default function ProfileClient() {
  const { data, error, refresh } = useLive(() => api('/api/profile'));
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [sheet, setSheet] = useState(null); // { a? } add when no a
  const [confirm, setConfirm] = useState(null);

  if (!data) {
    return (
      <main className="container page">
        {error ? (
          <div className="empty">
            <p>Could not load your profile.</p>
            <button className="btn btn-ghost" onClick={refresh}>
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="skeleton" style={{ height: 40, width: 220, marginBottom: 24 }} />
            <div className="skeleton" style={{ height: 180 }} />
          </>
        )}
      </main>
    );
  }

  const { user, addresses } = data;
  const canAdd = addresses.length < 2;

  function startEdit() {
    setForm({ name: user.name, phone: user.phone });
    setFormError('');
    setEditing(true);
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await api('/api/profile', { method: 'PATCH', body: { name: form.name, phone: form.phone } });
      await refresh();
      setEditing(false);
      toast('Profile updated.');
    } catch (err) {
      setFormError(errText(err));
    } finally {
      setSaving(false);
    }
  }

  async function saveAddress(values) {
    const { makeDefault, ...rest } = values;
    const body = { ...rest, ...(makeDefault ? { makeDefault: true } : {}) };
    if (sheet?.a) await api(`/api/addresses/${sheet.a.id}`, { method: 'PATCH', body });
    else await api('/api/addresses', { method: 'POST', body });
    await refresh();
    toast(sheet?.a ? 'Address updated.' : 'Address saved.');
    setSheet(null);
  }

  async function makeDefault(a) {
    try {
      await api(`/api/addresses/${a.id}`, { method: 'PATCH', body: { makeDefault: true } });
      await refresh();
      toast(`${a.label} is now your default address.`);
    } catch (e) {
      toast(errText(e), 'error');
    }
  }

  async function remove(a) {
    if (confirm !== a.id) {
      setConfirm(a.id);
      setTimeout(() => setConfirm((c) => (c === a.id ? null : c)), 3500);
      return;
    }
    try {
      await api(`/api/addresses/${a.id}`, { method: 'DELETE' });
      setConfirm(null);
      await refresh();
      toast('Address removed.');
    } catch (e) {
      toast(errText(e), 'error');
    }
  }

  return (
    <main className="container page">
      <Stagger>
        <Item as="h1" className="page-title">
          Your profile
        </Item>

        <Item as="section" className="profile-card" aria-label="Your details">
          <div className="profile-top">
            <span className="avatar avatar-lg" aria-hidden="true">
              {(user.name || '?').trim().charAt(0).toUpperCase()}
            </span>
            <div className="profile-who">
              <h2>{user.name}</h2>
              <span className="muted">Customer</span>
            </div>
            {!editing && (
              <button className="btn btn-ghost btn-sm" onClick={startEdit}>
                <PencilSimple size={15} weight="bold" /> Edit
              </button>
            )}
          </div>

          <dl className="profile-facts">
            <div>
              <dt>
                <User size={16} weight="bold" /> Name
              </dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>
                <Phone size={16} weight="bold" /> Phone
              </dt>
              <dd>{user.phone || <span className="muted">Not added</span>}</dd>
            </div>
            <div>
              <dt>
                <Envelope size={16} weight="bold" /> Email
              </dt>
              <dd className="wrap">{user.email}</dd>
            </div>
          </dl>

          <AnimatePresence initial={false}>
            {editing && (
              <motion.form key="edit" className="profile-edit" onSubmit={saveProfile} noValidate initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }}>
                <div className="profile-edit-grid">
                  <div className="field">
                    <label htmlFor="pf-name">Name</label>
                    <input id="pf-name" autoComplete="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} maxLength={60} />
                  </div>
                  <div className="field">
                    <label htmlFor="pf-phone">Phone</label>
                    <input id="pf-phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} maxLength={20} />
                  </div>
                </div>
                {formError && (
                  <p className="form-error" role="alert">
                    {formError}
                  </p>
                )}
                <div className="addr-form-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)} disabled={saving}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </Item>

        <Item as="section" className="profile-addrs" aria-label="Saved addresses">
          <div className="section-head">
            <h2 className="section-title">Saved addresses</h2>
            <span className="muted">{addresses.length} of 2 saved</span>
          </div>
          <div className="addr-grid">
            <AnimatePresence initial={false} mode="popLayout">
              {addresses.map((a) => (
                <motion.div key={a.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={spring}>
                  <AddressCard
                    a={a}
                    footer={
                      <div className="addr-actions">
                        {!a.isDefault && (
                          <button className="btn btn-ghost btn-sm" onClick={() => makeDefault(a)}>
                            Make default
                          </button>
                        )}
                        <button className="btn btn-ghost btn-sm" onClick={() => setSheet({ a })}>
                          <PencilSimple size={14} weight="bold" /> Edit
                        </button>
                        <button className={`btn btn-ghost btn-sm ${confirm === a.id ? 'is-danger' : ''}`} onClick={() => remove(a)}>
                          <Trash size={14} weight="bold" /> {confirm === a.id ? 'Tap again to delete' : 'Delete'}
                        </button>
                      </div>
                    }
                  />
                </motion.div>
              ))}
              {canAdd && (
                <motion.button key="add" layout type="button" className="addr-tile" onClick={() => setSheet({})} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} whileTap={{ scale: 0.98 }} transition={spring}>
                  <Plus size={22} weight="bold" />
                  <strong>Add address</strong>
                  <span className="muted">{addresses.length === 0 ? 'Needed before your first order' : 'One more spot to deliver to'}</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </Item>
      </Stagger>

      {sheet && (
        <Sheet title={sheet.a ? 'Edit address' : 'Add address'} onClose={() => setSheet(null)}>
          <AddressForm
            initial={sheet.a}
            defaultName={user.name}
            defaultPhone={user.phone}
            showDefault={addresses.length > 0 && !sheet.a?.isDefault}
            onSubmit={saveAddress}
            onCancel={() => setSheet(null)}
            submitLabel={sheet.a ? 'Save changes' : 'Save address'}
          />
        </Sheet>
      )}
    </main>
  );
}
