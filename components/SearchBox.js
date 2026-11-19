'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpLeft, MagnifyingGlass, X } from '@phosphor-icons/react';

const ease = [0.16, 1, 0.3, 1];

// Smart matching: prefix, word-prefix, every typed word, initials ("rdr" -> Red Dead Redemption), substring, then in-order letters.
// Returns a rank (lower is better) or 9 for no match.
export function matchScore(title, extra, raw) {
  const term = raw.trim().toLowerCase();
  if (!term) return 0;
  const t = title.toLowerCase();
  const words = t.split(/[^a-z0-9]+/).filter(Boolean);
  const compact = term.replace(/\s+/g, '');
  if (t.startsWith(term)) return 0;
  const toks = term.split(/\s+/).filter(Boolean);
  if (toks.every((k) => words.some((w) => w.startsWith(k)))) return 1;
  if (compact.length >= 2 && words.map((w) => w[0]).join('').includes(compact)) return 2;
  if (compact.length === 1) return `${extra || ''}`.toLowerCase().split(/[^a-z0-9]+/).some((w) => w.startsWith(compact)) ? 4 : 9;
  if (t.includes(term)) return 3;
  if (toks.every((k) => `${t} ${extra || ''}`.toLowerCase().includes(k))) return 4;
  if (compact.length >= 3) {
    let i = 0;
    for (const ch of t.replace(/[^a-z0-9]/g, '')) if (ch === compact[i]) i++;
    if (i === compact.length) return 5;
  }
  return 9;
}

function Mark({ text, term }) {
  const t = text.toLowerCase();
  const low = term.trim().toLowerCase();
  const compact = low.replace(/\s+/g, '');
  const hit = new Set();
  const starts = [...t.matchAll(/[a-z0-9]+/g)].map((m) => m.index);
  const mark = (i, n) => { for (let k = i; k < i + n; k++) hit.add(k); };
  const toks = low.split(/\s+/).filter(Boolean);
  const byWord = toks.map((k) => starts.find((i) => t.startsWith(k, i)));
  if (low && byWord.every((i) => i !== undefined)) toks.forEach((k, n) => mark(byWord[n], k.length));
  else if (compact.length >= 2 && starts.map((i) => t[i]).join('').includes(compact)) {
    const at = starts.map((i) => t[i]).join('').indexOf(compact);
    for (let k = 0; k < compact.length; k++) hit.add(starts[at + k]);
  } else if (low && t.includes(low)) mark(t.indexOf(low), low.length);
  else {
    let i = 0;
    [...t].forEach((ch, k) => { if (i < compact.length && ch === compact[i]) { hit.add(k); i++; } });
  }
  return [...text].map((ch, k) => (hit.has(k) ? <mark key={k}>{ch}</mark> : ch));
}

// Search with live recommendations. Typing only suggests; the grid changes when the person presses
// the Search button, Enter, or picks a suggestion.  items: [{ id, title, sub, img, hay }]
export default function SearchBox({ items, value, onChange, onSubmit, placeholder, label }) {
  const uid = useId();
  const box = useRef(null);
  const input = useRef(null);
  const [focus, setFocus] = useState(false);
  const [idx, setIdx] = useState(-1);
  const term = value.trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (!term) return [];
    return items
      .map((it) => ({ it, score: matchScore(it.title, it.hay, term) }))
      .filter((x) => x.score < 9)
      .sort((a, b) => a.score - b.score || a.it.title.localeCompare(b.it.title))
      .slice(0, 6)
      .map((x) => x.it);
  }, [items, term]);

  const open = focus && term.length > 0;
  useEffect(() => setIdx(-1), [term]);
  useEffect(() => {
    if (!focus) return;
    const away = (e) => !box.current?.contains(e.target) && setFocus(false);
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [focus]);

  function run(text) {
    onChange(text);
    onSubmit(text.trim());
    setFocus(false);
    input.current?.blur();
  }

  function key(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!suggestions.length) return;
      e.preventDefault();
      setFocus(true);
      const n = suggestions.length;
      setIdx((i) => (e.key === 'ArrowDown' ? (i + 1) % n : (i - 1 + n) % n));
    } else if (e.key === 'Escape') {
      setFocus(false);
    }
  }

  return (
    <div className="sb" ref={box}>
      <form
        className={`sb-field ${focus ? 'is-focus' : ''}`}
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          run(idx >= 0 && suggestions[idx] ? suggestions[idx].title : value);
        }}
      >
        <MagnifyingGlass size={18} aria-hidden="true" className="sb-ico" />
        <input
          ref={input}
          type="text"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-controls={`${uid}-list`}
          aria-autocomplete="list"
          aria-activedescendant={idx >= 0 ? `${uid}-o${idx}` : undefined}
          autoComplete="off"
          enterKeyHint="search"
          placeholder={placeholder}
          value={value}
          maxLength={60}
          onFocus={() => setFocus(true)}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={key}
        />
        <AnimatePresence initial={false}>
          {value && (
            <motion.button
              type="button"
              className="sb-clear"
              aria-label="Clear search"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.15 }}
              onClick={() => {
                onChange('');
                onSubmit('');
                input.current?.focus();
              }}
            >
              <X size={14} weight="bold" />
            </motion.button>
          )}
        </AnimatePresence>
        <motion.button type="submit" className="btn btn-primary btn-sm sb-go" whileTap={{ scale: 0.95 }}>
          Search
        </motion.button>
      </form>

      <AnimatePresence>
        {open && (
          <motion.div className="sb-pop" initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.22, ease }}>
            {suggestions.length > 0 ? (
              <>
                <p className="sb-head">Suggestions</p>
                <ul id={`${uid}-list`} role="listbox" aria-label="Suggestions">
                  {suggestions.map((s, i) => (
                    <motion.li key={s.id} id={`${uid}-o${i}`} role="option" aria-selected={i === idx} className={`sb-opt ${i === idx ? 'is-on' : ''}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: i * 0.03, ease }} onPointerEnter={() => setIdx(i)} onClick={() => run(s.title)}>
                      {s.img ? <img src={s.img} alt="" width="40" height="50" loading="lazy" referrerPolicy="no-referrer" /> : <span className="sb-noimg" />}
                      <span className="sb-text">
                        <strong>
                          <Mark text={s.title} term={term} />
                        </strong>
                        <small>{s.sub}</small>
                      </span>
                      <ArrowUpLeft size={16} className="sb-fill" aria-hidden="true" />
                    </motion.li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="sb-none" id={`${uid}-list`} role="status">
                No suggestions for “{value.trim()}”.
              </p>
            )}
            <button type="button" className="sb-all" onClick={() => run(value)}>
              <MagnifyingGlass size={16} weight="bold" /> Search for “{value.trim()}”
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
