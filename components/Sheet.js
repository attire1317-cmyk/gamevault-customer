'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X } from '@phosphor-icons/react';

// Centred card on desktop, draggable bottom sheet on phones.
// Closing plays the exit animation first, then tells the parent.
export default function Sheet({ title, onClose, children }) {
  const [open, setOpen] = useState(true);
  const panel = useRef(null);
  const controls = useDragControls();
  const [mobile] = useState(() => typeof window !== 'undefined' && matchMedia('(max-width: 767px)').matches);

  useEffect(() => {
    const prev = document.activeElement;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, []);

  const ease = [0.16, 1, 0.3, 1];
  return (
    <AnimatePresence onExitComplete={onClose}>
      {open && (
        <motion.div key="sheet" className="sheet-root" initial={{ opacity: 1 }} exit={{ opacity: 1 }}>
          <motion.div
            className="sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className="sheet"
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={mobile ? { y: '100%' } : { y: 28, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={mobile ? { y: '100%' } : { y: 20, scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.45, ease }}
            drag={mobile ? 'y' : false}
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.08, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 140 || info.velocity.y > 800) setOpen(false);
            }}
          >
            <div className="sheet-handle" onPointerDown={(e) => controls.start(e)} aria-hidden="true">
              <span />
            </div>
            <div className="sheet-head">
              <h2>{title}</h2>
              <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close">
                <X size={20} weight="bold" />
              </button>
            </div>
            <div className="sheet-body">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
