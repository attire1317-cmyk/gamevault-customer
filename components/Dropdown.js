'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CaretDown, Check, SortAscending } from '@phosphor-icons/react';
import { spring } from './motion';

// Custom listbox that replaces the browser's plain <select>.
// Keyboard: Arrow keys / Home / End move, Enter or Space picks, Escape closes.
export default function Dropdown({ label, value, onChange, options, icon: Icon = SortAscending }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);

  const selected = Math.max(0, options.findIndex(([v]) => v === value));
  const current = options[selected];

  const openMenu = (i = selected) => {
    setActive(i);
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  };
  const choose = (i) => {
    onChange(options[i][0]);
    close();
  };

  // Move focus into the list when it opens; close on a click or tap anywhere else.
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => listRef.current?.focus({ preventScroll: true }));
    const away = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('pointerdown', away);
    };
  }, [open]);

  function onButtonKey(e) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      openMenu(e.key === 'ArrowUp' ? options.length - 1 : selected);
    }
  }

  function onListKey(e) {
    const last = options.length - 1;
    const go = (i) => {
      e.preventDefault();
      setActive(i);
    };
    if (e.key === 'ArrowDown') go(active >= last ? 0 : active + 1);
    else if (e.key === 'ArrowUp') go(active <= 0 ? last : active - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(last);
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') close(false);
  }

  return (
    <div className="dd" ref={rootRef}>
      <button
        ref={btnRef}
        type="button"
        className={`dd-btn ${open ? 'is-open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={`${label}: ${current[1]}`}
        onClick={() => (open ? close(false) : openMenu())}
        onKeyDown={onButtonKey}
      >
        <Icon size={18} weight="bold" className="dd-icon" aria-hidden="true" />
        <span className="dd-label">{label}</span>
        <strong className="dd-value">{current[1]}</strong>
        <motion.span className="dd-caret" animate={{ rotate: open ? 180 : 0 }} transition={spring} aria-hidden="true">
          <CaretDown size={14} weight="bold" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            layoutRoot
            className="dd-menu"
            style={{ transformOrigin: 'top left' }}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 520, damping: 34 }}
          >
            <ul
              ref={listRef}
              id={`${id}-list`}
              className="dd-list"
              role="listbox"
              tabIndex={-1}
              aria-label={label}
              aria-activedescendant={`${id}-${active}`}
              onKeyDown={onListKey}
            >
              {options.map(([v, text], i) => {
                const on = i === selected;
                return (
                  <motion.li
                    key={v}
                    id={`${id}-${i}`}
                    role="option"
                    aria-selected={on}
                    className={`dd-opt ${on ? 'is-selected' : ''}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.18, delay: 0.025 * i + 0.03, ease: [0.16, 1, 0.3, 1] }}
                    onPointerMove={() => active !== i && setActive(i)}
                    onClick={() => choose(i)}
                  >
                    {active === i && <motion.span layoutId={`${id}-hl`} className="dd-hl" transition={{ type: 'spring', stiffness: 520, damping: 40 }} />}
                    <span className="dd-text">{text}</span>
                    {on && (
                      <motion.span className="dd-check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring}>
                        <Check size={16} weight="bold" />
                      </motion.span>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
