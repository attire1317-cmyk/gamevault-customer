'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

let push = null;
export function toast(message, type = 'ok') {
  push?.(message, type);
}

export default function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    push = (message, type) => {
      const id = Math.random().toString(36).slice(2);
      setItems((l) => [...l, { id, message, type }]);
      setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 4200);
    };
    return () => {
      push = null;
    };
  }, []);
  return (
    <div className="toaster" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout
            className={`toast toast-${t.type}`}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
