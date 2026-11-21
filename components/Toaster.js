'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Heart, Info, WarningCircle, X } from '@phosphor-icons/react';

const DURATION = 4500;
const ICONS = { ok: CheckCircle, error: WarningCircle, saved: Heart, info: Info };

let push = null;
// toast('Done'), toast('Oops', 'error'), toast('Saved', 'saved', { action: { label: 'View', href: '/saved' } })
export function toast(message, type = 'ok', opts = {}) {
  push?.(message, type, opts);
}

function Toast({ t, onClose }) {
  const Icon = ICONS[t.type] || CheckCircle;
  return (
    <motion.div
      layout
      className={`toast toast-${t.type}`}
      role={t.type === 'error' ? 'alert' : 'status'}
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={(_, i) => (Math.abs(i.offset.x) > 90 || Math.abs(i.velocity.x) > 500) && onClose()}
    >
      <span className="toast-ico" aria-hidden="true">
        <motion.span initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.08 }} style={{ display: 'grid' }}>
          <Icon size={20} weight="fill" />
        </motion.span>
      </span>
      <p className="toast-msg">{t.message}</p>
      {t.action && (
        <Link href={t.action.href} className="toast-action" onClick={onClose}>
          {t.action.label}
        </Link>
      )}
      <button type="button" className="toast-x" aria-label="Dismiss" onClick={onClose}>
        <X size={14} weight="bold" />
      </button>
      <span className="toast-bar" aria-hidden="true" style={{ animationDuration: `${DURATION}ms` }} onAnimationEnd={onClose} />
    </motion.div>
  );
}

export default function Toaster() {
  const [items, setItems] = useState([]);
  const close = useCallback((id) => setItems((l) => l.filter((t) => t.id !== id)), []);
  useEffect(() => {
    push = (message, type, opts) => {
      const id = Math.random().toString(36).slice(2);
      setItems((l) => [...l.filter((t) => t.message !== message), { id, message, type, action: opts?.action }].slice(-3));
    };
    return () => {
      push = null;
    };
  }, []);
  return (
    <div className="toaster" aria-live="polite">
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <Toast key={t.id} t={t} onClose={() => close(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}
