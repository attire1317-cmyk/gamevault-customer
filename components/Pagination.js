'use client';
import { motion } from 'framer-motion';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { spring } from './motion';

// 1 ... 4 5 6 ... 20
function pagesToShow(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, pages, page - 1, page, page + 1]);
  const list = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out = [];
  list.forEach((n, i) => {
    if (i && n - list[i - 1] > 1) out.push('gap-' + n);
    out.push(n);
  });
  return out;
}

export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <nav className="pager" aria-label="Pagination">
      <motion.button whileTap={{ scale: 0.92 }} className="pager-btn pager-step" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <CaretLeft size={18} weight="bold" />
      </motion.button>
      <div className="pager-nums">
        {pagesToShow(page, pages).map((n) =>
          typeof n === 'string' ? (
            <span key={n} className="pager-gap" aria-hidden="true">
              ...
            </span>
          ) : (
            <motion.button
              key={n}
              whileTap={{ scale: 0.92 }}
              className={`pager-btn ${n === page ? 'is-on' : ''}`}
              onClick={() => onChange(n)}
              aria-label={`Page ${n}`}
              aria-current={n === page ? 'page' : undefined}
            >
              {n === page && <motion.span layoutId="page-pill" className="pager-pill" transition={spring} />}
              <span className="pager-label">{n}</span>
            </motion.button>
          )
        )}
      </div>
      <motion.button whileTap={{ scale: 0.92 }} className="pager-btn pager-step" disabled={page === pages} onClick={() => onChange(page + 1)} aria-label="Next page">
        <CaretRight size={18} weight="bold" />
      </motion.button>
    </nav>
  );
}
