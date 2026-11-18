'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CalendarCheck, CheckCircle, Package, WarningCircle, XCircle } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useLive } from './hooks';
import { spring } from './motion';

const ICON = { due_soon: CalendarCheck, overdue: WarningCircle, order_completed: CheckCircle, order_cancelled: XCircle, back_in_stock: Package };

function ago(iso) {
  const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
}

export default function Notifications() {
  const { data, refresh } = useLive(() => api('/api/notifications'));
  const [open, setOpen] = useState(false);
  const [fresh, setFresh] = useState(new Set());
  const box = useRef(null);
  const unread = data?.unread || 0;

  useEffect(() => {
    if (!open) return;
    const away = (e) => !box.current?.contains(e.target) && setOpen(false);
    const key = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', key);
    };
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setFresh(new Set(data.items.filter((n) => !n.read).map((n) => n.id)));
      try {
        await api('/api/notifications', { method: 'POST', body: { readAll: true } });
        refresh();
      } catch {}
    }
  }

  return (
    <div className="notif" ref={box}>
      <button type="button" className="icon-btn tool-btn" aria-label={unread ? `Notifications, ${unread} new` : 'Notifications'} aria-expanded={open} onClick={toggle}>
        <Bell size={20} weight="bold" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span className="tool-badge" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={spring}>
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="notif-panel" role="region" aria-label="Notifications" initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}>
            <h2>Notifications</h2>
            {!data || data.items.length === 0 ? (
              <p className="muted notif-empty">Nothing yet. Reminders and order updates show up here.</p>
            ) : (
              <ul>
                {data.items.map((n) => {
                  const Icon = ICON[n.kind] || Bell;
                  const body = (
                    <>
                      <span className={`notif-icon k-${n.kind}`}>
                        <Icon size={18} weight="fill" />
                      </span>
                      <span className="notif-text">
                        <strong>{n.title}</strong>
                        <span>{n.body}</span>
                        <small>{ago(n.createdAt)}</small>
                      </span>
                      {fresh.has(n.id) && <span className="notif-dot" aria-label="New" />}
                    </>
                  );
                  return <li key={n.id}>{n.link ? <Link href={n.link} className="notif-item" onClick={() => setOpen(false)}>{body}</Link> : <div className="notif-item">{body}</div>}</li>;
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
